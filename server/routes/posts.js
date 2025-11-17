// server/routes/posts.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* ============================================================
   📁 Multer 설정 (뉴스룸 이미지 업로드)
============================================================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/news";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + "_" + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  }
});
const upload = multer({ storage });

/* ============================================================
   📈 조회수 증가 API (POST /api/posts/view/:id)
   - 24시간 동안 같은 IP + UA는 1회만 카운트
   - post_view_logs 에만 기록
   - 집계는 목록 조회할 때 COUNT(*)로 처리
============================================================ */
router.post("/view/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const postId = Number(id);

    if (!postId || Number.isNaN(postId)) {
      return res.status(400).json({ message: "잘못된 post id" });
    }

    // 🔹 관리자 조회는 집계 제외
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role === "admin") {
          return res.json({ message: "관리자 제외", added: false });
        }
      } catch (err) {
        // 토큰 에러는 무시하고 그냥 일반 사용자로 처리
      }
    }

    const ip = (req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || "").toString();
    const ua = (req.headers["user-agent"] || "unknown").toString();

    // 24시간 중복 방지
    const [exists] = await db.execute(
      `SELECT id 
       FROM post_view_logs
       WHERE post_id = ? 
         AND ip = ? 
         AND user_agent = ?
         AND viewed_at > DATE_SUB(NOW(), INTERVAL 1 DAY)`,
      [postId, ip, ua]
    );

    if (exists.length > 0) {
      return res.json({ message: "중복 조회(24시간)", added: false });
    }

    // 로그 기록
    await db.execute(
      `INSERT INTO post_view_logs (post_id, ip, user_agent)
       VALUES (?, ?, ?)`,
      [postId, ip, ua]
    );

    // ⚠️ 별도 통계 테이블(post_view_stats)은 사용하지 않음
    return res.json({ message: "조회수 +1", added: true });
  } catch (err) {
    console.error("조회수 증가 오류:", err);
    res.status(500).json({ message: "조회수 증가 오류" });
  }
});

/* ============================================================
   📄 단일 게시물 조회 (API /api/posts/detail/:id)
   - 여기서는 조회수 집계 안 함 (프론트에서 /view 먼저 호출)
============================================================ */
router.get("/detail/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(
      `SELECT p.*, u.name AS author_name
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       WHERE p.id = ?`,
      [id]
    );

    if (!rows.length) return res.json({});

    const post = rows[0];

    const [images] = await db.execute(
      `SELECT image_path 
       FROM post_images 
       WHERE post_id = ?`,
      [id]
    );

    post.images = images.map(i => i.image_path);

    res.json(post);
  } catch (err) {
    console.error("단일 조회 오류:", err);
    res.status(500).json({ message: "조회 오류" });
  }
});

/* ============================================================
   🧩 게시물 등록 (POST /api/posts)
============================================================ */
router.post("/", verifyToken, upload.array("images", 10), async (req, res) => {
  try {
    const { title, content, category, lang } = req.body;
    const authorId = req.user.id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "이미지를 첨부하세요." });
    }

    const mainImage = `/uploads/news/${req.files[0].filename}`;

    const [result] = await db.execute(
      `INSERT INTO posts (title, content, category, lang, author_id, main_image)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, content, category, lang, authorId, mainImage]
    );

    const postId = result.insertId;

    for (const f of req.files) {
      await db.execute(
        `INSERT INTO post_images (post_id, image_path)
         VALUES (?, ?)`,
        [postId, `/uploads/news/${f.filename}`]
      );
    }

    res.json({ message: "등록 완료", postId });
  } catch (err) {
    console.error("게시물 등록 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

/* ============================================================
   📤 카테고리별 목록 (GET /api/posts/list/:category)
   - total_views: post_view_logs 기준 COUNT(*)
============================================================ */
router.get("/list/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const lang = req.query.lang || "kr";

    const [posts] = await db.execute(
      `SELECT 
         p.*,
         u.name AS author_name,
         (
           SELECT COUNT(*)
           FROM post_view_logs v
           WHERE v.post_id = p.id
         ) AS total_views
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       WHERE p.category = ? 
         AND p.lang = ?
       ORDER BY p.created_at DESC`,
      [category, lang]
    );

    for (const post of posts) {
      const [images] = await db.execute(
        `SELECT image_path 
         FROM post_images 
         WHERE post_id = ?`,
        [post.id]
      );
      post.images = images.map(i => i.image_path);
    }

    res.json(posts);
  } catch (err) {
    console.error("카테고리 조회 오류:", err);
    res.status(500).json({ message: "조회 오류" });
  }
});

/* ============================================================
   📝 게시물 수정 (PUT /api/posts/:id)
============================================================ */
router.put("/:id", verifyToken, upload.array("images", 10), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, lang } = req.body;

    await db.execute(
      `UPDATE posts 
       SET title = ?, content = ?, category = ?, lang = ?
       WHERE id = ?`,
      [title, content, category, lang, id]
    );

    // 이미지 새로 업로드된 경우에만 교체
    if (req.files && req.files.length > 0) {
      const [oldImgs] = await db.execute(
        `SELECT image_path 
         FROM post_images 
         WHERE post_id = ?`,
        [id]
      );

      // 기존 파일 삭제
      for (const img of oldImgs) {
        const filePath = path.join(process.cwd(), img.image_path.replace(/^\//, ""));
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      await db.execute(`DELETE FROM post_images WHERE post_id = ?`, [id]);

      for (const f of req.files) {
        await db.execute(
          `INSERT INTO post_images (post_id, image_path)
           VALUES (?, ?)`,
          [id, `/uploads/news/${f.filename}`]
        );
      }

      await db.execute(
        `UPDATE posts 
         SET main_image = ? 
         WHERE id = ?`,
        [`/uploads/news/${req.files[0].filename}`, id]
      );
    }

    res.json({ message: "수정 완료" });
  } catch (err) {
    console.error("수정 오류:", err);
    res.status(500).json({ message: "수정 오류" });
  }
});

/* ============================================================
   🗑 게시물 삭제 (DELETE /api/posts/:id)
============================================================ */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "권한 없음" });
    }

    const { id } = req.params;

    const [imgs] = await db.execute(
      `SELECT image_path 
       FROM post_images 
       WHERE post_id = ?`,
      [id]
    );

    for (const img of imgs) {
      const filePath = path.join(process.cwd(), img.image_path.replace(/^\//, ""));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await db.execute(`DELETE FROM posts WHERE id = ?`, [id]);

    res.json({ message: "삭제 완료" });
  } catch (err) {
    console.error("삭제 오류:", err);
    res.status(500).json({ message: "삭제 오류" });
  }
});

export default router;
