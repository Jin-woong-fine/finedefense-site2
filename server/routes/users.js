// server/routes/users.js
import express from "express";
import bcrypt from "bcrypt";
import db from "../config/db.js";
import { verifyToken, verifyRole } from "../middleware/auth.js";

const router = express.Router();

/* ============================================================
   📌 사용자 목록 조회 (admin, superadmin)
============================================================ */
router.get(
  "/",
  verifyToken,
  verifyRole("admin", "superadmin"),
  async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT id, username, name, role, created_at
        FROM users
        ORDER BY id ASC
      `);

      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "DB error" });
    }
  }
);

/* ============================================================
   📌 사용자 생성 (superadmin)
============================================================ */
router.post(
  "/",
  verifyToken,
  verifyRole("superadmin"),
  async (req, res) => {
    try {
      const { username, password, name, role } = req.body;

      if (!username || !password || !role) {
        return res.status(400).json({ message: "필수값 누락" });
      }

      const allowedRoles = [
        "superadmin",
        "admin",
        "editor",
        "viewer",
        "contributor",
      ];

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const [exist] = await db.query(
        "SELECT * FROM users WHERE username = ?",
        [username]
      );

      if (exist.length > 0) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hash = await bcrypt.hash(password, 10);

      await db.query(
        `INSERT INTO users (username, password, name, role)
         VALUES (?, ?, ?, ?)`,
        [username, hash, name || "", role]
      );

      res.json({ message: "User created" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "DB error" });
    }
  }
);

/* ============================================================
   📌 역할 변경 (superadmin)
============================================================ */
router.put(
  "/:id/role",
  verifyToken,
  verifyRole("superadmin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const allowedRoles = [
        "superadmin",
        "admin",
        "editor",
        "viewer",
        "contributor",
      ];

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      await db.query(
        `UPDATE users SET role = ? WHERE id = ?`,
        [role, id]
      );

      res.json({ message: "role updated" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "server error" });
    }
  }
);

/* ============================================================
   📌 사용자 삭제 (superadmin)
============================================================ */
router.delete(
  "/:id",
  verifyToken,
  verifyRole("superadmin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      await db.query(`DELETE FROM users WHERE id = ?`, [id]);

      res.json({ message: "deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "DB error" });
    }
  }
);

/* ============================================================
   📌 비밀번호 초기화(변경) — superadmin 전용
============================================================ */
router.put(
  "/:id/reset-password",
  verifyToken,
  verifyRole("superadmin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({ message: "새 비밀번호 필요" });
      }

      const hash = await bcrypt.hash(newPassword, 10);

      await db.query(
        `UPDATE users SET password = ? WHERE id = ?`,
        [hash, id]
      );

      res.json({ message: "password reset complete" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "server error" });
    }
  }
);

export default router;
