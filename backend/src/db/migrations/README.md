# Database Migrations

Run these SQL files in order against your PostgreSQL database to set up the schema.

## How to run

```bash
# Connect to your database and run each file in order:
psql -U postgres -d food_ordering_db -f src/db/migrations/001_create_users.sql
psql -U postgres -d food_ordering_db -f src/db/migrations/002_create_carts.sql
psql -U postgres -d food_ordering_db -f src/db/migrations/003_create_cart_items.sql
psql -U postgres -d food_ordering_db -f src/db/migrations/004_create_orders.sql
psql -U postgres -d food_ordering_db -f src/db/migrations/005_create_order_items.sql
psql -U postgres -d food_ordering_db -f src/db/migrations/006_create_payments.sql
```

## Notes
- Files use `CREATE TABLE IF NOT EXISTS` so they're safe to run multiple times.
- Run them in numerical order since later tables reference earlier ones (foreign keys).
- The admin team may add more migrations for `menu_items`, `restaurants`, `categories`, etc.
