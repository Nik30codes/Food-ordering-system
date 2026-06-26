import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import { requireRole } from "../middleware/adminAuth.js";
import validate from "../middleware/validate.js";
import { createCategorySchema, updateCategorySchema, reorderCategoriesSchema } from "../utils/adminValidation.js";
import {
    getCategories, getCategoryById, createCategory,
    updateCategory, deleteCategory, reorderCategories,
} from "../controllers/categoryController.js";

const router = express.Router();

// All routes require admin auth
router.get("/", adminAuth, getCategories);
router.get("/:id", adminAuth, getCategoryById);
router.post("/", adminAuth, requireRole("owner", "manager"), validate(createCategorySchema), createCategory);
router.put("/reorder", adminAuth, requireRole("owner", "manager"), validate(reorderCategoriesSchema), reorderCategories);
router.put("/:id", adminAuth, requireRole("owner", "manager"), validate(updateCategorySchema), updateCategory);
router.delete("/:id", adminAuth, requireRole("owner", "manager"), deleteCategory);

export default router;
