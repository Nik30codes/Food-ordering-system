import pool from "../db/db.js";

// POST /api/orders/place — Place order from cart
export const placeOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;

    await client.query("BEGIN");

    // Get user's cart
    const cart = await client.query("SELECT id FROM carts WHERE user_id = $1", [userId]);
    if (cart.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Cart not found" });
    }

    const cartId = cart.rows[0].id;

    // Get cart items
    const cartItems = await client.query(
      "SELECT menu_item_id, quantity, food_type_choice FROM cart_items WHERE cart_id = $1",
      [cartId]
    );

    if (cartItems.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Get prices for each menu item and calculate total
    const menuItemIds = cartItems.rows.map((item) => item.menu_item_id);
    const menuItems = await client.query(
      "SELECT id, price, restaurant_id FROM menu_items WHERE id = ANY($1)",
      [menuItemIds]
    );

    // Build a price map
    const priceMap = {};
    let restaurantId = null;
    for (const item of menuItems.rows) {
      priceMap[item.id] = parseFloat(item.price);
      if (!restaurantId) restaurantId = item.restaurant_id;
    }

    // Verify all items have prices (exist in menu)
    for (const cartItem of cartItems.rows) {
      if (priceMap[cartItem.menu_item_id] === undefined) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: `Menu item ${cartItem.menu_item_id} not found or unavailable`,
        });
      }
    }

    // Calculate total
    let totalAmount = 0;
    for (const cartItem of cartItems.rows) {
      totalAmount += priceMap[cartItem.menu_item_id] * cartItem.quantity;
    }

    // Create order
    const order = await client.query(
      "INSERT INTO orders (user_id, restaurant_id, total_amount, status, created_at, updated_at) VALUES ($1, $2, $3, 'pending', NOW(), NOW()) RETURNING *",
      [userId, restaurantId, totalAmount]
    );

    const orderId = order.rows[0].id;

    // Copy cart items to order items (with price snapshot)
    for (const cartItem of cartItems.rows) {
      await client.query(
        "INSERT INTO order_items (order_id, menu_item_id, quantity, price, food_type_choice, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())",
        [orderId, cartItem.menu_item_id, cartItem.quantity, priceMap[cartItem.menu_item_id], cartItem.food_type_choice]
      );
    }

    // Clear the cart
    await client.query("DELETE FROM cart_items WHERE cart_id = $1", [cartId]);
    await client.query("UPDATE carts SET updated_at = NOW() WHERE id = $1", [cartId]);

    await client.query("COMMIT");

    res.status(201).json({
      message: "Order placed successfully",
      order: order.rows[0],
      items_count: cartItems.rows.length,
      total_amount: totalAmount,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    client.release();
  }
};

// GET /api/orders — Get user's order history
export const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await pool.query(
      "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    // Get items for each order
    const ordersWithItems = [];
    for (const order of orders.rows) {
      const items = await pool.query(
        `SELECT oi.menu_item_id, oi.quantity, oi.price, mi.name
         FROM order_items oi
         LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
         WHERE oi.order_id = $1`,
        [order.id]
      );
      ordersWithItems.push({ ...order, items: items.rows });
    }

    res.json({ orders: ordersWithItems });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/orders/:orderId — Get single order with items
export const getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.orderId);

    if (isNaN(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    // Get order (verify ownership)
    const order = await pool.query(
      "SELECT * FROM orders WHERE id = $1 AND user_id = $2",
      [orderId, userId]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Get order items
    const items = await pool.query(
      "SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC",
      [orderId]
    );

    res.json({ order: order.rows[0], items: items.rows });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/orders/:orderId/status — Get order status
export const getOrderStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.orderId);

    if (isNaN(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await pool.query(
      "SELECT id, status, created_at, updated_at FROM orders WHERE id = $1 AND user_id = $2",
      [orderId, userId]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ order_id: orderId, status: order.rows[0].status, updated_at: order.rows[0].updated_at });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/orders/:orderId/cancel — Cancel order and restore items to cart
export const cancelOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.orderId);

    if (isNaN(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    await client.query("BEGIN");

    // Get order (verify ownership and status)
    const order = await client.query(
      "SELECT * FROM orders WHERE id = $1 AND user_id = $2",
      [orderId, userId]
    );

    if (order.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Order not found" });
    }

    // Only allow cancellation of pending orders
    if (order.rows[0].status !== "pending") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: `Cannot cancel order with status '${order.rows[0].status}'. Only pending orders can be cancelled.`,
      });
    }

    // Get order items to restore to cart
    const orderItems = await client.query(
      "SELECT menu_item_id, quantity FROM order_items WHERE order_id = $1",
      [orderId]
    );

    // Get or create user's cart
    let cart = await client.query("SELECT id FROM carts WHERE user_id = $1", [userId]);
    if (cart.rows.length === 0) {
      cart = await client.query(
        "INSERT INTO carts (user_id, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id",
        [userId]
      );
    }
    const cartId = cart.rows[0].id;

    // Restore items back to cart (upsert — add to existing quantity if item already in cart)
    for (const item of orderItems.rows) {
      const existing = await client.query(
        "SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND menu_item_id = $2",
        [cartId, item.menu_item_id]
      );

      if (existing.rows.length > 0) {
        await client.query(
          "UPDATE cart_items SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2",
          [item.quantity, existing.rows[0].id]
        );
      } else {
        await client.query(
          "INSERT INTO cart_items (cart_id, menu_item_id, quantity, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())",
          [cartId, item.menu_item_id, item.quantity]
        );
      }
    }

    // Update order status to cancelled
    await client.query(
      "UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
      [orderId]
    );

    // Update cart timestamp
    await client.query("UPDATE carts SET updated_at = NOW() WHERE id = $1", [cartId]);

    await client.query("COMMIT");

    res.json({ message: "Order cancelled, items restored to cart" });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    client.release();
  }
};
