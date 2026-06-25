import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import { requireRole } from "../middleware/adminAuth.js";
import { getAnalyticsSummary, getDailyAnalytics, getPopularItems, getRevenueBreakdown } from "../controllers/analyticsController.js";

const router = express.Router();

// All routes require admin auth — only owner and manager can view analytics
router.get("/summary", adminAuth, requireRole("owner", "manager"), getAnalyticsSummary);
router.get("/daily", adminAuth, requireRole("owner", "manager"), getDailyAnalytics);
router.get("/popular-items", adminAuth, requireRole("owner", "manager"), getPopularItems);
router.get("/revenue", adminAuth, requireRole("owner", "manager"), getRevenueBreakdown);

export default router;
