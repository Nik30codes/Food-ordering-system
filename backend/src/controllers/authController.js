import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db/db.js";
import { blacklistToken } from "../utils/tokenBlacklist.js";

// In-memory store for login attempts (use Redis in production)
const loginAttempts = new Map();

const MAX_ATTEMPTS = 10;
const LOCK_TIME = 30 * 60 * 1000; // 30 minutes

// Check if account is locked
const isAccountLocked = (email) => {
  const attempts = loginAttempts.get(email);
  if (!attempts) return false;

  if (attempts.count >= MAX_ATTEMPTS) {
    const timePassed = Date.now() - attempts.lastAttempt;
    if (timePassed < LOCK_TIME) {
      return true;
    }
    // Lock time expired, reset
    loginAttempts.delete(email);
    return false;
  }
  return false;
};

// Record a failed login attempt
const recordFailedAttempt = (email) => {
  const attempts = loginAttempts.get(email) || { count: 0, lastAttempt: Date.now() };
  attempts.count += 1;
  attempts.lastAttempt = Date.now();
  loginAttempts.set(email, attempts);
};

// Clear login attempts on success
const clearAttempts = (email) => {
  loginAttempts.delete(email);
};

// Helper to set HTTP-only cookie
const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
  });
};

// Register a new user
export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const userExists = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "Unable to create account. Please try with different credentials." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user (column is password_hash in DB)
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password_hash, phone) VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone",
      [name, email, hashedPassword, phone]
    );

    // Generate token
    const token = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: "3d",
    });

    // Set HTTP-only cookie
    setTokenCookie(res, token);

    res.status(201).json({ user: newUser.rows[0], token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check account lockout
    if (isAccountLocked(email)) {
      const attempts = loginAttempts.get(email);
      const remainingTime = Math.ceil((LOCK_TIME - (Date.now() - attempts.lastAttempt)) / 60000);
      return res.status(423).json({
        message: `Account temporarily locked. Try again in ${remainingTime} minutes.`,
      });
    }

    // Check if user exists
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) {
      recordFailedAttempt(email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare password (using password_hash column)
    const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isMatch) {
      recordFailedAttempt(email);
      const attempts = loginAttempts.get(email);
      const remaining = MAX_ATTEMPTS - attempts.count;

      if (remaining <= 3 && remaining > 0) {
        return res.status(400).json({
          message: `Invalid email or password. ${remaining} attempts remaining before lockout.`,
        });
      }

      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Success — clear failed attempts
    clearAttempts(email);

    // Generate token
    const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: "3d",
    });

    // Set HTTP-only cookie
    setTokenCookie(res, token);

    const { password_hash, ...userData } = user.rows[0];
    res.json({ user: userData, token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Logout user (clear cookie + blacklist token)
export const logout = (req, res) => {
  // Blacklist the current token so it can't be reused
  if (req.token) {
    blacklistToken(req.token);
  }

  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.json({ message: "Logged out successfully" });
};
