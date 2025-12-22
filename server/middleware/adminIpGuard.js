// /server/middleware/adminIpGuard.js
import db from "../config/db.js";
import { getClientIp } from "../utils/ip.js";

export default async function adminIpGuard(req, res, next) {
  try {
    const url = req.originalUrl;

    /* ==================================================
       🔓 0) IP 관리 API는 항상 통과
       (토큰 검증은 라우터에서 별도 처리)
    ================================================== */
    if (
      url.startsWith("/api/admin/ip-settings") ||
      url.startsWith("/api/admin/ip-whitelist")
    ) {
      return next();
    }

    const ip = getClientIp(req);

    // IP 못 얻으면 차단 (보수적)
    if (!ip) {
      return hideEndpoint(req, res);
    }

    /* ==================================================
       1) IP 제한 ON / OFF 확인
    ================================================== */
    const [[setting]] = await db.execute(
      "SELECT enabled FROM admin_ip_settings WHERE id = 1"
    );

    // 설정 없거나 OFF → 통과
    if (!setting || setting.enabled === 0) {
      return next();
    }

    /* ==================================================
       2) 화이트리스트 검사
    ================================================== */
    const [rows] = await db.execute(
      "SELECT id FROM admin_ip_whitelist WHERE ip = ? LIMIT 1",
      [ip]
    );

    if (rows.length === 0) {
      return hideEndpoint(req, res);
    }

    next();
  } catch (err) {
    console.error("adminIpGuard error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/* --------------------------------------------------
   🔒 엔드포인트 은닉 (HTML / API 구분)
-------------------------------------------------- */
function hideEndpoint(req, res) {
  // API 요청 → 존재 숨김
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(404).json({ message: "Not Found" });
  }

  // HTML 요청
  return res.sendStatus(404);
}
