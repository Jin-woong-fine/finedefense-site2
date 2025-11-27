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
   📁 Multer - 공지 첨부파일 저장 (public/uploads/notice_files)
   - 실제 URL: /uploads/notice_files/파일명
============================================================ */
const uploadDir = path.join(__dirname, "../public/uploads/notice_files");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = Date.now() + "_" + Math.round(Math.random() * 1e9);
    cb(null, base + ext);
  }
});

const uploadNotice = multer({ storage });

/* ============================================================
   📌 공지 등록
   POST /api/posts/notice/create
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

    // 첨부파일 저장 (post_files 테이블에 file_size 컬럼 있다고 가정)
    for (const f of req.files) {
      await db.execute(
        `INSERT INTO post_files (post_id, file_path, original_name, file_size)
         VALUES (?, ?, ?, ?)`,
        [postId, `/uploads/notice_files/${f.filename}`, f.originalname, f.size ?? 0]
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
   PUT /api/posts/notice/update/:id
============================================================ */
router.put(
  "/update/:id",
  verifyToken,
  uploadNotice.array("files", 10),
  async (req, res) => {
    try {
      const id = req.params.id;
      const { title, content, lang } = req.body;
      const sort_order = Number(req.body.sort_order || 9999);

      if (!title || !content || !lang) {
        return res.status(400).json({ message: "필수 값 누락" });
      }

      // 기본 정보 업데이트
      await db.execute(
        `UPDATE posts
           SET title = ?, content = ?, lang = ?, sort_order = ?
         WHERE id = ? AND category = 'notice'`,
        [title, content, lang, sort_order, id]
      );

      /* ============================
         🗑 삭제할 기존 파일 처리
         - req.body.removeFiles: ["파일경로", ...]
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
          const localPath = filePath.replace(/^\//, ""); // 앞 / 제거
          const absPath = path.join(__dirname, "..", localPath);
          if (fs.existsSync(absPath)) {
            fs.unlinkSync(absPath);
          }
        }

        // DB 삭제
        await db.execute(
          `DELETE FROM post_files
            WHERE post_id = ? AND file_path IN (${removeList.map(() => "?").join(",")})`,
          [id, ...removeList]
        );
      }

      /* ============================
         🆕 새 첨부파일 저장
      ============================ */
      for (const f of req.files) {
        await db.execute(
          `INSERT INTO post_files (post_id, file_path, original_name, file_size)
           VALUES (?, ?, ?, ?)`,
          [id, `/uploads/notice_files/${f.filename}`, f.originalname, f.size ?? 0]
        );
      }

      res.json({ message: "공지 수정 완료" });
    } catch (err) {
      console.error("📌 공지 수정 오류:", err);
      res.status(500).json({ message: "수정 오류" });
    }
  }
);

/* ============================================================
   📌 공지 삭제
   DELETE /api/posts/notice/delete/:id
============================================================ */
router.delete("/delete/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;

    // 첨부파일 목록 가져오기
    const [files] = await db.execute(
      `SELECT file_path FROM post_files WHERE post_id = ?`,
      [id]
    );

    // 실제 파일 삭제
    for (const f of files) {
      const localRel = f.file_path.replace(/^\//, ""); // /uploads/...
      const absPath = path.join(__dirname, "..", localRel);
      if (fs.existsSync(absPath)) {
        fs.unlinkSync(absPath);
      }
    }

    // DB에서 파일/게시글 삭제
    await db.execute(`DELETE FROM post_files WHERE post_id = ?`, [id]);
    await db.execute(`DELETE FROM posts WHERE id = ? AND category = 'notice'`, [id]);

    res.json({ message: "공지 삭제 완료" });
  } catch (err) {
    console.error("📌 공지 삭제 오류:", err);
    res.status(500).json({ message: "삭제 오류" });
  }
});

/* ============================================================
   📥 공지 첨부파일 다운로드 로그
   POST /api/posts/notice/download
============================================================ */
router.post("/download", async (req, res) => {
  try {
    const { notice_id, file_path, original_name } = req.body;

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.ip ||
      "";
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
