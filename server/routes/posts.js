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
   📄 0) 단일 게시물 조회 + 조회수 기록
   👉 GET /api/posts/detail/:id
========================================== */
router.get("/detail/:id", async (req, res) => {
  try {
    const { id } = req.params;

    /* -------------------------------
       🔥 1) 조회수 로그 저장
    --------------------------------*/
    const userIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    await db.execute(
      `INSERT INTO post_views (post_id, user_ip, user_agent) VALUES (?, ?, ?)`,
      [id, userIp, userAgent]
    );

    /* -------------------------------
       🔥 2) 월별 조회수 +1 (집계)
    --------------------------------*/
    await db.execute(
      `
      INSERT INTO post_view_stats (post_id, year, month, views)
      VALUES (?, YEAR(NOW()), MONTH(NOW()), 1)
      ON DUPLICATE KEY UPDATE views = views + 1
      `,
      [id]
    );

    /* -------------------------------
       🔥 3) 실제 게시물 조회
    --------------------------------*/
    const [rows] = await db.execute(
      `SELECT p.*, u.name AS author_name
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       WHERE p.id = ?`,
      [id]
    );
    if (!rows.length) return res.json({});

    const post = rows[0];

    // 이미지 목록 추가
    const [images] = await db.execute(
      "SELECT image_path FROM post_images WHERE post_id = ?",
      [id]
    );
    post.images = images.map(i => i.image_path);

    res.json(post);
  } catch (err) {
    console.error("단일 게시물 조회 오류:", err);
    res.status(500).json({ message: "조회 오류" });
  }
});

/* ==========================================
   🧩 1) 게시물 등록 (다중 이미지 업로드)
========================================== */
router.post("/", upload.array("images", 10), verifyToken, async (req, res) => {
  try {
    console.log("업로드된 파일들:", req.files);

    const { title, content, category, lang } = req.body;
    const authorId = req.user.id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "이미지가 첨부되지 않았습니다." });
    }

    const mainImage = `/uploads/news/${req.files[0].filename}`;

    const [result] = await db.execute(
      `INSERT INTO posts (title, content, category, lang, author_id, main_image)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, content, category, lang, authorId, mainImage]
    );

    const postId = result.insertId;

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
   📸 2) 게시물 이미지 목록 조회
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
   📤 3) 카테고리별 목록 조회 (조회수 + 이미지 포함)
   👉 GET /api/posts/:category
========================================== */
router.get("/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const lang = req.query.lang || "kr";

    const [posts] = await db.execute(
      `SELECT 
         p.*,
         u.name AS author_name,
         (
           SELECT COALESCE(SUM(s.views), 0)
           FROM post_view_stats s
           WHERE s.post_id = p.id
         ) AS total_views
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       WHERE p.category = ? AND p.lang = ?
       ORDER BY p.created_at DESC`,
      [category, lang]
    );

    // 이미지 매핑
    for (const post of posts) {
      const [images] = await db.execute(
        "SELECT image_path FROM post_images WHERE post_id = ?",
        [post.id]
      );
      post.images = images.map(i => i.image_path);
    }

    res.json(posts);

  } catch (err) {
    console.error("📌 목록 조회 오류:", err);
    res.status(500).json({ message: "조회 오류" });
  }
});



/* ==========================================
   📝 4) 게시물 수정
========================================== */
router.put("/:id", verifyToken, upload.array("images", 10), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, lang } = req.body;

    // 기본 정보 업데이트
    await db.execute(
      `UPDATE posts
       SET title = ?, content = ?, category = ?, lang = ?
       WHERE id = ?`,
      [title, content, category, lang, id]
    );

    // 새 이미지가 업로드된 경우에만 이미지 교체
    if (req.files && req.files.length > 0) {
      const [oldImgs] = await db.execute(
        "SELECT image_path FROM post_images WHERE post_id = ?",
        [id]
      );

      for (const img of oldImgs) {
        const filePath = path.join(process.cwd(), img.image_path.replace(/^\//, ""));
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      await db.execute("DELETE FROM post_images WHERE post_id = ?", [id]);

      for (const file of req.files) {
        const imagePath = `/uploads/news/${file.filename}`;
        await db.execute(
          `INSERT INTO post_images (post_id, image_path)
           VALUES (?, ?)`,
          [id, imagePath]
        );
      }

      const mainImage = `/uploads/news/${req.files[0].filename}`;
      await db.execute(
        "UPDATE posts SET main_image = ? WHERE id = ?",
        [mainImage, id]
      );
    }

    res.json({ message: "수정 완료" });
  } catch (err) {
    console.error("수정 오류:", err);
    res.status(500).json({ message: "수정 오류" });
  }
});

/* ==========================================
   🗑️ 6) 게시물 삭제
========================================== */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "권한 없음" });
    }

    const { id } = req.params;

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
  } catch (err) {
    console.error("삭제 오류:", err);
    res.status(500).json({ message: "삭제 중 오류" });
  }
});

export default router;
