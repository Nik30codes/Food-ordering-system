import express from "express";
import auth from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { createPaymentSchema, verifyPaymentSchema, refundPaymentSchema } from "../utils/validation.js";
import {
  createPaymentOrder,
  verifyPayment,
  getPaymentStatus,
  refundPayment,
} from "../controllers/paymentController.js";

const router = express.Router();

// All payment routes are protected
router.post("/create-order", auth, validate(createPaymentSchema), createPaymentOrder);
router.post("/verify", auth, validate(verifyPaymentSchema), verifyPayment);
router.get("/:orderId", auth, getPaymentStatus);
router.post("/refund", auth, validate(refundPaymentSchema), refundPayment);

export default router;
