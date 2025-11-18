// server/middleware/auth.js
import jwt from "jsonwebtoken";

/* ============================================================
   🔐 기본 JWT 토큰 인증
============================================================ */
export function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    // "Bearer token" 구조 파싱
    const matches = authHeader.match(/^Bearer\s+(.+)$/);
    if (!matches || !matches[1]) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const token = matches[1];

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET 미설정");
      return res.status(500).json({ message: "Server config error" });
    }

    // 토큰 decode
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // req.user = { id, role, name }
    req.user = decoded;

    next();
  } catch (err) {
    console.error("❌ Token Verify Error:", err.message);
    return res.status(401).json({ message: "Token expired or invalid" });
  }
}

/* ============================================================
   👑 관리자 전용 (Admin Only)
============================================================ */
export function verifyAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }

  next();
}

/* ============================================================
   🎚 다중 권한 허용 (예: editor, admin 등)
   사용법: verifyRole("admin", "editor")
============================================================ */
export function verifyRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Permission denied (required: ${allowedRoles.join(", ")})`,
      });
    }

    next();
  };
}
