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
   📁 Multer: 한글 파일명 UTF-8 변환하여 저장 (fileFilter 포함)
============================================================ */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const utf8Name = Buffer.from(file.originalname, "latin1").toString("utf8");

    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);

    const safeName = `${timestamp}_${random}_${utf8Name}`;
    cb(null, safeName);
  }
});

const uploadNotice = multer({
  storage,
  fileFilter(req, file, cb) {
    // 🔥 한글 파일명 필터 완료 (multer가 size를 정상적으로 읽도록 보장)
    file.originalname = Buffer.from(file.originalname, "latin1").toString("utf8");
    cb(null, true);
  }
});

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

    /* ============================
       🔥 업로드된 파일 사이즈 로그
    ============================ */
    console.log("📁 업로드된 파일 목록:");
    req.files.forEach(f => {
      console.log("   👉", {
        originalname: f.originalname,
        filename: f.filename,
        size: f.size
      });
    });

    // 🔥 첨부파일 저장
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

    await db.execute(
      `UPDATE posts
         SET title=?, content=?, lang=?, sort_order=?
       WHERE id=? AND category='notice'`,
      [title, content, lang, sort_order, id]
    );

    // 삭제할 파일 처리
    let removeList = [];

    try {
      removeList = JSON.parse(req.body.removeFiles || "[]");
    } catch {
      removeList = [];
    }

    if (removeList.length > 0) {
      for (const filePath of removeList) {
        const absPath = path.join(__dirname, "..", filePath.replace(/^\//, ""));
        if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
      }

      await db.execute(
        `DELETE FROM post_files
          WHERE post_id=? AND file_path IN (${removeList.map(() => "?").join(",")})`,
        [id, ...removeList]
      );
    }

    /* ============================
       🔥 새 파일 업로드 시 size 로그
    ============================ */
    console.log("📁 수정 - 새로 업로드된 파일:");
    req.files.forEach(f => console.log("   👉", {
      originalname: f.originalname,
      filename: f.filename,
      size: f.size
    }));

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
      const absPath = path.join(__dirname, "..", f.file_path.replace(/^\//, ""));
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
   📥 파일 다운로드
============================================================ */
router.get("/download-file", async (req, res) => {
  const fileId = req.query.id;

  console.log("➡️ download-file called with id:", fileId);

  const [[file]] = await db.execute(
    `SELECT file_path, original_name FROM post_files WHERE id=?`,
    [fileId]
  );

  console.log("📁 DB file info:", file);

  if (!file) {
    console.log("❌ DB에서 파일 정보 없음");
    return res.status(404).json({ message: "file not found DB" });
  }

  // 우리가 예상하는 코드
  const absPath = path.join(__dirname, "../public", file.file_path.replace(/^\//, ""));

  console.log("🔍 서버가 찾는 실제 경로:", absPath);
  console.log("🔍 파일 존재 여부:", fs.existsSync(absPath));

  if (!fs.existsSync(absPath)) {
    console.log("❌ 파일이 서버 경로에 없음!");
    return res.status(404).json({ message: "file not found" });
  }

  res.setHeader(
    "Content-Disposition",
    `attachment; filename*=UTF-8''${encodeURIComponent(file.original_name)}`
  );

  res.download(absPath);
});



/* ============================================================
   📥 다운로드 로그 (DB 스키마에 맞게 수정)
============================================================ */
router.post("/download", async (req, res) => {
  try {
    const { notice_id, file_id } = req.body;

    if (!notice_id || !file_id) {
      return res.status(400).json({ message: "missing file_id or notice_id" });
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

export default router;
