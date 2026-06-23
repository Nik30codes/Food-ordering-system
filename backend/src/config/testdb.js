import pool from "../db/db.js";

async function testConnection() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("Database connected successfully!");
    console.log("Current time from DB:", result.rows[0].now);
  } catch (error) {
    console.error("Database connection failed:", error.message);
  } finally {
    await pool.end();
  }
}

testConnection();
