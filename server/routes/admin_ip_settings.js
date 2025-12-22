import express from "express";
import db from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";
import { getClientIp } from "../utils/ip.js"; // 🔥 추가

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

  // 🔥 로그 추가 (여기)
  await db.execute(
    `INSERT INTO admin_ip_change_logs
     (user_id, username, action)
     VALUES (?, ?, ?)`,
    [
      req.user.id,
      req.user.username,
      enabled ? "ENABLE" : "DISABLE"
    ]
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

  if (!ip) {
    return res.status(400).json({ message: "IP is required" });
  }

  // 🔒 중복 체크
  const [[exists]] = await db.execute(
    "SELECT id FROM admin_ip_whitelist WHERE ip = ? LIMIT 1",
    [ip]
  );

  if (exists) {
    return res.status(409).json({ message: "이미 등록된 IP입니다." });
  }

  await db.execute(
    "INSERT INTO admin_ip_whitelist (ip, label) VALUES (?, ?)",
    [ip, label || ""]
  );

    await db.execute(
    `INSERT INTO admin_ip_change_logs
    (user_id, username, action, ip, label)
    VALUES (?, ?, 'ADD', ?, ?)`,
    [
        req.user.id,
        req.user.username,
        ip,
        label || ""
    ]
    );

  res.json({ ok: true });
});


// 삭제
router.delete("/ip-whitelist/:id", verifyToken, async (req, res) => {
  // 🔒 IP 제한 ON 여부
  const [[setting]] = await db.execute(
    "SELECT enabled FROM admin_ip_settings WHERE id = 1"
  );

  if (setting?.enabled) {
    const [[count]] = await db.execute(
      "SELECT COUNT(*) AS cnt FROM admin_ip_whitelist"
    );

    if (count.cnt <= 1) {
      return res.status(400).json({
        message: "IP 제한이 활성화된 상태에서는 최소 1개의 IP가 필요합니다."
      });
    }
  }


    const [[target]] = await db.execute(
    "SELECT ip, label FROM admin_ip_whitelist WHERE id = ?",
    [req.params.id]
    );


  await db.execute(
    "DELETE FROM admin_ip_whitelist WHERE id = ?",
    [req.params.id]
  );

    await db.execute(
    `INSERT INTO admin_ip_change_logs
    (user_id, username, action, ip, label)
    VALUES (?, ?, 'DELETE', ?, ?)`,
    [
        req.user.id,
        req.user.username,
        target?.ip || "",
        target?.label || ""
    ]
    );

  res.json({ ok: true });
});


// 수정 (IP / label)
router.put("/ip-whitelist/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { ip, label } = req.body;

  if (!ip) {
    return res.status(400).json({ message: "IP is required" });
  }

  const [[dup]] = await db.execute(
    "SELECT id FROM admin_ip_whitelist WHERE ip = ? AND id != ? LIMIT 1",
    [ip, id]
  );

  if (dup) {
    return res.status(409).json({ message: "이미 등록된 IP입니다." });
  }

  await db.execute(
    "UPDATE admin_ip_whitelist SET ip = ?, label = ? WHERE id = ?",
    [ip, label || "", id]
  );

    await db.execute(
    `INSERT INTO admin_ip_change_logs
    (user_id, username, action, ip, label)
    VALUES (?, ?, 'UPDATE', ?, ?)`,
    [
        req.user.id,
        req.user.username,
        ip,
        label || ""
    ]
    );

  res.json({ ok: true });
});

/* ===============================
   내 접속 IP 조회
================================ */
router.get("/ip-my", verifyToken, (req, res) => {
  const ip = getClientIp(req);

  if (!ip) {
    return res.status(400).json({
      message: "IP not detected"
    });
  }

  res.json({ ip });
});





export default router;




