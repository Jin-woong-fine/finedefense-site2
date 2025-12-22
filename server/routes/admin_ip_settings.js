import express from "express";
import db from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* ===============================
   IP 제한 ON / OFF
================================ */

// 조회
router.get("/ip-settings", verifyToken, async (req, res) => {
  const [[row]] = await db.execute(
    "SELECT enabled FROM admin_ip_settings WHERE id = 1"
  );

  res.json({
    enabled: row ? row.enabled : 0
  });
});

// 수정 (PATCH)
router.patch("/ip-settings", verifyToken, async (req, res) => {
  const { enabled } = req.body;

  await db.execute(
    "UPDATE admin_ip_settings SET enabled = ? WHERE id = 1",
    [enabled ? 1 : 0]
  );

  res.json({ ok: true });
});

/* ===============================
   IP 화이트리스트
================================ */

// 목록
router.get("/ip-whitelist", verifyToken, async (req, res) => {
  const [rows] = await db.execute(
    "SELECT id, ip, label, created_at FROM admin_ip_whitelist ORDER BY id DESC"
  );
  res.json(rows);
});

// 추가
router.post("/ip-whitelist", verifyToken, async (req, res) => {
  const { ip, label } = req.body;

  await db.execute(
    "INSERT INTO admin_ip_whitelist (ip, label) VALUES (?, ?)",
    [ip, label || ""]
  );

  res.json({ ok: true });
});

// 삭제
router.delete("/ip-whitelist/:id", verifyToken, async (req, res) => {
  await db.execute(
    "DELETE FROM admin_ip_whitelist WHERE id = ?",
    [req.params.id]
  );

  res.json({ ok: true });
});

export default router;
