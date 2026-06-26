import express from "express";
import pool from "../db/db.js";

const router = express.Router();

// GET /api/menu/categories — Public: get all active categories
router.get("/categories", async (req, res) => {
    try {
        const categories = await pool.query(
            "SELECT id, restaurant_id, name, description, image_url, display_order FROM categories WHERE is_active = TRUE ORDER BY display_order ASC, created_at ASC"
        );
        res.json({ categories: categories.rows });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// GET /api/menu/items — Public: get all available menu items
router.get("/items", async (req, res) => {
    try {
        const categoryId = req.query.category_id ? parseInt(req.query.category_id) : null;

        let query = `
      SELECT mi.id, mi.restaurant_id, mi.category_id, mi.name, mi.description,
             mi.price, mi.discount_price, mi.image_url, mi.is_veg, mi.is_available,
             mi.preparation_time, mi.calories, mi.display_order,
             c.name as category_name
      FROM menu_items mi
      JOIN categories c ON mi.category_id = c.id
      WHERE mi.is_available = TRUE AND c.is_active = TRUE
    `;
        const params = [];

        if (categoryId) {
            params.push(categoryId);
            query += ` AND mi.category_id = $${params.length}`;
        }

        query += " ORDER BY mi.display_order ASC, mi.created_at DESC";

        const items = await pool.query(query, params);
        res.json({ menu_items: items.rows });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

export default router;
