import pool from "../db/db.js";

// GET /api/admin/orders — Get all orders for the restaurant
export const getRestaurantOrders = async (req, res) => {
    try {
        const restaurantId = req.admin.restaurant_id;

        // Optional status filter
        const status = req.query.status || null;

        let query = `
      SELECT o.*, u.name as customer_name, u.phone as customer_phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.restaurant_id = $1
    `;
        const params = [restaurantId];

        if (status) {
            query += " AND o.status = $2";
            params.push(status);
        }

        query += " ORDER BY o.created_at DESC";

        const orders = await pool.query(query, params);

        res.json({ orders: orders.rows });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// GET /api/admin/orders/:orderId — Get order details with items
export const getOrderDetails = async (req, res) => {
    try {
        const restaurantId = req.admin.restaurant_id;
        const orderId = parseInt(req.params.orderId);

        if (isNaN(orderId)) {
            return res.status(400).json({ message: "Invalid order ID" });
        }

        const order = await pool.query(
            `SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1 AND o.restaurant_id = $2`,
            [orderId, restaurantId]
        );

        if (order.rows.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Get order items with menu item names
        const items = await pool.query(
            `SELECT oi.*, mi.name as item_name, mi.image_url
       FROM order_items oi
       LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE oi.order_id = $1`,
            [orderId]
        );

        // Get payment info
        const payment = await pool.query(
            "SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1",
            [orderId]
        );

        // Get status history
        const statusHistory = await pool.query(
            "SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC",
            [orderId]
        );

        res.json({
            order: order.rows[0],
            items: items.rows,
            payment: payment.rows.length > 0 ? payment.rows[0] : null,
            status_history: statusHistory.rows,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// PUT /api/admin/orders/:orderId/status — Update order status
export const updateOrderStatus = async (req, res) => {
    const client = await pool.connect();

    try {
        const restaurantId = req.admin.restaurant_id;
        const orderId = parseInt(req.params.orderId);
        const { status, remarks } = req.body;

        if (isNaN(orderId)) {
            return res.status(400).json({ message: "Invalid order ID" });
        }

        await client.query("BEGIN");

        // Verify order belongs to this restaurant
        const order = await client.query(
            "SELECT id, status FROM orders WHERE id = $1 AND restaurant_id = $2",
            [orderId, restaurantId]
        );

        if (order.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Order not found" });
        }

        // Update order status
        await client.query(
            "UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2",
            [status, orderId]
        );

        // Record in status history
        await client.query(
            "INSERT INTO order_status_history (order_id, status, changed_by, remarks, created_at) VALUES ($1, $2, $3, $4, NOW())",
            [orderId, status, req.admin.name, remarks || null]
        );

        await client.query("COMMIT");

        res.json({ message: `Order status updated to '${status}'`, order_id: orderId, status });
    } catch (error) {
        await client.query("ROLLBACK");
        res.status(500).json({ message: "Server error", error: error.message });
    } finally {
        client.release();
    }
};
