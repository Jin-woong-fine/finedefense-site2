// server/routes/uploads_editor.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 업로드 경로: server/public/uploads/editor
const uploadDir = path.join(__dirname, "../public/uploads/editor");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + "_" + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  }
});

const upload = multer({ storage });


// 📌 이미지 업로드 API
router.post("/image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "파일 없음" });
  }

  const url = `/uploads/editor/${req.file.filename}`;
  res.json({ url });
});

export default router;
