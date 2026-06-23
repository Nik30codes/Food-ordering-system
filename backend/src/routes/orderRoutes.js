import express from "express";
import auth from "../middleware/auth.js";
import { placeOrder, getOrders, getOrderById, getOrderStatus, cancelOrder } from "../controllers/orderController.js";

const router = express.Router();

// All order routes are protected
router.post("/place", auth, placeOrder);
router.get("/", auth, getOrders);
router.get("/:orderId", auth, getOrderById);
router.get("/:orderId/status", auth, getOrderStatus);
router.post("/:orderId/cancel", auth, cancelOrder);

export default router;
