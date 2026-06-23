import express from "express";
import auth from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { updateProfileSchema, changePasswordSchema } from "../utils/validation.js";
import { getProfile, updateProfile, changePassword, getOrderHistory } from "../controllers/profileController.js";

const router = express.Router();

// All profile routes are protected
router.get("/", auth, getProfile);
router.put("/", auth, validate(updateProfileSchema), updateProfile);
router.put("/password", auth, validate(changePasswordSchema), changePassword);
router.get("/orders", auth, getOrderHistory);

export default router;
