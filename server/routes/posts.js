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
    cb(null, Date.now() + "_" + Math.round(Math.random() * 1e9) + ext);
  }
});
const upload = multer({ storage });

/* ============================================================
   📈 조회수 증가 — 사용자가 게시물 페이지 접속 시 호출
============================================================ */
router.post("/view/:id", async (req, res) => {
  try {
    const postId = Number(req.params.id);
    if (!postId) return res.status(400).json({ message: "잘못된 id" });

    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role === "admin") {
          return res.json({ message: "관리자 제외", added: false });
        }
      } catch {}
    }

    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || "";
    const ua = req.headers["user-agent"] || "unknown";

    const [exists] = await db.execute(
      `SELECT id FROM post_view_logs 
       WHERE post_id=? AND ip=? AND user_agent=? 
       AND viewed_at > DATE_SUB(NOW(), INTERVAL 1 DAY)`,
      [postId, ip, ua]
    );

    if (exists.length) {
      return res.json({ message: "중복 조회", added: false });
    }

    await db.execute(
      `INSERT INTO post_view_logs (post_id, ip, user_agent) VALUES (?, ?, ?)`,
      [postId, ip, ua]
    );

    res.json({ message: "조회수 +1", added: true });

  } catch (err) {
    console.error("조회수 오류:", err);
    res.status(500).json({ message: "조회수 오류" });
  }
});


/* ============================================================
   📄 단일 조회
============================================================ */
router.get("/detail/:id", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.*, u.name AS author_name
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (!rows.length) return res.json({});

    const post = rows[0];

    const [images] = await db.execute(
      `SELECT image_path FROM post_images WHERE post_id=?`,
      [req.params.id]
    );

    post.images = images.map(i => i.image_path);
    res.json(post);

  } catch (err) {
    console.error("단일 조회 오류:", err);
    res.status(500).json({ message: "조회 오류" });
  }
});


/* ============================================================
   🧩 게시물 등록
============================================================ */
router.post("/", verifyToken, upload.array("images", 10), async (req, res) => {
  try {
    const { title, content, category, lang } = req.body;

    if (!req.files.length)
      return res.status(400).json({ message: "이미지를 첨부하세요." });

    const mainImage = `/uploads/news/${req.files[0].filename}`;

    const [result] = await db.execute(
      `INSERT INTO posts (title, content, category, lang, author_id, main_image)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, content, category, lang, req.user.id, mainImage]
    );

    const postId = result.insertId;

    for (const f of req.files) {
      await db.execute(
        `INSERT INTO post_images (post_id, image_path) VALUES (?, ?)`,
        [postId, `/uploads/news/${f.filename}`]
      );
    }

    res.json({ message: "등록 완료", postId });

  } catch (err) {
    console.error("등록 오류:", err);
    res.status(500).json({ message: "등록 오류" });
  }
});


/* ============================================================
   📤 게시물 목록
============================================================ */
router.get("/list/:category", async (req, res) => {
  try {
    const lang = req.query.lang || "kr";

    const [posts] = await db.execute(
      `SELECT 
         p.*,
         u.name AS author_name,
         (SELECT COUNT(*) FROM post_view_logs v WHERE v.post_id = p.id) AS total_views
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       WHERE p.category=? AND p.lang=?
       ORDER BY p.created_at DESC`,
      [req.params.category, lang]
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
    console.error("목록 오류:", err);
    res.status(500).json({ message: "목록 오류" });
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

    if (req.files.length) {
      const [oldImgs] = await db.execute(
        `SELECT image_path FROM post_images WHERE post_id=?`,
        [id]
      );

      for (const img of oldImgs) {
        const filePath = img.image_path.replace(/^\//, "");
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      await db.execute(`DELETE FROM post_images WHERE post_id=?`, [id]);

      for (const f of req.files) {
        await db.execute(
          `INSERT INTO post_images (post_id, image_path) VALUES (?, ?)`,
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
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "권한 없음" });

    const id = req.params.id;

    const [imgs] = await db.execute(
      `SELECT image_path FROM post_images WHERE post_id=?`,
      [id]
    );

    for (const img of imgs) {
      const filePath = img.image_path.replace(/^\//, "");
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await db.execute(`DELETE FROM post_images WHERE post_id=?`, [id]);
    await db.execute(`DELETE FROM posts WHERE id=?`, [id]);

    res.json({ message: "삭제 완료" });

  } catch (err) {
    console.error("삭제 오류:", err);
    res.status(500).json({ message: "삭제 오류" });
  }
});


/* ============================================================
   📢 NOTICE 전용 Alias 라우트 (프론트 사용 편하게)
   기존 posts.js 기능 그대로 활용
============================================================ */

// 공지 목록 (alias)
router.get("/notice", async (req, res) => {
  return router.handle(
    Object.assign(req, { url: `/list/notice`, method: "GET" }),
    res,
    () => {}
  );
});


// 공지 상세
router.get("/notice/:id", async (req, res) => {
  return router.handle(
    Object.assign(req, { url: `/detail/${req.params.id}`, method: "GET" }),
    res,
    () => {}
  );
});

// 공지 조회수 증가
router.post("/notice/view/:id", async (req, res) => {
  return router.handle(
    Object.assign(req, { url: `/view/${req.params.id}`, method: "POST" }),
    res,
    () => {}
  );
});

// 공지 등록
router.post("/notice/create", verifyToken, upload.array("images", 10), async (req, res) => {
  req.body.category = "notice";   // 분류 자동 notice
  return router.handle(
    Object.assign(req, { url: "/", method: "POST" }),
    res,
    () => {}
  );
});

// 공지 수정
router.put("/notice/update/:id", verifyToken, upload.array("images", 10), async (req, res) => {
  return router.handle(
    Object.assign(req, { url: `/${req.params.id}`, method: "PUT" }),
    res,
    () => {}
  );
});

// 공지 삭제
router.delete("/notice/delete/:id", verifyToken, async (req, res) => {
  return router.handle(
    Object.assign(req, { url: `/${req.params.id}`, method: "DELETE" }),
    res,
    () => {}
  );
});



export default router;



