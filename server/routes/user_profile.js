import express from "express";
import bcrypt from "bcrypt";
import db from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const avatarDir = path.join(__dirname, "../public/uploads/avatar");

// ===========================
// 🔥 Multer 설정
// ===========================
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, avatarDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${unique}${ext}`);
  }
});
const upload = multer({ storage });

// ===========================
// 📌 내 프로필 정보 불러오기
// ===========================
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [[user]] = await db.query(
      `SELECT id, username, name, role, avatar, created_at
       FROM users
       WHERE id = ?`,
      [userId]
    );

    res.json(user);
  } catch (err) {
    console.error("Profile Load Error:", err);
    res.status(500).json({ message: "server error" });
  }
});

// ===========================
// 📌 이름 수정
// ===========================
router.put("/name", verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    await db.query(
      `UPDATE users SET name = ? WHERE id = ?`,
      [name, userId]
    );

    res.json({ message: "name updated" });
  } catch (err) {
    console.error("Name Update Error:", err);
    res.status(500).json({ message: "server error" });
  }
});

// ===========================
// 📌 비밀번호 변경
// ===========================
router.put("/password", verifyToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    // 기존 비밀번호 확인
    const [[user]] = await db.query(
      `SELECT password FROM users WHERE id = ?`,
      [userId]
    );

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) {
      return res.status(401).json({ message: "기존 비밀번호가 틀립니다." });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await db.query(
      `UPDATE users SET password = ? WHERE id = ?`,
      [newHash, userId]
    );

    res.json({ message: "password changed" });
  } catch (err) {
    console.error("Password Update Error:", err);
    res.status(500).json({ message: "server error" });
  }
});

// ===========================
// 📌 아바타 업로드
// ===========================
router.post("/avatar", verifyToken, (req, res) => {
  upload.single("avatar")(req, res, async (err) => {
    if (err) return res.status(400).json({ message: "Upload error" });

    try {
      const userId = req.user.id;

      const avatarUrl = "/uploads/avatar/" + req.file.filename;

      await db.query(
        `UPDATE users SET avatar = ? WHERE id = ?`,
        [avatarUrl, userId]
      );

      res.json({ message: "avatar uploaded", avatar: avatarUrl });
    } catch (err) {
      console.error("Avatar Upload Error:", err);
      res.status(500).json({ message: "server error" });
    }
  });
});

export default router;
