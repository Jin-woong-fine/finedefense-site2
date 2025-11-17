import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import dotenv from "dotenv";
import { verifyToken } from "../middleware/auth.js";
dotenv.config();

const router = express.Router();

/* ============================================================
   🔐 로그인
============================================================ */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "아이디와 비밀번호를 입력하세요." });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "서버 설정 오류 (JWT_SECRET 없음)" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      token,
      id: user.id,
      role: user.role,
      name: user.name,
    });

  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ============================================================
   👑 관리자 생성 (관리자 전용)
============================================================ */
router.post("/register-admin", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "권한 없음" });
    }

    const { username, password, name } = req.body;

    const [exist] = await pool.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (exist.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, 'admin')",
      [username, hash, name]
    );

    res.json({ message: "Admin created" });

  } catch (err) {
    console.error("❌ Register Admin Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
