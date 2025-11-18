import express from "express";
import db from "../config/db.js";
import { verifyToken, verifyRole } from "../middleware/auth.js";

const router = express.Router();

/* ============================================================
   📌 로그인 기록 조회
   admin → 본인 기록만
   superadmin → 전체 기록 조회
============================================================ */
router.get("/login", verifyToken, verifyRole("admin", "superadmin"), async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;

    let rows;

    if (role === "superadmin") {
      [rows] = await db.query(`
        SELECT * FROM login_logs ORDER BY id DESC
      `);
    } else {
      [rows] = await db.query(`
        SELECT * FROM login_logs 
        WHERE user_id = ?
        ORDER BY id DESC
      `, [userId]);
    }

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error" });
  }
});

export default router;
