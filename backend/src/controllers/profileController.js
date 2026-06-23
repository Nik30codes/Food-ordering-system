import bcrypt from "bcrypt";
import pool from "../db/db.js";

// GET /api/profile — Get current user's profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await pool.query(
      "SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1",
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: user.rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/profile — Update user's profile (name, phone)
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone } = req.body;

    const updated = await pool.query(
      "UPDATE users SET name = $1, phone = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, email, phone, role, created_at, updated_at",
      [name, phone, userId]
    );

    res.json({ message: "Profile updated", user: updated.rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/profile/password — Change password
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    // Get current password hash
    const user = await pool.query("SELECT password_hash FROM users WHERE id = $1", [userId]);

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(current_password, user.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [hashedPassword, userId]
    );

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/profile/orders — Get user's order history with items and payment details
export const getOrderHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all orders for the user
    const orders = await pool.query(
      "SELECT id, total_amount, status, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    if (orders.rows.length === 0) {
      return res.json({ orders: [], message: "No orders yet" });
    }

    // For each order, get items and payment info
    const orderHistory = [];

    for (const order of orders.rows) {
      // Get order items
      const items = await pool.query(
        "SELECT menu_item_id, quantity, price FROM order_items WHERE order_id = $1",
        [order.id]
      );

      // Get payment details
      const payment = await pool.query(
        "SELECT amount, payment_method, payment_status, transaction_id, created_at AS paid_at FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1",
        [order.id]
      );

      orderHistory.push({
        order_id: order.id,
        total_amount: order.total_amount,
        status: order.status,
        ordered_at: order.created_at,
        items: items.rows,
        payment: payment.rows.length > 0 ? payment.rows[0] : null,
      });
    }

    res.json({ orders: orderHistory });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
