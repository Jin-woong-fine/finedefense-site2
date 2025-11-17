import jwt from "jsonwebtoken";

/* ============================================================
   🔐 기본 토큰 인증 미들웨어
============================================================ */
export function verifyToken(req, res, next) {
  try {
    // Authorization 헤더 체크
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    // "Bearer token" 형태 검사
    const matches = authHeader.match(/^Bearer\s+(.+)$/);
    if (!matches || !matches[1]) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const token = matches[1];

    // JWT_SECRET 체크
    if (!process.env.JWT_SECRET) {
      console.error("❌ Missing JWT_SECRET in environment!");
      return res.status(500).json({ message: "Server config error" });
    }

    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 유저 정보 저장 (id, role, name)
    req.user = decoded;

    next();
  } catch (err) {
    // 만료, 위조, 서명 오류 등 포함
    return res.status(401).json({ message: "Token expired or invalid" });
  }
}


/* ============================================================
   👑 관리자 전용 미들웨어
============================================================ */
export function verifyAdmin(req, res, next) {
  // verifyToken이 먼저 실행되어야 req.user 존재함
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }

  next();
}
