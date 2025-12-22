// /server/middleware/adminIpGuard.js
import db from "../config/db.js";
import { getClientIp } from "../utils/ip.js";

export default async function adminIpGuard(req, res, next) {

    
  // 🔥 API 요청은 IP 가드 적용하지 않음
  if (req.originalUrl.startsWith("/api/")) {
    return next();
  }

  
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
