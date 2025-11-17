import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* ============================================================
   📁 Multer 설정
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
   📈 조회수 증가 (POST /api/posts/view/:id)
   ※ 반드시 최상단에 위치
============================================================ */
router.post("/view/:id", async (req, res) => {
  try {
    const postId = Number(req.params.id);

    if (!postId) {
      return res.status(400).json({ message: "Invalid Post ID" });
    }

    // 관리자 제외
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role === "admin") {
          return res.json({ message: "관리자 제외", added: false });
        }
      } catch (err) {}
    }

    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;
    const ua = req.headers["user-agent"] || "unknown";

    // 24시간 내 중복 조회 방지
    const [exists] = await db.execute(
      `SELECT id FROM post_view_logs
       WHERE post_id = ? AND ip = ? AND user_agent = ?
       AND viewed_at > DATE_SUB(NOW(), INTERVAL 1 DAY)`,
      [postId, ip, ua]
    );

    if (exists.length > 0) {
      return res.json({ message: "중복 조회(24시간)", added: false });
    }

    // 로그 삽입
    await db.execute(
      `INSERT INTO post_view_logs (post_id, ip, user_agent)
       VALUES (?, ?, ?)`,
      [postId, ip, ua]
    );

    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();

    // 일별 집계
    await db.execute(
      `INSERT INTO post_view_stats (post_id, year, month, day, views)
       VALUES (?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE views = views + 1`,
      [postId, y, m, d]
    );

    res.json({ message: "조회수 +1", added: true });

  } catch (err) {
    console.error("조회수 증가 오류:", err);
    res.status(500).json({ message: "조회수 증가 오류" });
  }
});


/* ============================================================
   📄 단일 게시물 조회 (GET /api/posts/detail/:id)
============================================================ */
router.get("/detail/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const [rows] = await db.execute(
      `SELECT p.*, u.name AS author_name
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       WHERE p.id=?`,
      [id]
    );

    if (!rows.length) return res.json({});

    const post = rows[0];

    const [images] = await db.execute(
      `SELECT image_path FROM post_images WHERE post_id=?`,
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
   📤 카테고리 목록 조회 (GET /api/posts/list/:category)
============================================================ */
router.get("/list/:category", async (req, res) => {
  try {
    const category = req.params.category;
    const lang = req.query.lang || "kr";

    const [posts] = await db.execute(
      `SELECT 
         p.*,
         u.name AS author_name,
         (SELECT COALESCE(SUM(views), 0)
          FROM post_view_stats
          WHERE post_id = p.id) AS total_views
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       WHERE p.category=? AND p.lang=?
       ORDER BY p.created_at DESC`,
      [category, lang]
    );

    for (const post of posts) {
      const [imgs] = await db.execute(
        `SELECT image_path FROM post_images WHERE post_id=?`,
        [post.id]
      );
      post.images = imgs.map(i => i.image_path);
    }

    res.json(posts);

  } catch (err) {
    console.error("목록 조회 오류:", err);
    res.status(500).json({ message: "조회 오류" });
  }
});


/* ============================================================
   🧩 게시물 등록
============================================================ */
router.post("/", verifyToken, upload.array("images", 10), async (req, res) => {
  try {
    const { title, content, category, lang } = req.body;
    const authorId = req.user.id;

    if (!req.files.length) {
      return res.status(400).json({ message: "이미지를 첨부하세요." });
    }

    const mainImage = `/uploads/news/${req.files[0].filename}`;

    const [result] = await db.execute(
      `INSERT INTO posts (title, content, category, lang, author_id, main_image)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, content, category, lang, authorId, mainImage]
    );

    const postId = result.insertId;

    // 서브 이미지 저장
    for (const f of req.files) {
      await db.execute(
        `INSERT INTO post_images (post_id, image_path)
         VALUES (?, ?)`,
        [postId, `/uploads/news/${f.filename}`]
      );
    }

    res.json({ message: "등록 완료", postId });

  } catch (err) {
    console.error("등록 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});


/* ============================================================
   📝 게시물 수정
============================================================ */
router.put("/:id", verifyToken, upload.array("images", 10), async (req, res) => {
  try {
    const id = req.params.id;
    const { title, content, category, lang } = req.body;

    await db.execute(
      `UPDATE posts SET title=?, content=?, category=?, lang=? WHERE id=?`,
      [title, content, category, lang, id]
    );

    // 이미지 교체 있을 때만 바꿈
    if (req.files.length > 0) {
      const [oldImgs] = await db.execute(
        `SELECT image_path FROM post_images WHERE post_id=?`, [id]
      );

      // 기존 이미지 파일 삭제
      for (const img of oldImgs) {
        const filepath = path.join(process.cwd(), img.image_path.replace(/^\//, ""));
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      }

      // 기존 DB 삭제
      await db.execute(`DELETE FROM post_images WHERE post_id=?`, [id]);

      // 새 이미지 저장
      for (const f of req.files) {
        await db.execute(
          `INSERT INTO post_images (post_id, image_path)
           VALUES (?, ?)`,
          [id, `/uploads/news/${f.filename}`]
        );
      }

      await db.execute(
        `UPDATE posts SET main_image=? WHERE id=?`,
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
   🗑 게시물 삭제
============================================================ */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "권한 없음" });
    }

    const id = req.params.id;

    const [imgs] = await db.execute(
      `SELECT image_path FROM post_images WHERE post_id=?`,
      [id]
    );

    for (const img of imgs) {
      const filepath = path.join(process.cwd(), img.image_path.replace(/^\//, ""));
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    }

    await db.execute(`DELETE FROM posts WHERE id=?`, [id]);

    res.json({ message: "삭제 완료" });

  } catch (err) {
    console.error("삭제 오류:", err);
    res.status(500).json({ message: "삭제 오류" });
  }
});

export default router;
