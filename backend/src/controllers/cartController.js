import pool from "../db/db.js";

// Get or create cart for the authenticated user
const getOrCreateCart = async (userId) => {
  let cart = await pool.query("SELECT * FROM carts WHERE user_id = $1", [userId]);

  if (cart.rows.length === 0) {
    cart = await pool.query(
      "INSERT INTO carts (user_id, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING *",
      [userId]
    );
  }

  return cart.rows[0];
};

// GET /api/cart — Get user's cart with all items
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await getOrCreateCart(userId);

    const items = await pool.query(
      `SELECT ci.id, ci.menu_item_id, ci.quantity, ci.food_type_choice, ci.created_at,
              mi.name, mi.price, mi.discount_price, mi.image_url
       FROM cart_items ci
       LEFT JOIN menu_items mi ON ci.menu_item_id = mi.id
       WHERE ci.cart_id = $1
       ORDER BY ci.created_at DESC`,
      [cart.id]
    );

    res.json({ cart_id: cart.id, items: items.rows });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/cart/add — Add item to cart (upsert: increment if exists)
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { menu_item_id, quantity, food_type_choice } = req.body;

    const cart = await getOrCreateCart(userId);

    // Check if item already exists in cart (same item + same food type choice)
    const existingItem = await pool.query(
      "SELECT * FROM cart_items WHERE cart_id = $1 AND menu_item_id = $2 AND (food_type_choice = $3 OR (food_type_choice IS NULL AND $3 IS NULL))",
      [cart.id, menu_item_id, food_type_choice || null]
    );

    let item;
    if (existingItem.rows.length > 0) {
      // Increment quantity
      const newQuantity = existingItem.rows[0].quantity + quantity;
      item = await pool.query(
        "UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
        [newQuantity, existingItem.rows[0].id]
      );
    } else {
      // Insert new item
      item = await pool.query(
        "INSERT INTO cart_items (cart_id, menu_item_id, quantity, food_type_choice, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *",
        [cart.id, menu_item_id, quantity, food_type_choice || null]
      );
    }

    // Update cart's updated_at
    await pool.query("UPDATE carts SET updated_at = NOW() WHERE id = $1", [cart.id]);

    res.status(201).json({ message: "Item added to cart", item: item.rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/cart/update — Update item quantity (set to 0 removes it)
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { item_id, quantity } = req.body;

    // Verify the item belongs to this user's cart
    const ownership = await pool.query(
      `SELECT ci.id FROM cart_items ci
       JOIN carts c ON ci.cart_id = c.id
       WHERE ci.id = $1 AND c.user_id = $2`,
      [item_id, userId]
    );

    if (ownership.rows.length === 0) {
      return res.status(404).json({ message: "Item not found in your cart" });
    }

    // If quantity is 0 or less, remove the item
    if (quantity <= 0) {
      await pool.query("DELETE FROM cart_items WHERE id = $1", [item_id]);
      return res.json({ message: "Item removed from cart" });
    }

    const updated = await pool.query(
      "UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [quantity, item_id]
    );

    // Update cart's updated_at
    await pool.query(
      "UPDATE carts SET updated_at = NOW() WHERE id = (SELECT cart_id FROM cart_items WHERE id = $1)",
      [item_id]
    );

    res.json({ message: "Cart updated", item: updated.rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE /api/cart/remove/:itemId — Remove specific item from cart
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = parseInt(req.params.itemId);

    if (isNaN(itemId)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    // Verify ownership before deleting
    const ownership = await pool.query(
      `SELECT ci.id FROM cart_items ci
       JOIN carts c ON ci.cart_id = c.id
       WHERE ci.id = $1 AND c.user_id = $2`,
      [itemId, userId]
    );

    if (ownership.rows.length === 0) {
      return res.status(404).json({ message: "Item not found in your cart" });
    }

    await pool.query("DELETE FROM cart_items WHERE id = $1", [itemId]);

    // Update cart's updated_at
    await pool.query(
      "UPDATE carts SET updated_at = NOW() WHERE user_id = $1",
      [userId]
    );

    res.json({ message: "Item removed from cart" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE /api/cart/clear — Empty the entire cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await pool.query("SELECT id FROM carts WHERE user_id = $1", [userId]);

    if (cart.rows.length === 0) {
      return res.json({ message: "Cart is already empty" });
    }

    await pool.query("DELETE FROM cart_items WHERE cart_id = $1", [cart.rows[0].id]);

    // Update cart's updated_at
    await pool.query("UPDATE carts SET updated_at = NOW() WHERE id = $1", [cart.rows[0].id]);

    res.json({ message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
