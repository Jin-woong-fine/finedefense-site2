// /server/middleware/adminIpGuard.js
import db from "../config/db.js";
import { getClientIp } from "../utils/ip.js";

export default async function adminIpGuard(req, res, next) {
  try {
    const ip = getClientIp(req);

    // IP 못 얻으면 차단 (보수적으로)
    if (!ip) {
      return res.status(404).json({ message: "Not Found" });
    }

    // 1️⃣ IP 제한 ON / OFF 확인
    const [[setting]] = await db.execute(
      "SELECT enabled FROM admin_ip_settings WHERE id = 1"
    );

    // 설정 없거나 OFF면 통과
    if (!setting || setting.enabled === 0) {
      return next();
    }

    // 2️⃣ 화이트리스트 검사
    const [rows] = await db.execute(
      "SELECT id FROM admin_ip_whitelist WHERE ip = ? LIMIT 1",
      [ip]
    );

    if (rows.length === 0) {
      // 관리자 API 존재 숨김
      return res.status(404).json({ message: "Not Found" });
    }

    next();
  } catch (err) {
    console.error("adminIpGuard error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
