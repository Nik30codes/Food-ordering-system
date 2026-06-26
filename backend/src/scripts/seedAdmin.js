import bcrypt from "bcrypt";
import pool from "../db/db.js";
import dotenv from "dotenv";

dotenv.config();

async function seedAdmin() {
    try {
        // First, create a restaurant
        const restaurant = await pool.query(
            `INSERT INTO restaurants (name, description, email, phone, address, city, state, postal_code, opening_time, closing_time, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, NOW(), NOW())
       ON CONFLICT DO NOTHING
       RETURNING *`,
            [
                "Akio Restaurant",
                "Premium fine dining experience",
                "admin@akio.com",
                "9876543210",
                "123 Food Street",
                "New Delhi",
                "Delhi",
                "110001",
                "09:00",
                "23:00",
            ]
        );

        let restaurantId;
        if (restaurant.rows.length > 0) {
            restaurantId = restaurant.rows[0].id;
            console.log("✅ Restaurant created:", restaurant.rows[0].name, "(ID:", restaurantId, ")");
        } else {
            // Restaurant might already exist, get the first one
            const existing = await pool.query("SELECT id, name FROM restaurants LIMIT 1");
            if (existing.rows.length > 0) {
                restaurantId = existing.rows[0].id;
                console.log("ℹ️  Using existing restaurant:", existing.rows[0].name, "(ID:", restaurantId, ")");
            } else {
                console.error("❌ Failed to create or find restaurant");
                process.exit(1);
            }
        }

        // Create owner admin user
        const adminEmail = "admin@akio.com";
        const adminPassword = "Admin@123";

        // Check if admin already exists
        const existingAdmin = await pool.query("SELECT id FROM admin_users WHERE email = $1", [adminEmail]);
        if (existingAdmin.rows.length > 0) {
            console.log("ℹ️  Admin user already exists with email:", adminEmail);
            console.log("\n📋 Login credentials:");
            console.log("   Email:", adminEmail);
            console.log("   Password:", adminPassword);
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        const admin = await pool.query(
            "INSERT INTO admin_users (restaurant_id, name, email, password_hash, role, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, name, email, role",
            [restaurantId, "Bhavya", adminEmail, hashedPassword, "owner"]
        );

        console.log("✅ Admin user created:", admin.rows[0]);
        console.log("\n📋 Login credentials:");
        console.log("   Email:", adminEmail);
        console.log("   Password:", adminPassword);
        console.log("\n🔗 Login endpoint: POST http://localhost:5000/api/admin/auth/login");
        console.log('   Body: { "email": "admin@akio.com", "password": "Admin@123" }');
    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

seedAdmin();
