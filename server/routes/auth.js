// /server/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import dotenv from "dotenv";
import requestIp from "request-ip";
import { verifyToken, verifyRole } from "../middleware/auth.js";

import { getGeoInfo } from "../utils/geoip.js";
import { logLogin } from "../utils/logLogin.js";

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

  try {
    // ✅ 공통 정보 (한 번만)
    const ip = requestIp.getClientIp(req);
    const ua = req.headers["user-agent"] || "";
    const geo = getGeoInfo(ip);

    const [rows] = await db.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    /* 🔴 사용자 없음 */
    if (rows.length === 0) {
      await logLogin({
        username,
        ip,
        ua,
        status: "fail",
        fail_reason: "user_not_found",
        ...geo
      });
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    /* 🔴 비밀번호 틀림 */
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await logLogin({
        user_id: user.id,
        username: user.username,
        ip,
        ua,
        status: "fail",
        fail_reason: "wrong_password",
        is_admin: ["admin", "superadmin"].includes(user.role) ? 1 : 0,
        ...geo
      });
      return res.status(401).json({ message: "Invalid password" });
    }

    /* 🟢 로그인 성공 */
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username, // ⭐⭐⭐ 핵심
        name: user.name,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );


    const decoded = jwt.decode(token);

    await logLogin({
      user_id: user.id,
      username: user.username,
      ip,
      ua,
      status: "success",
      is_admin: ["admin", "superadmin"].includes(user.role) ? 1 : 0,
      ...geo
    });

    return res.json({
      message: "login success",
      token,
      exp: decoded.exp,
      id: user.id,
      name: user.name,
      role: user.role,
    });

  } catch (err) {
    console.error("❌ Login Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


/* ============================================================
   🔄 세션 Refresh (토큰 재발급)
============================================================ */
router.post("/refresh", verifyToken, (req, res) => {
  const user = req.user;

  const newToken = jwt.sign(
    { id: user.id, username: user.username, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  const decoded = jwt.decode(newToken);

  res.json({
    message: "session refreshed",
    token: newToken,
    exp: decoded.exp
  });
});

/* ============================================================
   🔄 세션 연장 (JWT 재발급 — 관리자만)
============================================================ */
router.post("/extend", verifyToken, verifyRole(["admin", "superadmin"]), (req, res) => {
  try {
    const user = req.user;

    // 🔥 새 토큰 = 2시간
    const newToken = jwt.sign(
      { id: user.id, username: user.username, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    const decoded = jwt.decode(newToken);

    return res.json({
      ok: true,
      token: newToken,
      exp: decoded.exp // UNIX Timestamp
    });

  } catch (err) {
    console.error("/extend error:", err);
    res.status(500).json({ ok: false, message: "extend failed" });
  }
});

/* ============================================================
   👑 사용자 생성 (superadmin 전용)
============================================================ */
router.post("/create-user", verifyToken, verifyRole("superadmin"), async (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    if (!username || !password || !name || !role) {
      return res.status(400).json({ message: "필수값 누락" });
    }

    const allowedRoles = ["superadmin", "admin", "editor", "contributor", "viewer"];
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
      "INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)",
      [username, hash, name, role]
    );

    res.json({ message: "User created", username, role });

  } catch (err) {
    console.error("❌ User Create Error:", err);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});

/* ============================================================
   🔎 세션 상태 확인 (홈페이지 + 관리자 공통)
============================================================ */
router.get("/check", verifyToken, (req, res) => {
  try {
    const user = req.user;
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.decode(token);

    return res.json({
      ok: true,
      id: user.id,
      name: user.name,
      role: user.role,
      exp: decoded.exp
    });

  } catch (err) {
    console.error("/check error:", err);
    return res.status(500).json({ ok: false, message: "server error" });
  }
});

export default router;
