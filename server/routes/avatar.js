import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import db from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 저장 경로
const uploadDir = path.join(__dirname, "../public/uploads/avatars");

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "avatar-" + unique + ext);
  }
});

const upload = multer({ storage });

/* ============================================================
   🔥 프로필 업로드 / 업데이트
============================================================ */
router.post("/", verifyToken, upload.single("avatar"), async (req, res) => {
  try {
    const url = "/uploads/avatars/" + req.file.filename;

    await db.query(
      `UPDATE users SET avatar = ? WHERE id = ?`,
      [url, req.user.id]
    );

    res.json({ message: "avatar updated", url });
  } catch (err) {
    console.error("avatar update error:", err);
    res.status(500).json({ message: "error" });
  }
});

export default router;
