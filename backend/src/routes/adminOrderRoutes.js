import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import validate from "../middleware/validate.js";
import { updateOrderStatusSchema } from "../utils/adminValidation.js";
import { getRestaurantOrders, getOrderDetails, updateOrderStatus } from "../controllers/adminOrderController.js";

const router = express.Router();

// All routes require admin auth
router.get("/", adminAuth, getRestaurantOrders);
router.get("/:orderId", adminAuth, getOrderDetails);
router.put("/:orderId/status", adminAuth, validate(updateOrderStatusSchema), updateOrderStatus);

export default router;
