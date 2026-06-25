CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  discount_price NUMERIC,
  image_url TEXT,
  is_veg BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  preparation_time INTEGER,
  calories INTEGER,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
