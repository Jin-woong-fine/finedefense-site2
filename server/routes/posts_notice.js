// server/routes/posts_notice.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import db from "../config/db.js";
router.delete("/delete/:id", verifyToken, canDelete, async (req, res) => {

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// 📁 업로드 경로 생성
// ============================================================
const UPLOAD_ROOT = path.join(__dirname, "../public/uploads");
const NOTICE_DIR = path.join(UPLOAD_ROOT, "notice_files");

if (!fs.existsSync(NOTICE_DIR)) {
  fs.mkdirSync(NOTICE_DIR, { recursive: true });
}

// ------------------------------------------------------------
// 📌 안전한 경로 변환
//   /uploads/notice_files/xxx → /server/public/uploads/notice_files/xxx
// ------------------------------------------------------------
function toDiskPath(publicPath) {
  if (!publicPath) return null;

  // "/uploads/notice_files/xxx" → "notice_files/xxx"
  const clean = publicPath.replace(/^\/?uploads\//, "");

  return path.join(UPLOAD_ROOT, clean);
}

// ============================================================
// 📁 Multer 설정 (한글 파일명 정상 처리)
// ============================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, NOTICE_DIR);
  },
  filename: (req, file, cb) => {
    const utf8Name = Buffer.from(file.originalname, "latin1").toString("utf8");

    const unique = Date.now() + "_" + Math.round(Math.random() * 1e9);
    cb(null, `${unique}_${utf8Name}`);
  }
});

const uploadNotice = multer({
  storage,
  fileFilter(req, file, cb) {
    file.originalname = Buffer.from(file.originalname, "latin1").toString("utf8");
    cb(null, true);
  }
});

// ============================================================
// 📌 공지 등록
// ============================================================
router.post("/create", verifyToken, uploadNotice.array("files", 10), async (req, res) => {
  try {
    const { title, content, lang } = req.body;
    const sort_order = Number(req.body.sort_order || 9999);

    if (!title || !content || !lang) {
      return res.status(400).json({ message: "필수 값 누락" });
    }

    // 1) 게시글 생성
    const [result] = await db.execute(
      `INSERT INTO posts (title, content, category, lang, sort_order, author_id)
       VALUES (?, ?, 'notice', ?, ?, ?)`,
      [title, content, lang, sort_order, req.user.id]
    );

    const postId = result.insertId;

    // 2) 첨부파일 저장
    for (const f of req.files) {
      await db.execute(
        `INSERT INTO post_files (post_id, file_path, original_name, file_size)
         VALUES (?, ?, ?, ?)`,
        [postId, `/uploads/notice_files/${f.filename}`, f.originalname, f.size]
      );
    }

    res.json({ message: "공지 등록 완료", postId });

  } catch (err) {
    console.error("📌 공지 등록 오류:", err);
    res.status(500).json({ message: "공지 등록 오류" });
  }
});

// ============================================================
// 📌 공지 수정
// ============================================================
router.put("/update/:id", verifyToken, uploadNotice.array("files", 10), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, content, lang } = req.body;
    const sort_order = Number(req.body.sort_order || 9999);

    if (!title || !content || !lang) {
      return res.status(400).json({ message: "필수 값 누락" });
    }

    // 기본 내용 수정
    await db.execute(
      `UPDATE posts
         SET title=?, content=?, lang=?, sort_order=?
       WHERE id=? AND category='notice'`,
      [title, content, lang, sort_order, id]
    );

    // 삭제할 파일 목록
    let removeIds = [];
    try {
      removeIds = JSON.parse(req.body.removeFileIds || "[]");
    } catch {
      removeIds = [];
    }

    // 삭제 처리
    if (removeIds.length > 0) {
      const placeholders = removeIds.map(() => "?").join(",");

      const [rows] = await db.execute(
        `SELECT file_path FROM post_files
          WHERE post_id=? AND id IN (${placeholders})`,
        [id, ...removeIds]
      );

      for (const f of rows) {
        const diskPath = toDiskPath(f.file_path);
        if (diskPath && fs.existsSync(diskPath)) {
          fs.unlinkSync(diskPath);
        }
      }

      await db.execute(
        `DELETE FROM post_files
          WHERE post_id=? AND id IN (${placeholders})`,
        [id, ...removeIds]
      );
    }

    // 새 파일 저장
    for (const f of req.files) {
      await db.execute(
        `INSERT INTO post_files (post_id, file_path, original_name, file_size)
         VALUES (?, ?, ?, ?)`,
        [id, `/uploads/notice_files/${f.filename}`, f.originalname, f.size]
      );
    }

    res.json({ message: "공지 수정 완료" });

  } catch (err) {
    console.error("📌 공지 수정 오류:", err);
    res.status(500).json({ message: "수정 오류" });
  }
});

