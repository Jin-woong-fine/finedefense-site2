// server/routes/posts_news.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";
import { fileURLToPath } from "url";

const router = express.Router();

/* ======================================================
   📁 절대경로 계산
   uploads = server/public/uploads/news
====================================================== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_ROOT = path.join(__dirname, "../public/uploads");
const NEWS_DIR = path.join(UPLOAD_ROOT, "news");

// 폴더 없으면 자동 생성
if (!fs.existsSync(NEWS_DIR)) {
  fs.mkdirSync(NEWS_DIR, { recursive: true });
}

/* ======================================================
   📁 Multer 설정 (완전 정규화)
====================================================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, NEWS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(
      null,
      `${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`
    );
  }
});

const uploadNews = multer({ storage });

/* ======================================================
   🔧 헬퍼 함수
====================================================== */

// DB URL → 실제 디스크 경로 변환
// "/uploads/news/xxx.jpg" → "server/public/uploads/news/xxx.jpg"
const toDiskPath = (publicPath) => {
  if (!publicPath) return null;
  const rel = publicPath.replace(/^\/+uploads\//, ""); // "news/xxx.jpg"
  return path.join(UPLOAD_ROOT, rel);
};

// 파일명 → DB 저장 URL 변환
const toPublicPath = (filename) => `/uploads/news/${filename}`;

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

      if (!files.length) {
        return res.status(400).json({ message: "이미지를 첨부하세요." });
      }

      const postLang = lang || "kr";
      const mainImg = toPublicPath(files[0].filename);

      const [result] = await db.execute(
        `INSERT INTO posts (title, content, category, lang, author_id, main_image)
         VALUES (?, ?, 'news', ?, ?, ?)`,
        [title, content || "", postLang, req.user.id, mainImg]
      );

      const postId = result.insertId;

      // 이미지 DB 저장
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
      if (!postId) return res.status(400).json({ message: "잘못된 요청" });

      const { title, content, lang } = req.body;
      const files = req.files || [];
      const hasNewImages = files.length > 0;

      const postLang = lang || "kr";
      const newMainImg = hasNewImages ? toPublicPath(files[0].filename) : null;

      await db.execute(
        `UPDATE posts
           SET title=?, content=?, lang=?, 
               main_image = IFNULL(?, main_image)
         WHERE id=? AND category='news'`,
        [title, content || "", postLang, newMainImg, postId]
      );

      if (hasNewImages) {
        // 기존 이미지 조회
        const [oldImages] = await db.execute(
          `SELECT image_path FROM post_images WHERE post_id=?`,
          [postId]
        );

        // 실제 파일 삭제
        for (const img of oldImages) {
          const diskPath = toDiskPath(img.image_path);
          try { fs.unlinkSync(diskPath); } catch {}
        }

        // DB 삭제
        await db.execute(`DELETE FROM post_images WHERE post_id=?`, [postId]);

        // 새 이미지 삽입
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
    if (!postId) return res.status(400).json({ message: "잘못된 요청" });

    // 이미지 조회
    const [images] = await db.execute(
      `SELECT image_path FROM post_images WHERE post_id=?`,
      [postId]
    );

    // 실제 디스크 파일 삭제
    for (const img of images) {
      const diskPath = toDiskPath(img.image_path);
      try { fs.unlinkSync(diskPath); } catch {}
    }

    // DB에서 삭제
    await db.execute(`DELETE FROM post_images WHERE post_id=?`, [postId]);
    await db.execute(`DELETE FROM post_files WHERE post_id=?`, [postId]);
    await db.execute(`DELETE FROM post_view_logs WHERE post_id=?`, [postId]);
    await db.execute(
      `DELETE FROM posts WHERE id=? AND category='news'`,
      [postId]
    );

    res.json({ message: "뉴스 삭제 완료" });

  } catch (err) {
    console.error("뉴스 삭제 오류:", err);
    res.status(500).json({ message: "뉴스 삭제 오류" });
  }
});

export default router;
