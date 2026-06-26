import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import { requireRole } from "../middleware/adminAuth.js";
import validate from "../middleware/validate.js";
import { createMenuItemSchema, updateMenuItemSchema } from "../utils/adminValidation.js";
import {
    getMenuItems, getMenuItemById, createMenuItem,
    updateMenuItem, deleteMenuItem, toggleAvailability, toggleFeatured,
    addMenuItemImage, removeMenuItemImage,
} from "../controllers/menuItemController.js";

const router = express.Router();

// All routes require admin auth
router.get("/", adminAuth, getMenuItems);
router.get("/:id", adminAuth, getMenuItemById);
router.post("/", adminAuth, requireRole("owner", "manager"), validate(createMenuItemSchema), createMenuItem);
router.put("/:id", adminAuth, requireRole("owner", "manager"), validate(updateMenuItemSchema), updateMenuItem);
router.delete("/:id", adminAuth, requireRole("owner", "manager"), deleteMenuItem);
router.put("/:id/availability", adminAuth, toggleAvailability);
router.put("/:id/featured", adminAuth, toggleFeatured);
router.post("/:id/images", adminAuth, requireRole("owner", "manager"), addMenuItemImage);
router.delete("/:id/images/:imageId", adminAuth, requireRole("owner", "manager"), removeMenuItemImage);

export default router;