// ============================================================
// 📌 공지 삭제
// ============================================================
router.delete("/delete/:id", verifyToken, canDelete, async (req, res) => {
  try {
    const id = Number(req.params.id);

    // 파일 조회
    const [files] = await db.execute(
      `SELECT file_path FROM post_files WHERE post_id=?`,
      [id]
    );

    // 물리 파일 삭제
    for (const f of files) {
      const diskPath = toDiskPath(f.file_path);
      if (diskPath && fs.existsSync(diskPath)) {
        fs.unlinkSync(diskPath);
      }
    }

    // DB 삭제
    await db.execute(`DELETE FROM post_files WHERE post_id=?`, [id]);
    await db.execute(`DELETE FROM posts WHERE id=? AND category='notice'`, [id]);

    res.json({ message: "공지 삭제 완료" });

  } catch (err) {
    console.error("📌 공지 삭제 오류:", err);
    res.status(500).json({ message: "삭제 오류" });
  }
});

// ============================================================
// 📥 파일 다운로드 (file_id 기반 완전 안전 버전)
// ============================================================
router.get("/download-file", async (req, res) => {
  try {
    const fileId = Number(req.query.id);
    if (!fileId) return res.status(400).json({ message: "invalid file id" });

    const [[file]] = await db.execute(
      `SELECT file_path, original_name
         FROM post_files
        WHERE id=?`,
      [fileId]
    );

    if (!file) {
      return res.status(404).json({ message: "file not found DB" });
    }

    const diskPath = toDiskPath(file.file_path);

    if (!diskPath || !fs.existsSync(diskPath)) {
      return res.status(404).json({ message: "file not found" });
    }

    // 🔥 여기서 원래 저장된 파일명에서 숫자 제거
    // storedName = 실제 저장된 파일명
    const storedName = path.basename(file.file_path);

    // cleanName = 사용자에게 보여줄 깨끗한 파일명
    const cleanName = storedName.replace(/^\d+_\d+_/, "");

    // 헤더 설정 (안 해도 되지만 호환성↑)
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(cleanName)}`
    );

    // 파일 다운로드 (두 번째 인자로 cleanName을 명시!)
    res.download(diskPath, cleanName);

  } catch (err) {
    console.error("📌 다운로드 오류:", err);
    res.status(500).json({ message: "download error" });
  }
});

// ============================================================
// 📥 다운로드 로그 (DB 구조에 100% 맞춤)
// ============================================================
router.post("/download", async (req, res) => {
  try {
    const { notice_id, file_id } = req.body;

    if (!notice_id || !file_id) {
      return res.status(400).json({ message: "missing notice_id or file_id" });
    }

    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || "";
    const ua = req.headers["user-agent"] || "";

    await db.execute(
      `INSERT INTO notice_download_logs
         (notice_id, file_id, ip, user_agent)
       VALUES (?, ?, ?, ?)`,
      [notice_id, file_id, ip, ua]
    );

    res.json({ message: "download logged" });

  } catch (err) {
    console.error("📌 다운로드 로그 오류:", err);
    res.status(500).json({ message: "로그 오류" });
  }
});


// 공지사항 단건 조회 (관리자용)
router.get("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `
      SELECT
        id,
        title,
        content,
        lang,
        sort_order,
        created_at
      FROM posts
      WHERE id = ?
        AND category = 'notice'
      `,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "공지사항 없음" });
    }

    res.json({ notice: rows[0] });

  } catch (err) {
    console.error("공지 단건 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});



export default router;
