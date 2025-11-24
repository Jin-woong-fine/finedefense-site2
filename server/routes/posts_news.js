// server/routes/posts_news.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* ==========================================
   📁 Multer 설정 (뉴스 이미지 업로드)
========================================== */
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

/* ==========================================
   📌 뉴스 등록
========================================== */
router.post("/create", verifyToken, uploadNews.array("images", 10), async (req, res) => {
  try {
    const { title, content, lang } = req.body;

    if (!req.files.length) {
      return res.status(400).json({ message: "이미지를 첨부하세요." });
    }

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

/* ==========================================
   📌 뉴스 수정
========================================== */
router.put("/edit/:id", verifyToken, uploadNews.array("images", 10), async (req, res) => {
  try {
    const postId = req.params.id;
    const { title, content, lang } = req.body;

    const hasNewImages = req.files.length > 0;
    let mainImage = null;

    if (hasNewImages) {
      mainImage = `/uploads/news/${req.files[0].filename}`;
    }

    await db.execute(
      `UPDATE posts 
          SET title=?, content=?, lang=?, 
              main_image = IFNULL(?, main_image)
        WHERE id=? AND category='news'`,
      [title, content, lang, mainImage, postId]
    );

    // 기존 이미지 삭제 후 재등록 (요청했을 때만)
    if (hasNewImages) {
      await db.execute(`DELETE FROM post_images WHERE post_id=?`, [postId]);

      for (const f of req.files) {
        await db.execute(
          `INSERT INTO post_images (post_id, image_path) VALUES (?, ?)`,
          [postId, `/uploads/news/${f.filename}`]
        );
      }
    }

    res.json({ message: "뉴스 수정 완료" });

  } catch (err) {
    console.error("뉴스 수정 오류:", err);
    res.status(500).json({ message: "수정 오류" });
  }
});

/* ==========================================
   📌 뉴스 삭제
========================================== */
router.delete("/delete/:id", verifyToken, async (req, res) => {
  try {
    const postId = req.params.id;

    // 이미지 목록 가져오기
    const [images] = await db.execute(
      `SELECT image_path FROM post_images WHERE post_id=?`,
      [postId]
    );

    // 파일 삭제
    for (const img of images) {
      try {
        fs.unlinkSync("." + img.image_path);
      } catch {}
    }

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
    res.status(500).json({ message: "삭제 오류" });
  }
});

export default router;
