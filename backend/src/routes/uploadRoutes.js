import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import upload from "../middleware/upload.js";
import { uploadImage, deleteImage } from "../controllers/uploadController.js";

const router = express.Router();

// Upload image (admin only, max 5MB, images only)
router.post("/", adminAuth, upload.single("image"), uploadImage);

// Delete image (admin only)
router.delete("/", adminAuth, deleteImage);

export default router;
