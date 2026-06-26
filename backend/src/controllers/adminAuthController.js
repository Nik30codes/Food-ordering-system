import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db/db.js";
import { blacklistToken } from "../utils/tokenBlacklist.js";

// In-memory store for admin login attempts
const adminLoginAttempts = new Map();

const MAX_ATTEMPTS = 10;
const LOCK_TIME = 30 * 60 * 1000; // 30 minutes

const isAccountLocked = (email) => {
    const attempts = adminLoginAttempts.get(email);
    if (!attempts) return false;

    if (attempts.count >= MAX_ATTEMPTS) {
        const timePassed = Date.now() - attempts.lastAttempt;
        if (timePassed < LOCK_TIME) return true;
        adminLoginAttempts.delete(email);
        return false;
    }
    return false;
};

const recordFailedAttempt = (email) => {
    const attempts = adminLoginAttempts.get(email) || { count: 0, lastAttempt: Date.now() };
    attempts.count += 1;
    attempts.lastAttempt = Date.now();
    adminLoginAttempts.set(email, attempts);
};

const clearAttempts = (email) => {
    adminLoginAttempts.delete(email);
};

const setAdminTokenCookie = (res, token) => {
    res.cookie("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    });
};

// POST /api/admin/auth/register — Register a new admin user (owner only)
export const registerAdmin = async (req, res) => {
    try {
        const { name, email, password, restaurant_id, role } = req.body;

        // Only owners can register new admin users
        if (req.admin.role !== "owner") {
            return res.status(403).json({ message: "Only owners can register new admin users" });
        }

        // Ensure the restaurant belongs to this owner
        if (req.admin.restaurant_id !== restaurant_id) {
            return res.status(403).json({ message: "You can only add staff to your own restaurant" });
        }

        // Check if email already exists
        const existing = await pool.query("SELECT id FROM admin_users WHERE email = $1", [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: "Unable to create account. Please try with different credentials." });
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAdmin = await pool.query(
            "INSERT INTO admin_users (restaurant_id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, restaurant_id, name, email, role, created_at",
            [restaurant_id, name, email, hashedPassword, role]
        );

        res.status(201).json({ message: "Admin user created", admin: newAdmin.rows[0] });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// POST /api/admin/auth/login — Admin login
export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check account lockout
        if (isAccountLocked(email)) {
            const attempts = adminLoginAttempts.get(email);
            const remainingTime = Math.ceil((LOCK_TIME - (Date.now() - attempts.lastAttempt)) / 60000);
            return res.status(423).json({
                message: `Account temporarily locked. Try again in ${remainingTime} minutes.`,
            });
        }

        // Find admin user
        const admin = await pool.query("SELECT * FROM admin_users WHERE email = $1", [email]);
        if (admin.rows.length === 0) {
            recordFailedAttempt(email);
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, admin.rows[0].password_hash);
        if (!isMatch) {
            recordFailedAttempt(email);
            const attempts = adminLoginAttempts.get(email);
            const remaining = MAX_ATTEMPTS - attempts.count;

            if (remaining <= 3 && remaining > 0) {
                return res.status(400).json({
                    message: `Invalid email or password. ${remaining} attempts remaining before lockout.`,
                });
            }

            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Success
        clearAttempts(email);

        const token = jwt.sign(
            { id: admin.rows[0].id, type: "admin" },
            process.env.JWT_SECRET,
            { expiresIn: "3d" }
        );

        setAdminTokenCookie(res, token);

        const { password_hash, ...adminData } = admin.rows[0];
        res.json({ admin: adminData, token });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// POST /api/admin/auth/logout — Admin logout
export const logoutAdmin = (req, res) => {
    if (req.token) {
        blacklistToken(req.token);
    }

    res.clearCookie("admin_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    res.json({ message: "Logged out successfully" });
};

// GET /api/admin/auth/me — Get current admin profile
export const getAdminProfile = async (req, res) => {
    try {
        res.json({ admin: req.admin });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
