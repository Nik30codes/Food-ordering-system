import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import { requireRole } from "../middleware/adminAuth.js";
import validate from "../middleware/validate.js";
import { createTableSchema, updateTableSchema } from "../utils/adminValidation.js";
import { getTables, getTableById, createTable, updateTable, deleteTable, toggleTable } from "../controllers/tableController.js";

const router = express.Router();

// All routes require admin auth
router.get("/", adminAuth, getTables);
router.get("/:id", adminAuth, getTableById);
router.post("/", adminAuth, requireRole("owner", "manager"), validate(createTableSchema), createTable);
router.put("/:id", adminAuth, requireRole("owner", "manager"), validate(updateTableSchema), updateTable);
router.delete("/:id", adminAuth, requireRole("owner", "manager"), deleteTable);
router.put("/:id/toggle", adminAuth, toggleTable);

export default router;
