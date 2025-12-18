// server/routes/login_logs.js
import express from "express";
import db from "../config/db.js";
import { verifyToken, verifyRole } from "../middleware/auth.js";

const router = express.Router();

/* ============================================================
   로그인 기록 조회 (admin, superadmin)
============================================================ */
router.get(
  "/",
  verifyToken,
  verifyRole("admin", "superadmin"),
  async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT 
          id,
          user_id,
          username,
          ip,
          ua,
          status,
          fail_reason,
          is_admin,
          country_code,
          created_at
        FROM login_logs
        ORDER BY id DESC
        LIMIT 500
      `);

      res.json(rows);
    } catch (err) {
      console.error("login_logs error:", err);
      res.status(500).json({ message: "DB error" });
    }
  }
);

export default router;
