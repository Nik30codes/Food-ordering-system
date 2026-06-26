import crypto from "crypto";
import pool from "../db/db.js";

// POST /api/webhooks/razorpay — Razorpay sends payment events here
export const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify webhook signature
    const signature = req.headers["x-razorpay-signature"];
    const body = req.body.toString();

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("[WEBHOOK] Invalid signature — rejected");
      return res.status(400).json({ message: "Invalid signature" });
    }

    const event = JSON.parse(body);
    const eventType = event.event;

    console.log(`[WEBHOOK] Received: ${eventType}`);

    // Handle payment captured (successful payment)
    if (eventType === "payment.captured") {
      const payment = event.payload.payment.entity;
      const razorpayOrderId = payment.order_id;
      const razorpayPaymentId = payment.id;
      const amount = payment.amount / 100; // Convert paise to rupees

      // Find the order linked to this Razorpay order
      const existingPayment = await pool.query(
        "SELECT id, order_id FROM payments WHERE transaction_id = $1",
        [razorpayOrderId]
      );

      if (existingPayment.rows.length > 0) {
        const orderId = existingPayment.rows[0].order_id;

        // Update payment status
        await pool.query(
          "UPDATE payments SET payment_status = 'completed', transaction_id = $1, updated_at = NOW() WHERE order_id = $2 AND transaction_id = $3",
          [razorpayPaymentId, orderId, razorpayOrderId]
        );

        // Update order status to confirmed
        await pool.query(
          "UPDATE orders SET status = 'confirmed', updated_at = NOW() WHERE id = $1 AND status = 'pending'",
          [orderId]
        );

        console.log(`[WEBHOOK] Payment captured for Order #${orderId} — ₹${amount}`);
      }
    }

    // Handle payment failed
    if (eventType === "payment.failed") {
      const payment = event.payload.payment.entity;
      const razorpayOrderId = payment.order_id;

      const existingPayment = await pool.query(
        "SELECT id, order_id FROM payments WHERE transaction_id = $1",
        [razorpayOrderId]
      );

      if (existingPayment.rows.length > 0) {
        await pool.query(
          "UPDATE payments SET payment_status = 'failed', updated_at = NOW() WHERE id = $1",
          [existingPayment.rows[0].id]
        );

        console.log(`[WEBHOOK] Payment failed for Order #${existingPayment.rows[0].order_id}`);
      }
    }

    // Handle refund processed
    if (eventType === "refund.processed") {
      const refund = event.payload.refund.entity;
      const paymentId = refund.payment_id;

      await pool.query(
        "UPDATE payments SET payment_status = 'refunded', updated_at = NOW() WHERE transaction_id = $1",
        [paymentId]
      );

      console.log(`[WEBHOOK] Refund processed for payment ${paymentId}`);
    }

    // Always respond 200 so Razorpay knows we received it
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("[WEBHOOK] Error:", error.message);
    // Still return 200 to prevent Razorpay from retrying
    res.status(200).json({ received: true });
  }
};
