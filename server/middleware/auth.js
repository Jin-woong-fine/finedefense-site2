import jwt from "jsonwebtoken";

/* ============================================================
   🔐 기본 토큰 인증
============================================================ */
export function verifyToken(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ message: "No token" });

    const match = header.match(/^Bearer\s+(.+)$/);
    if (!match) return res.status(401).json({ message: "Bad token format" });

    const token = match[1];

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server config error" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // id, role, name
    next();
  } catch (e) {
    return res.status(401).json({ message: "Token expired or invalid" });
  }
}

/* ============================================================
   👤 editor 이상
============================================================ */
export function verifyEditor(req, res, next) {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  const ok =
    req.user.role === "editor" ||
    req.user.role === "admin" ||
    req.user.role === "superadmin";

  if (!ok) return res.status(403).json({ message: "Editor or higher required" });

  next();
}

/* ============================================================
   👑 admin 이상
============================================================ */
export function verifyAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  const ok = req.user.role === "admin" || req.user.role === "superadmin";
  if (!ok) return res.status(403).json({ message: "Admin only" });

  next();
}

/* ============================================================
   🦁 superadmin 전용
============================================================ */
export function verifySuper(req, res, next) {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  if (req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Superadmin only" });
  }

  next();
}
