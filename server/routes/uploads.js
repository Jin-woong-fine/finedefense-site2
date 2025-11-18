// server/routes/uploads.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

/* =========================================================
   📂 Toast Editor 업로드 폴더 준비
========================================================= */

const editorUploadDir = path.join(process.cwd(), "uploads", "editor");
if (!fs.existsSync(editorUploadDir)) {
  fs.mkdirSync(editorUploadDir, { recursive: true });
}

/* =========================================================
   📸 Multer 설정 (10MB)
========================================================= */

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, editorUploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 40);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${base}-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/* =========================================================
   📌 Toast UI Editor 이미지 업로드
========================================================= */

router.post("/editor-image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "no file" });
  }

  const url = "/uploads/editor/" + req.file.filename;
  res.json({ url });
});

export default router;
