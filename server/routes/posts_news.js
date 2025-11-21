// server/routes/posts_news.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* ========= Multer (뉴스 이미지) ========= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/news";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "_" + Math.round(Math.random() * 1e9) + ext);
  }
});
const uploadNews = multer({ storage });

/* ========= 뉴스 등록 ========= */
router.post("/create", verifyToken, uploadNews.array("images", 10), async (req, res) => {
  try {
    const { title, content, lang } = req.body;

    if (!req.files.length)
      return res.status(400).json({ message: "이미지를 첨부하세요." });

    const mainImage = `/uploads/news/${req.files[0].filename}`;

    const [result] = await db.execute(
      `INSERT INTO posts (title, content, category, lang, author_id, main_image)
       VALUES (?, ?, 'news', ?, ?, ?)`,
      [title, content, lang, req.user.id, mainImage]
    );

    const postId = result.insertId;

    for (const f of req.files) {
      await db.execute(
        `INSERT INTO post_images (post_id, image_path) VALUES (?, ?)`,
        [postId, `/uploads/news/${f.filename}`]
      );
    }

    res.json({ message: "뉴스 등록 완료", postId });

  } catch (err) {
    console.error("뉴스 등록 오류:", err);
    res.status(500).json({ message: "등록 오류" });
  }
});

export default router;
