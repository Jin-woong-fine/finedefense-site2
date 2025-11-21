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

    const matches = authHeader.match(/^Bearer\s+(.+)$/);
    if (!matches || !matches[1]) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const token = matches[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token expired or invalid" });
  }
}

/* ============================================================
   💡 새 권한 시스템: allowRoles
============================================================ */
export function allowRoles(...roles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Permission denied: allowed roles = ${roles.join(", ")}`,
      });
    }

    next();
  };
}

/* ============================================================
   🟦 CRUD / 페이지 접근 권한
============================================================ */

// 🔹 생성(Create) — superadmin + admin
export const canCreate = allowRoles("superadmin", "admin");

// 🔹 수정(Update) — superadmin + admin + editor
export const canUpdate = allowRoles("superadmin", "admin", "editor");

// 🔹 삭제(Delete) — superadmin만
export const canDelete = allowRoles("superadmin");

// 🔹 관리자 페이지(제품/뉴스룸 등) — superadmin + admin + editor
export const canReadManagerPages = allowRoles(
  "superadmin",
  "admin",
  "editor"
);

// 🔹 대시보드 — 모든 로그인 사용자(viewer 포함)
export const canAccessDashboard = allowRoles(
  "superadmin",
  "admin",
  "editor",
  "viewer"
);

// 🔹 사용자 목록 조회 — superadmin + admin
export const canViewUsers = allowRoles("superadmin", "admin");

// 🔹 사용자 관리(생성/삭제/권한변경) — superadmin + admin
export const canManageUsers = allowRoles("superadmin", "admin");


/* ============================================================
   🔙 구버전 라우터 호환용 verifyRole
   (다른 라우터들에서 import 중이므로 반드시 유지해야 함)
============================================================ */
export function verifyRole(...roles) {
  return allowRoles(...roles);
}
