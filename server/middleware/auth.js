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
        message: `Permission denied: required roles = ${roles.join(", ")}`,
      });
    }

    next();
  };
}

/* ============================================================
   🟦 CRUD 권한
============================================================ */

// 생성 (superadmin + admin)
export const canCreate = allowRoles("superadmin", "admin");

// 수정 (superadmin + admin + editor)
export const canUpdate = allowRoles("superadmin", "admin", "editor");

// 삭제 (superadmin만)
export const canDelete = allowRoles("superadmin");

// 관리자 페이지 접근 (superadmin + admin + editor)
export const canReadManagerPages = allowRoles(
  "superadmin",
  "admin",
  "editor"
);

// 대시보드 접근 (viewer 포함)
export const canAccessDashboard = allowRoles(
  "superadmin",
  "admin",
  "editor",
  "viewer"
);

// 사용자 목록 (admin + superadmin)
export const canViewUsers = allowRoles("superadmin", "admin");

// 사용자 관리 (admin + superadmin)
export const canManageUsers = allowRoles("superadmin", "admin");


/* ============================================================
   🔙 구버전 라우터 호환용 (삭제하면 서버 다시 죽음)
============================================================ */

// 기존 verifyRole 유지
export function verifyRole(...roles) {
  return allowRoles(...roles);
}

// 기존 verifyAdmin → admin만 허용
export function verifyAdmin(req, res, next) {
  return allowRoles("admin")(req, res, next);
}

// 기존 verifyEditor → editor + admin 허용
export function verifyEditor(req, res, next) {
  return allowRoles("editor", "admin")(req, res, next);
}
