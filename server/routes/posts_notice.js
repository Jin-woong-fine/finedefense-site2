// server/routes/posts_notice.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import db from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ============================================================
   📁 업로드 경로 생성
============================================================ */
const uploadDir = path.join(__dirname, "../public/uploads/notice_files");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/* ============================================================
   📁 Multer: 한글 파일명 UTF-8 변환하여 저장
============================================================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 🔥 한글 파일명 변환 (latin1 → utf8)
    const utf8Name = Buffer.from(file.originalname, "latin1").toString("utf8");

    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);

    const safeName = `${timestamp}_${random}_${utf8Name}`;
    cb(null, safeName);
  }
});

const uploadNotice = multer({ storage });

/* ============================================================
   📌 공지 등록
============================================================ */
router.post("/create", verifyToken, uploadNotice.array("files", 10), async (req, res) => {
  try {
    const { title, content, lang } = req.body;
    const sort_order = Number(req.body.sort_order || 9999);

    if (!title || !content || !lang) {
      return res.status(400).json({ message: "필수 값 누락" });
    }

    const [result] = await db.execute(
      `INSERT INTO posts (title, content, category, lang, sort_order, author_id)
       VALUES (?, ?, 'notice', ?, ?, ?)`,
      [title, content, lang, sort_order, req.user.id]
    );

    const postId = result.insertId;

    // 🔥 첨부파일 저장
    for (const f of req.files) {
      const utf8Original = Buffer.from(f.originalname, "latin1").toString("utf8");

      await db.execute(
        `INSERT INTO post_files (post_id, file_path, original_name, file_size)
         VALUES (?, ?, ?, ?)`,
        [postId, `/uploads/notice_files/${f.filename}`, utf8Original, f.size]
      );
    }

    res.json({ message: "공지 등록 완료", postId });

  } catch (err) {
    console.error("📌 공지 등록 오류:", err);
    res.status(500).json({ message: "공지 등록 오류" });
  }
});

/* ============================================================
   📌 공지 수정
============================================================ */
router.put("/update/:id", verifyToken, uploadNotice.array("files", 10), async (req, res) => {
  try {
    const id = req.params.id;
    const { title, content, lang } = req.body;
    const sort_order = Number(req.body.sort_order || 9999);

    if (!title || !content || !lang) {
      return res.status(400).json({ message: "필수 값 누락" });
    }

    // 🔥 기본 정보 업데이트
    await db.execute(
      `UPDATE posts
         SET title=?, content=?, lang=?, sort_order=?
       WHERE id=? AND category='notice'`,
      [title, content, lang, sort_order, id]
    );

    /* ============================
       🗑 삭제할 기존 파일 처리
    ============================ */
    let removeList = [];

    try {
      removeList = JSON.parse(req.body.removeFiles || "[]");
    } catch {
      removeList = [];
    }

    if (removeList.length > 0) {
      // 실제 파일 삭제
      for (const filePath of removeList) {
        const relative = filePath.replace(/^\//, "");
        const absPath = path.join(__dirname, "..", relative);

        if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
      }

      // DB 삭제
      await db.execute(
        `DELETE FROM post_files
          WHERE post_id=? AND file_path IN (${removeList.map(() => "?").join(",")})`,
        [id, ...removeList]
      );
    }

    /* ============================
       🆕 새 파일 저장
    ============================ */
    for (const f of req.files) {
      const utf8Original = Buffer.from(f.originalname, "latin1").toString("utf8");

      await db.execute(
        `INSERT INTO post_files (post_id, file_path, original_name, file_size)
         VALUES (?, ?, ?, ?)`,
        [id, `/uploads/notice_files/${f.filename}`, utf8Original, f.size]
      );
    }

    res.json({ message: "공지 수정 완료" });

  } catch (err) {
    console.error("📌 공지 수정 오류:", err);
    res.status(500).json({ message: "수정 오류" });
  }
});

/* ============================================================
   📌 공지 삭제
============================================================ */
router.delete("/delete/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;

    const [files] = await db.execute(
      `SELECT file_path FROM post_files WHERE post_id=?`,
      [id]
    );

    for (const f of files) {
      const relative = f.file_path.replace(/^\//, "");
      const absPath = path.join(__dirname, "..", relative);

      if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
    }

    await db.execute(`DELETE FROM post_files WHERE post_id=?`, [id]);
    await db.execute(`DELETE FROM posts WHERE id=? AND category='notice'`, [id]);

    res.json({ message: "공지 삭제 완료" });

  } catch (err) {
    console.error("📌 공지 삭제 오류:", err);
    res.status(500).json({ message: "삭제 오류" });
  }
});

/* ============================================================
   📥 실다운로드 (한글 파일명 깨짐 방지)
============================================================ */
router.get("/download-file", async (req, res) => {
  const filePath = req.query.path;
  const originalName = req.query.name;

  if (!filePath || !originalName) {
    return res.status(400).json({ message: "file info missing" });
  }

  const absPath = path.join(__dirname, "..", filePath.replace(/^\//, ""));

  if (!fs.existsSync(absPath)) {
    return res.status(404).json({ message: "file not found" });
  }

  // 🔥 한글 파일명 깨짐 방지
  res.setHeader(
    "Content-Disposition",
    `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`
  );

  res.download(absPath);
});

/* ============================================================
   📥 다운로드 로그 기록
============================================================ */
router.post("/download", async (req, res) => {
  try {
    const { notice_id, file_path, original_name } = req.body;

    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || "";
    const ua = req.headers["user-agent"] || "unknown";

    await db.execute(
      `INSERT INTO notice_download_logs
         (notice_id, file_path, original_name, ip, user_agent)
       VALUES (?, ?, ?, ?, ?)`,
      [notice_id, file_path, original_name, ip, ua]
    );

    res.json({ message: "download logged" });

  } catch (err) {
    console.error("📌 다운로드 로그 오류:", err);
    res.status(500).json({ message: "로그 오류" });
  }
});

export default router;
