// server/db.js
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "finedefense_user",
  password: "YOUR_PASSWORD",
  database: "finedefense",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
