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
   🧩 1) 게시물 등록 (다중 이미지 업로드)
========================================== */
router.post("/", verifyToken, upload.array("images", 10), async (req, res) => {
  try {
    const { title, content, category, lang } = req.body;
    const authorId = req.user.id;

    // 대표 이미지(첫 번째)
    const mainImage = req.files?.[0]
      ? `/uploads/news/${req.files[0].filename}`
      : null;

    // posts 테이블 INSERT
    const [result] = await db.execute(
      `INSERT INTO posts (title, content, category, lang, author_id, main_image)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, content, category, lang, authorId, mainImage]
    );

    const postId = result.insertId;

    // post_images 테이블 INSERT
    for (const file of req.files) {
      const imagePath = `/uploads/news/${file.filename}`;
      await db.execute(
        `INSERT INTO post_images (post_id, image_path)
         VALUES (?, ?)`,
        [postId, imagePath]
      );
    }

    res.json({ message: "게시물 등록 완료", postId });
  } catch (err) {
    console.error("게시물 등록 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

/* ==========================================
   📤 2) 카테고리별 목록 조회 (이미지 포함)
========================================== */
router.get("/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const lang = req.query.lang || "kr";

    // posts + users
    const [posts] = await db.execute(
      `SELECT p.*, u.name AS author_name
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       WHERE p.category = ? AND p.lang = ?
       ORDER BY p.created_at DESC`,
      [category, lang]
    );

    // 각 post의 이미지들 추가 ★여기만 있으면 됨!
    for (const post of posts) {
      const [images] = await db.execute(
        "SELECT image_path FROM post_images WHERE post_id = ?",
        [post.id]
      );
      post.images = images.map(i => i.image_path);
    }

    res.json(posts);
  } catch (err) {
    console.error("목록 조회 오류:", err);
    res.status(500).json({ message: "조회 오류" });
  }
});


/* ==========================================
   📸 3) 게시물 이미지 목록 조회
========================================== */
router.get("/images/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const [rows] = await db.execute(
      "SELECT image_path FROM post_images WHERE post_id = ?",
      [postId]
    );
    res.json(rows);
  } catch (err) {
    console.error("이미지 조회 오류:", err);
    res.status(500).json({ message: "이미지 조회 오류" });
  }
});

/* ==========================================
   🗑️ 4) 게시물 삭제
========================================== */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "권한 없음" });

    const { id } = req.params;

    // 1) 이미지 파일 삭제
    const [images] = await db.execute(
      "SELECT image_path FROM post_images WHERE post_id = ?",
      [id]
    );

    for (const img of images) {
      const filePath = path.join(process.cwd(), img.image_path.replace(/^\//, ""));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // 2) posts 삭제 (post_images 는 ON DELETE CASCADE 일 수도 있음)
    await db.execute("DELETE FROM posts WHERE id = ?", [id]);

    res.json({ message: "삭제 완료" });
  } catch (err) {
    console.error("삭제 오류:", err);
    res.status(500).json({ message: "삭제 중 오류" });
  }
});

export default router;
