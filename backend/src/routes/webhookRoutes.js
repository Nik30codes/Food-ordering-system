import express from "express";
import { handleRazorpayWebhook } from "../controllers/webhookController.js";

const router = express.Router();

// Razorpay sends raw body — don't parse JSON on this route
router.post("/razorpay", express.raw({ type: "application/json" }), handleRazorpayWebhook);

export default router;
