import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// ========================================
//  로그인
// ========================================
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "3h" }
    );

    res.json({ token, role: user.role, name: user.name });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ========================================
//  관리자 계정 최초 생성 (초기 1회)
// ========================================
router.post("/register-admin", async (req, res) => {
  try {
    const { username, password, name } = req.body;

    // 1) 중복 계정 체크
    const [exist] = await pool.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    if (exist.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 2) 비밀번호 암호화
    const hash = await bcrypt.hash(password, 10);

    // 3) DB 저장
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
