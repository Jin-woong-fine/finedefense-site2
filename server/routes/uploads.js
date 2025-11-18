import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

/* =========================================================================
   📂 /uploads/editor 폴더 준비
========================================================================= */
const editorUploadDir = path.join(process.cwd(), "uploads", "editor");
if (!fs.existsSync(editorUploadDir)) {
  fs.mkdirSync(editorUploadDir, { recursive: true });
}

/* =========================================================================
   📸 multer 설정 (에디터 이미지)
========================================================================= */
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

const upload = multer({ storage });

/* =========================================================================
   📌 Toast UI Editor 이미지 업로드
   POST /api/uploads/editor-image
========================================================================= */
router.post("/editor-image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "no file" });
  }

  // 클라이언트에서 접근 가능한 URL
  const url = "/uploads/editor/" + req.file.filename;

  // Toast Editor는 { url } 만 주면 됨
  res.json({ url });
});

export default router;
