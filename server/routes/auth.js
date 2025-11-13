import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// ✅ 로그인
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE username=?", [username]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "3h" }
    );

    res.json({ token, role: user.role, name: user.name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ 테스트용 관리자 등록 (초기 1회만)
router.post("/register-admin", async (req, res) => {
  const { username, password, name } = req.body;
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    "INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, 'admin')",
    [username, hash, name]
  );
  res.json({ message: "Admin created" });
});

export default router;
