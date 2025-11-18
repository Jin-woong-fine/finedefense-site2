import express from "express";
import bcrypt from "bcrypt";
import db from "../config/db.js";
import { verifyToken, verifyAdmin, verifyRole } from "../middleware/auth.js";

import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

/* =============================================
   🔧 프로필 이미지 업로드 설정
============================================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const avatarDir = path.join(__dirname, "../public/uploads/avatars");

const avatarStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, avatarDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "avatar-" + unique + ext);
  }
});

const uploadAvatar = multer({ storage: avatarStorage });


/* ============================================================
   권한 기준
   superadmin → 전체 CRUD
   admin → 조회만 가능
============================================================ */


/* -----------------------------------------------------------
   ✨ 사용자 전체 조회 (admin 이상)
------------------------------------------------------------ */
router.get("/", verifyToken, verifyRole("admin", "superadmin"), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, username, name, role, avatar, created_at
      FROM users
      ORDER BY id ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error" });
  }
});


/* -----------------------------------------------------------
   ✨ 사용자 추가 (superadmin만 가능)
------------------------------------------------------------ */
router.post("/", verifyToken, verifyRole("superadmin"), async (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "username과 password 필요" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO users (username, password, name, role)
       VALUES (?, ?, ?, ?)`,
      [username, hashed, name || "", role || "viewer"]
    );

    res.json({ message: "created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error" });
  }
});


/* -----------------------------------------------------------
   ✨ 역할 변경 (superadmin만)
------------------------------------------------------------ */
router.put("/:id/role", verifyToken, verifyRole("superadmin"), async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    await db.query(`UPDATE users SET role = ? WHERE id = ?`, [role, id]);

    res.json({ message: "updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
});


/* -----------------------------------------------------------
   ✨ 비밀번호 초기화 (superadmin)
------------------------------------------------------------ */
router.put("/:id/reset-password", verifyToken, verifyRole("superadmin"), async (req, res) => {
  try {
    const { newPassword } = req.body;
    const { id } = req.params;

    if (!newPassword) {
      return res.status(400).json({ message: "새 비밀번호 필요" });
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await db.query(`UPDATE users SET password = ? WHERE id = ?`, [hash, id]);

    res.json({ message: "password reset complete" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
});


/* -----------------------------------------------------------
   ✨ 프로필 사진 업로드 (본인 또는 superadmin)
------------------------------------------------------------ */
router.put("/:id/avatar", verifyToken, uploadAvatar.single("avatar"), async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const myId = req.user.id;
    const myRole = req.user.role;

    // 본인 또는 superadmin만
    if (myId !== targetId && myRole !== "superadmin") {
      return res.status(403).json({ message: "권한 없음" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "파일 없음" });
    }

    const avatarPath = "/uploads/avatars/" + req.file.filename;

    await db.query(`UPDATE users SET avatar = ? WHERE id = ?`, [
      avatarPath,
      targetId,
    ]);

    res.json({ avatar: avatarPath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "upload error" });
  }
});


/* -----------------------------------------------------------
   ✨ 사용자 삭제 (superadmin)
------------------------------------------------------------ */
router.delete("/:id", verifyToken, verifyRole("superadmin"), async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(`DELETE FROM users WHERE id = ?`, [id]);

    res.json({ message: "deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error" });
  }
});


export default router;
