// server/routes/posts.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* =====================================================================
    📁 Multer 저장 경로 구분
    - 뉴스룸: uploads/news/
    - 공지사항: uploads/notice_files/
===================================================================== */

// ▣ 뉴스룸 이미지 저장
const newsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/news";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "_" + Math.round(Math.random() * 1e9) + ext);
  },
});
const uploadNews = multer({ storage: newsStorage });

// ▣ 공지사항 첨부파일 저장
const noticeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/notice_files";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "_" + Math.round(Math.random() * 1e9) + ext);
  },
});
const uploadNotice = multer({ storage: noticeStorage });

/* =====================================================================
    📈 조회수 증가 (공통)
===================================================================== */
router.post("/view/:id", async (req, res) => {
  try {
    const postId = Number(req.params.id);
    if (!postId) return res.status(400).json({ message: "invalid id" });

    const token = req.headers.authorization?.split(" ")[1];

    // 관리자 / 에디터 조회수 제외
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (["admin", "superadmin", "editor"].includes(decoded.role)) {
          return res.json({ message: "관리자 제외", added: false });
        }
      } catch {}
    }

    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || "";
    const ua = req.headers["user-agent"] || "unknown";

    const [exists] = await db.execute(
      `SELECT id
         FROM post_view_logs
        WHERE post_id=? AND ip=? AND user_agent=?
          AND viewed_at > DATE_SUB(NOW(), INTERVAL 1 DAY)`,
      [postId, ip, ua]
    );

    if (exists.length) {
      return res.json({ message: "중복 조회", added: false });
    }

    await db.execute(
      `INSERT INTO post_view_logs (post_id, ip, user_agent)
       VALUES (?, ?, ?)`,
      [postId, ip, ua]
    );

    res.json({ message: "조회수 +1", added: true });
  } catch (err) {
    console.error("조회수 오류:", err);
    res.status(500).json({ message: "조회 오류" });
  }
});

/* =====================================================================
    📄 단일 조회 (뉴스/공지 공통)
    - 뉴스: post_images
    - 공지: post_files
===================================================================== */
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

    // 뉴스룸 → 이미지 리스트
    const [images] = await db.execute(
      `SELECT image_path
         FROM post_images
        WHERE post_id=?`,
      [req.params.id]
    );
    post.images = images.map((i) => i.image_path);

    // 공지사항 → 첨부파일 리스트
    const [files] = await db.execute(
      `SELECT id, file_path, original_name
         FROM post_files
        WHERE post_id=?`,
      [req.params.id]
    );
    post.files = files; // [{id, file_path, original_name}, ...]

    res.json(post);
  } catch (err) {
    console.error("단일 조회 오류:", err);
    res.status(500).json({ message: "조회 오류" });
  }
});

/* =====================================================================
    🧩 뉴스룸 게시물 등록 (이미지)
    - POST /api/posts/news/create
    - body: { title, content, lang }
    - files: images[]
===================================================================== */
router.post(
  "/news/create",
  verifyToken,
  uploadNews.array("images", 10),
  async (req, res) => {
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
          `INSERT INTO post_images (post_id, image_path)
           VALUES (?, ?)`,
          [postId, `/uploads/news/${f.filename}`]
        );
      }

      res.json({ message: "뉴스 등록 완료", postId });
    } catch (err) {
      console.error("뉴스 등록 오류:", err);
      res.status(500).json({ message: "등록 오류" });
    }
  }
);

/* =====================================================================
    🧩 공지사항 등록 (파일 첨부)
    - POST /api/posts/notice/create
    - body: { title, content, lang }
    - files: files[]
===================================================================== */
router.post(
  "/notice/create",
  verifyToken,
  uploadNotice.array("files", 10),
  async (req, res) => {
    try {
      const { title, content, lang } = req.body;

      if (!title || !content) {
        return res.status(400).json({ message: "필수 항목 누락" });
      }

      const [result] = await db.execute(
        `INSERT INTO posts (title, content, category, lang, author_id)
         VALUES (?, ?, 'notice', ?, ?)`,
        [title, content, lang, req.user.id]
      );

      const postId = result.insertId;

      // 첨부파일 저장 (있으면)
      if (req.files && req.files.length) {
        for (const f of req.files) {
          await db.execute(
            `INSERT INTO post_files (post_id, file_path, original_name)
             VALUES (?, ?, ?)`,
            [postId, `/uploads/notice_files/${f.filename}`, f.originalname]
          );
        }
      }

      res.json({ message: "공지사항 등록 완료", postId });
    } catch (err) {
      console.error("공지 등록 오류:", err);
      res.status(500).json({ message: "공지 등록 오류" });
    }
  }
);

