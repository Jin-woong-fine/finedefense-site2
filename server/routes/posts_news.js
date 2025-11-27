// server/routes/posts_news.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";
import { fileURLToPath } from "url";

const router = express.Router();

// 절대 경로 계산
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_ROOT = path.join(__dirname, "../public/uploads");
const NEWS_DIR = path.join(UPLOAD_ROOT, "news");

if (!fs.existsSync(NEWS_DIR)) {
  fs.mkdirSync(NEWS_DIR, { recursive: true });
}

/* ======================================================
   📁 Multer 설정 (한글파일명 + 안정화된 fileFilter)
====================================================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, NEWS_DIR),
  filename: (req, file, cb) => {
    const utf8Name = Buffer.from(file.originalname, "latin1").toString("utf8");
    const ext = path.extname(utf8Name) || ".jpg";
    const safeName = `${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  }
});

const uploadNews = multer({
  storage,
  fileFilter(req, file, cb) {
    file.originalname = Buffer.from(file.originalname, "latin1").toString("utf8");
    cb(null, true);
  }
});

/* ======================================================
   🔧 헬퍼 함수
====================================================== */
const toPublicPath = (filename) => `/uploads/news/${filename}`;
const toDiskPath = (publicPath) => {
  if (!publicPath) return null;
  const rel = publicPath.replace(/^\/+uploads\//, "");
  return path.join(UPLOAD_ROOT, rel);
};

/* ======================================================
   📌 뉴스 생성
====================================================== */
router.post(
  "/create",
  verifyToken,
  uploadNews.array("images", 10),
  async (req, res) => {
    try {
      const { title, content, lang } = req.body;
      const files = req.files || [];

      if (!title) return res.status(400).json({ message: "제목은 필수입니다." });
      if (!files.length) return res.status(400).json({ message: "이미지를 첨부하세요." });

      const mainImg = toPublicPath(files[0].filename);

      const [result] = await db.execute(
        `INSERT INTO posts (title, content, category, lang, author_id, main_image)
         VALUES (?, ?, 'news', ?, ?, ?)`,
        [title, content || "", lang || "kr", req.user.id, mainImg]
      );

      const postId = result.insertId;

      for (const f of files) {
        await db.execute(
          `INSERT INTO post_images (post_id, image_path) VALUES (?, ?)`,
          [postId, toPublicPath(f.filename)]
        );
      }

      res.json({ message: "뉴스 등록 완료", postId });

    } catch (err) {
      console.error("뉴스 생성 오류:", err);
      res.status(500).json({ message: "뉴스 생성 오류" });
    }
  }
);

/* ======================================================
   📌 뉴스 수정
====================================================== */
router.put(
  "/edit/:id",
  verifyToken,
  uploadNews.array("images", 10),
  async (req, res) => {
    try {
      const postId = Number(req.params.id);
      if (!postId) return res.status(400).json({ message: "잘못된 ID" });

      const { title, content, lang } = req.body;
      const files = req.files || [];

      const newMainImg = files.length ? toPublicPath(files[0].filename) : null;

      await db.execute(
        `UPDATE posts
           SET title=?, content=?, lang=?, 
               main_image = IFNULL(?, main_image)
         WHERE id=? AND category='news'`,
        [title, content || "", lang || "kr", newMainImg, postId]
      );

      if (files.length) {
        const [oldImages] = await db.execute(
          `SELECT image_path FROM post_images WHERE post_id=?`,
          [postId]
        );

        for (const img of oldImages) {
          const disk = toDiskPath(img.image_path);
          try { fs.unlinkSync(disk); } catch {}
        }

        await db.execute(`DELETE FROM post_images WHERE post_id=?`, [postId]);

        for (const f of files) {
          await db.execute(
            `INSERT INTO post_images (post_id, image_path) VALUES (?, ?)`,
            [postId, toPublicPath(f.filename)]
          );
        }
      }

      res.json({ message: "뉴스 수정 완료" });

    } catch (err) {
      console.error("뉴스 수정 오류:", err);
      res.status(500).json({ message: "뉴스 수정 오류" });
    }
  }
);

/* ======================================================
   📌 뉴스 삭제
====================================================== */
router.delete("/delete/:id", verifyToken, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    if (!postId) return res.status(400).json({ message: "잘못된 ID" });

    const [images] = await db.execute(
      `SELECT image_path FROM post_images WHERE post_id=?`,
      [postId]
    );

    for (const img of images) {
      const diskPath = toDiskPath(img.image_path);
      try { fs.unlinkSync(diskPath); } catch {}
    }

    await db.execute(`DELETE FROM post_images WHERE post_id=?`, [postId]);
    await db.execute(`DELETE FROM post_view_logs WHERE post_id=?`, [postId]);
    await db.execute(`DELETE FROM posts WHERE id=? AND category='news'`, [postId]);

    res.json({ message: "뉴스 삭제 완료" });

  } catch (err) {
    console.error("뉴스 삭제 오류:", err);
    res.status(500).json({ message: "뉴스 삭제 오류" });
  }
});

export default router;
