import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* ==========================================
   📁 파일 업로드 설정 (multer)
========================================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/news";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = Date.now() + "_" + Math.round(Math.random() * 1e9) + ext;
    cb(null, fileName);
  },
});

const upload = multer({ storage });

/* ==========================================
   🧩 게시물 등록 (다중 이미지 업로드)
========================================== */
router.post("/", verifyToken, upload.array("images", 10), async (req, res) => {
  try {
    const { title, content, category, lang } = req.body;
    const authorId = req.user.id;

    // 대표 이미지: 첫 번째 파일
    const mainImage = req.files?.[0]
      ? `/uploads/news/${req.files[0].filename}`
      : null;

    // posts 테이블에 등록
    const [result] = await db.execute(
      "INSERT INTO posts (title, content, category, lang, author_id, main_image) VALUES (?, ?, ?, ?, ?, ?)",
      [title, content, category, lang, authorId, mainImage]
    );
    const postId = result.insertId;

    // 나머지 이미지 post_images 테이블에 등록
    for (const file of req.files) {
      const imagePath = `/uploads/news/${file.filename}`;
      await db.execute(
        "INSERT INTO post_images (post_id, image_path) VALUES (?, ?)",
        [postId, imagePath]
      );
    }

    res.json({ message: "게시물 등록 완료", postId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류" });
  }
});

/* ==========================================
   📤 게시물 목록 조회 (카테고리별)
========================================== */
router.get("/:category", async (req, res) => {
  const { category } = req.params;
  const lang = req.query.lang || "kr";

  try {
    const [rows] = await db.execute(
      `SELECT p.*, u.name AS author_name
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       WHERE p.category = ? AND p.lang = ?
       ORDER BY p.created_at DESC`,
      [category, lang]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "조회 오류" });
  }
});

/* ==========================================
   📸 특정 게시물의 첨부 이미지 목록 조회
========================================== */
router.get("/images/:postId", async (req, res) => {
  const { postId } = req.params;
  try {
    const [rows] = await db.execute(
      "SELECT image_path FROM post_images WHERE post_id = ?",
      [postId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "이미지 조회 오류" });
  }
});

/* ==========================================
   🗑️ 게시물 삭제 (관리자 전용)
========================================== */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "권한 없음" });

    const { id } = req.params;

    // 이미지 파일도 삭제
    const [images] = await db.execute(
      "SELECT image_path FROM post_images WHERE post_id = ?",
      [id]
    );
    for (const img of images) {
      const filePath = path.join(process.cwd(), img.image_path.replace(/^\//, ""));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await db.execute("DELETE FROM posts WHERE id = ?", [id]);
    res.json({ message: "삭제 완료" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "삭제 중 오류" });
  }
});

export default router;
