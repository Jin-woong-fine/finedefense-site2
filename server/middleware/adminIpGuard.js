// /server/middleware/adminIpGuard.js
import db from "../config/db.js";
import { getClientIp } from "../utils/ip.js";

export default async function adminIpGuard(req, res, next) {
  try {
    const ip = getClientIp(req);

    // 1️⃣ IP 못 얻음
    if (!ip) {
      await logBlock(req, "IP_NOT_DETECTED");
      return hideEndpoint(req, res);
    }

    // 2️⃣ IP 제한 ON / OFF
    const [[setting]] = await db.execute(
      "SELECT enabled FROM admin_ip_settings WHERE id = 1"
    );

    if (!setting || setting.enabled === 0) {
      return next(); // 제한 OFF
    }

    // 3️⃣ 화이트리스트 검사
    const [rows] = await db.execute(
      "SELECT id FROM admin_ip_whitelist WHERE ip = ? LIMIT 1",
      [ip]
    );

    if (rows.length === 0) {
      await logBlock(req, "IP_NOT_WHITELISTED");
      return hideEndpoint(req, res);
    }

    next();
  } catch (err) {
    console.error("adminIpGuard error:", err);
    return res.status(500).json({ message: "Server error" });
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
