CREATE TABLE IF NOT EXISTS analytics_summary (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_orders INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  average_order_value NUMERIC DEFAULT 0
);
