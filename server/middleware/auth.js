import jwt from "jsonwebtoken";

/* ============================================================
   🔐 기본 토큰 인증
============================================================ */
export function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const matches = authHeader.match(/^Bearer\s+(.+)$/);
    if (!matches || !matches[1]) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const token = matches[1];

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server config error" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // id, role, name 저장

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token expired or invalid" });
  }
}

/* ============================================================
   👑 관리자 전용
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
   🎚 특정 권한만 허용 (editor, viewer 등)
============================================================ */
export function verifyRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Permission denied" });
    }

    next();
  };
}
