import pool from "../db/db.js";

// GET /api/admin/analytics/summary — Get analytics summary (today, week, month)
export const getAnalyticsSummary = async (req, res) => {
    try {
        const restaurantId = req.admin.restaurant_id;

        // Today's stats (only count accepted/completed orders, not pending/cancelled)
        const today = await pool.query(
            `SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as average_order_value
      FROM orders
      WHERE restaurant_id = $1 AND DATE(created_at) = CURRENT_DATE AND status NOT IN ('pending', 'cancelled')`,
            [restaurantId]
        );

        // This week's stats
        const week = await pool.query(
            `SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as average_order_value
      FROM orders
      WHERE restaurant_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days' AND status NOT IN ('pending', 'cancelled')`,
            [restaurantId]
        );

        // This month's stats
        const month = await pool.query(
            `SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as average_order_value
      FROM orders
      WHERE restaurant_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '30 days' AND status NOT IN ('pending', 'cancelled')`,
            [restaurantId]
        );

        res.json({
            today: today.rows[0],
            this_week: week.rows[0],
            this_month: month.rows[0],
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// GET /api/admin/analytics/daily — Get daily analytics for a date range
export const getDailyAnalytics = async (req, res) => {
    try {
        const restaurantId = req.admin.restaurant_id;
        const days = parseInt(req.query.days) || 30;

        const analytics = await pool.query(
            `SELECT
        DATE(created_at) as date,
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as average_order_value
      FROM orders
      WHERE restaurant_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '1 day' * $2 AND status NOT IN ('pending', 'cancelled')
      GROUP BY DATE(created_at)
      ORDER BY date DESC`,
            [restaurantId, days]
        );

        res.json({ analytics: analytics.rows, period_days: days });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// GET /api/admin/analytics/popular-items — Get most popular menu items
export const getPopularItems = async (req, res) => {
    try {
        const restaurantId = req.admin.restaurant_id;
        const limit = parseInt(req.query.limit) || 10;

        const popular = await pool.query(
            `SELECT
        mi.id, mi.name, mi.price, mi.image_url, mi.is_veg,
        COUNT(oi.id) as times_ordered,
        SUM(oi.quantity) as total_quantity
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN orders o ON oi.order_id = o.id
      WHERE mi.restaurant_id = $1 AND o.status != 'cancelled'
      GROUP BY mi.id, mi.name, mi.price, mi.image_url, mi.is_veg
      ORDER BY total_quantity DESC
      LIMIT $2`,
            [restaurantId, limit]
        );

        res.json({ popular_items: popular.rows });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// GET /api/admin/analytics/revenue — Revenue breakdown by payment status
export const getRevenueBreakdown = async (req, res) => {
    try {
        const restaurantId = req.admin.restaurant_id;

        const revenue = await pool.query(
            `SELECT
        p.payment_status,
        COUNT(*) as count,
        COALESCE(SUM(p.amount), 0) as total_amount
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE o.restaurant_id = $1
      GROUP BY p.payment_status`,
            [restaurantId]
        );

        res.json({ revenue_breakdown: revenue.rows });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