/* =====================================================================
    📤 목록 조회 (뉴스/공지 공통 기본)
    - GET /api/posts/list/news?lang=kr
    - GET /api/posts/list/notice?lang=kr
===================================================================== */
router.get("/list/:category", async (req, res) => {
  const lang = req.query.lang || "kr";

  let query = `
    SELECT p.*, u.name AS author_name,
      (SELECT COUNT(*) FROM post_view_logs v WHERE v.post_id = p.id) AS views
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    WHERE p.category = ?
  `;
  const params = [req.params.category];

  // ALL이 아닌 경우만 lang 조건 추가
  if (lang !== "all") {
    query += " AND p.lang = ? ";
    params.push(lang);
  }

  query += " ORDER BY p.sort_order ASC, p.created_at DESC";

  const [posts] = await db.execute(query, params);

  res.json(posts);
});

/* =====================================================================
    📤 공지 목록(alias) — 기존 프론트 호환
    - GET /api/posts/notice?lang=kr
    (+ 첨부파일 개수 포함)
===================================================================== */
router.get("/notice", async (req, res) => {
  try {
    const lang = req.query.lang || "kr";

    const [posts] = await db.execute(
      `SELECT 
          p.*,
          u.name AS author_name,
          (SELECT COUNT(*) FROM post_view_logs v WHERE v.post_id = p.id) AS views,
          (SELECT COUNT(*) FROM post_files f WHERE f.post_id = p.id) AS file_count
         FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
        WHERE p.category='notice' AND p.lang=?
        ORDER BY p.created_at DESC`,
      [lang]
    );

    res.json(posts);
  } catch (err) {
    console.error("공지 목록(alias) 오류:", err);
    res.status(500).json({ message: "공지 목록 오류" });
  }
});

/* =====================================================================
    📝 공지사항 수정 (파일 교체)
    - PUT /api/posts/notice/update/:id
===================================================================== */
router.put(
  "/notice/update/:id",
  verifyToken,
  uploadNotice.array("files", 10),
  async (req, res) => {
    try {
      const id = req.params.id;
      const { title, content, lang } = req.body;

      await db.execute(
        `UPDATE posts
            SET title=?, content=?, lang=?
          WHERE id=? AND category='notice'`,
        [title, content, lang, id]
      );

      // 첨부파일 아예 갈아끼우는 방식
      const [oldFiles] = await db.execute(
        `SELECT file_path FROM post_files WHERE post_id=?`,
        [id]
      );

      for (const file of oldFiles) {
        const filePath = file.file_path.replace(/^\//, "");
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      await db.execute(`DELETE FROM post_files WHERE post_id=?`, [id]);

      if (req.files && req.files.length) {
        for (const f of req.files) {
          await db.execute(
            `INSERT INTO post_files (post_id, file_path, original_name)
             VALUES (?, ?, ?)`,
            [id, `/uploads/notice_files/${f.filename}`, f.originalname]
          );
        }
      }

      res.json({ message: "공지 수정 완료" });
    } catch (err) {
      console.error("공지 수정 오류:", err);
      res.status(500).json({ message: "수정 오류" });
    }
  }
);

/* =====================================================================
    🗑 공지 삭제 (파일 포함)
    - DELETE /api/posts/notice/delete/:id
===================================================================== */
router.delete("/notice/delete/:id", verifyToken, async (req, res) => {
  try {
    // 삭제 권한: admin / superadmin 만
    if (!["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "권한 없음" });
    }

    const id = req.params.id;

    const [files] = await db.execute(
      `SELECT file_path FROM post_files WHERE post_id=?`,
      [id]
    );

    for (const f of files) {
      const filePath = f.file_path.replace(/^\//, "");
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await db.execute(`DELETE FROM post_files WHERE post_id=?`, [id]);
    await db.execute(`DELETE FROM posts WHERE id=?`, [id]);

    res.json({ message: "공지 삭제 완료" });
  } catch (err) {
    console.error("삭제 오류:", err);
    res.status(500).json({ message: "삭제 오류" });
  }
});

/* =====================================================================
    📥 공지 첨부파일 다운로드 + 로그
    - GET /api/posts/notice/file/:fileId/download
    ※ 필요 테이블: post_download_logs
       id, post_id, file_id, ip, user_agent, downloaded_at
===================================================================== */
router.get("/notice/file/:fileId/download", async (req, res) => {
  try {
    const fileId = req.params.fileId;

    // 파일 정보 조회
    const [rows] = await db.execute(
      `SELECT * FROM post_files WHERE id=?`,
      [fileId]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "파일 없음" });
    }

    const file = rows[0];
    const filePath = file.file_path.replace(/^\//, "");

    // 다운로드 로그 기록
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || "";
    const ua = req.headers["user-agent"] || "unknown";

    await db.execute(
      `INSERT INTO post_download_logs (post_id, file_id, ip, user_agent)
       VALUES (?, ?, ?, ?)`,
      [file.post_id, fileId, ip, ua]
    );

    // 실제 파일 전송
    return res.download(filePath, file.original_name);
  } catch (err) {
    console.error("파일 다운로드 오류:", err);
    res.status(500).json({ message: "파일 다운로드 오류" });
  }
});

export default router;
