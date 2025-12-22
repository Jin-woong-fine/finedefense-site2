// /server/middleware/adminIpGuard.js
import db from "../config/db.js";
import { getClientIp } from "../utils/ip.js";

export default async function adminIpGuard(req, res, next) {
  try {
    const ip = getClientIp(req);

    const [[setting]] = await db.execute(
      "SELECT enabled FROM admin_ip_settings WHERE id = 1"
    );

    // IP 제한 OFF
    if (!setting?.enabled) {
      return next();
    }

    const [[allowed]] = await db.execute(
      "SELECT id FROM admin_ip_whitelist WHERE ip = ?",
      [ip]
    );

    // 허용 안 된 IP
    if (!allowed) {
      return res.status(403).json({
        message: "접근이 차단되었습니다."
      });
    }

    return next();
  } catch (err) {
    console.error("❌ adminIpGuard ERROR:", err);
    return res.status(500).json({
      message: "IP 검사 중 오류"
    });
  }
}

/* --------------------------------------------------
   🔒 차단 로그 기록 (🔥 핵심)
-------------------------------------------------- */
async function logBlock(req, reason) {
  try {
    const clientIp = getClientIp(req) || "UNKNOWN";

    await db.execute(
      `INSERT INTO admin_ip_block_logs
       (user_id, username, client_ip, request_path, reason)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user?.id || null,
        req.user?.username || null,
        clientIp,
        req.originalUrl,
        reason
      ]
    );
  } catch (e) {
    console.error("IP block log failed:", e);
  }
}

/* --------------------------------------------------
   🔐 엔드포인트 은닉
-------------------------------------------------- */
function hideEndpoint(req, res) {
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(404).json({ message: "Not Found" });
  }
  return res.sendStatus(404);
}
