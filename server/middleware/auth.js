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
   💡 권한 체크 allowRoles()
      superadmin 은 항상 통과 (global bypass)
============================================================ */
export function allowRoles(...roles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // 🔥 superadmin 은 모든 권한 통과
    if (req.user.role === "superadmin") {
      return next();
    }

    // 지정된 역할만 허용
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Permission denied: allowed roles = ${roles.join(", ")}`,
      });
    }

    next();
  };
}

/* ============================================================
   🟦 CRUD 권한 (superadmin 자동 포함됨)
============================================================ */

// 생성 → admin, superadmin
export const canCreate = allowRoles("admin");

// 수정 → editor, admin, superadmin
export const canUpdate = allowRoles("editor", "admin");

// 삭제 → admin, superadmin (superadmin 자동 PASS)
export const canDelete = allowRoles("admin");

// 관리자 페이지 접근 → editor, admin, superadmin
export const canReadManagerPages = allowRoles("editor", "admin");

// 대시보드 → viewer, editor, admin, superadmin
export const canAccessDashboard = allowRoles("viewer", "editor", "admin");

// 사용자 목록 보기 → admin, superadmin
export const canViewUsers = allowRoles("admin");

// 사용자 관리(권한 변경 등) → admin, superadmin
export const canManageUsers = allowRoles("admin");


/* ============================================================
   🔙 구버전 호환용 (기존 라우터 때문에 유지)
============================================================ */

// old version verifyRole → 그냥 allowRoles 연결
export function verifyRole(...roles) {
  return allowRoles(...roles);
}

// 기존 verifyAdmin → admin 전용
export function verifyAdmin(req, res, next) {
  return allowRoles("admin")(req, res, next);
}

// 기존 verifyEditor → editor + admin
// (superadmin은 allowRoles에서 자동 PASS)
export function verifyEditor(req, res, next) {
  return allowRoles("editor", "admin")(req, res, next);
}
