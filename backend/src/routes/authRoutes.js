import express from "express";
import { register, login } from "../controllers/authController.js";
import validate from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../utils/validation.js";

const router = express.Router();

// Register
router.post("/register", validate(registerSchema), register);

// Login
router.post("/login", validate(loginSchema), login);

export default router;
