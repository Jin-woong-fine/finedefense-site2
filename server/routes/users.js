// server/routes/users.js
import express from "express";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import db from "../config/db.js";
import { verifyToken, verifyRole } from "../middleware/auth.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ============================================
   📂 아바타 업로드 설정
============================================ */
import multer from "multer";

const avatarDir = path.join(__dirname, "../public/uploads/avatars");
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, avatarDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9가-힣_-]/g, "")
      .substring(0, 40);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${req.user.id || "user"}-${unique}${ext}`);
  },
});

const uploadAvatar = multer({ storage: avatarStorage });

/* ============================================================
   📌 관리자용: 사용자 목록 조회 (admin, superadmin)
============================================================ */
router.get(
  "/",
  verifyToken,
  verifyRole("admin", "superadmin"),
  async (req, res) => {
    try {
      const [rows] = await db.query(
        `
        SELECT id, username, name, role, department, position, created_at
        FROM users
        ORDER BY id ASC
      `
      );

      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "DB error" });
    }
  }
);

/* ============================================================
   📌 관리자용: 사용자 생성 (superadmin)
============================================================ */
router.post("/", verifyToken, verifyRole("superadmin"), async (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ message: "필수값 누락" });
    }

    const allowedRoles = [
      "superadmin",
      "admin",
      "editor",
      "viewer",
      "contributor",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const [exist] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (exist.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    await db.query(
      `
        INSERT INTO users (username, password, name, role)
        VALUES (?, ?, ?, ?)
      `,
      [username, hash, name || "", role]
    );

    res.json({ message: "User created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error" });
  }
});

/* ============================================================
   📌 관리자용: 역할 변경 (superadmin)
============================================================ */
router.put(
  "/:id/role",
  verifyToken,
  verifyRole("superadmin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const allowedRoles = [
        "superadmin",
        "admin",
        "editor",
        "viewer",
        "contributor",
      ];

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const targetId = Number(req.params.id);
      const myId = req.user.id;

      if (targetId === myId && role !== "superadmin") {
        return res.status(400).json({
          message: "자기 자신의 슈퍼관리자 권한은 제거할 수 없습니다.",
        });
      }


      await db.query(`UPDATE users SET role = ? WHERE id = ?`, [role, id]);

      res.json({ message: "role updated" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "server error" });
    }
  }
);

/* ============================================================
   📌 관리자용: 사용자 삭제 (superadmin)
============================================================ */
router.delete(
  "/:id",
  verifyToken,
  verifyRole("superadmin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const targetId = Number(req.params.id);
      const myId = req.user.id;

      if (targetId === myId) {
        return res.status(400).json({ message: "자기 자신은 삭제할 수 없습니다." });
      }

      await db.query(`DELETE FROM users WHERE id = ?`, [id]);

      res.json({ message: "deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "DB error" });
    }
  }
);

/* ============================================================
   📌 관리자용: 비밀번호 초기화 (superadmin)
============================================================ */
router.put(
  "/:id/reset-password",
  verifyToken,
  verifyRole("superadmin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({ message: "새 비밀번호 필요" });
      }

      const hash = await bcrypt.hash(newPassword, 10);

      await db.query(`UPDATE users SET password = ? WHERE id = ?`, [
        hash,
        id,
      ]);

      res.json({ message: "password reset complete" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "server error" });
    }
  }
);

/* ============================================================
   👤 내 프로필 조회 (로그인 사용자)
   GET /api/users/me
============================================================ */
router.get("/me", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [[row]] = await db.query(
      `
      SELECT id, username, name, role, avatar_url, department, position, intro, created_at
      FROM users
      WHERE id = ?
    `,
      [userId]
    );

    if (!row) return res.status(404).json({ message: "not found" });

    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error" });
  }
});

/* ============================================================
   👤 내 프로필 수정 (이름/부서/직책/소개)
   PUT /api/users/me
============================================================ */
router.put("/me", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, department, position, intro } = req.body;

    await db.query(
      `
      UPDATE users
      SET name = ?, department = ?, position = ?, intro = ?
      WHERE id = ?
    `,
      [name || "", department || "", position || "", intro || "", userId]
    );

    res.json({ message: "profile updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
});

/* ============================================================
   👤 내 아바타 업로드
   POST /api/users/me/avatar
   (form-data: avatar 파일)
============================================================ */
router.post(
  "/me/avatar",
  verifyToken,
  uploadAvatar.single("avatar"),
  async (req, res) => {
    try {
      const userId = req.user.id;

      if (!req.file) {
        return res.status(400).json({ message: "파일 없음" });
      }

      const avatarUrl = "/uploads/avatars/" + req.file.filename;

      // 기존 아바타 있으면 삭제 (선택사항)
      const [[old]] = await db.query(
        `SELECT avatar_url FROM users WHERE id = ?`,
        [userId]
      );

      if (old && old.avatar_url && old.avatar_url.startsWith("/uploads/avatars/")) {
        const oldPath = path.join(__dirname, "../public", old.avatar_url);
        if (fs.existsSync(oldPath)) {
          fs.unlink(oldPath, () => {});
        }
      }

      await db.query(
        `UPDATE users SET avatar_url = ? WHERE id = ?`,
        [avatarUrl, userId]
      );

      res.json({ message: "avatar updated", avatar_url: avatarUrl });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "server error" });
    }
  }
);

/* ============================================================
   👀 다른 사용자 프로필 조회
   GET /api/users/:id/profile
   (로그인만 하면 누구나 조회 가능, 읽기 전용)
============================================================ */
router.get("/:id/profile", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [[row]] = await db.query(
      `
      SELECT id, username, name, role, avatar_url, department, position, intro, created_at
      FROM users
      WHERE id = ?
    `,
      [id]
    );

    if (!row) return res.status(404).json({ message: "not found" });

    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error" });
  }
});

export default router;
