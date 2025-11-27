// server/routes/posts_notice.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* ============================================================
   📁 Multer - 공지 첨부파일 저장 (한글 파일명 보존)
============================================================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "public/uploads/notice_files";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // 한글 정상 보존 + 중복 방지 prefix
    const safeName = Date.now() + "_" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);

    // 파일명: 1680000000_random_원본파일명.ext
    cb(null, `${safeName}_${base}${ext}`);
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

    const [result] = await db.execute(
      `INSERT INTO posts (title, content, category, lang, sort_order, author_id)
       VALUES (?, ?, 'notice', ?, ?, ?)`,
      [title, content, lang, sort_order, req.user.id]
    );

    const postId = result.insertId;

    // 첨부파일 저장
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

    await db.execute(
      `UPDATE posts 
         SET title=?, content=?, lang=?, sort_order=? 
       WHERE id=?`,
      [title, content, lang, sort_order, id]
    );

    // 🔥 삭제할 파일 목록 처리
    let removeList = [];
    try { removeList = JSON.parse(req.body.removeFiles || "[]"); } catch {}

    if (removeList.length > 0) {
      for (const filePath of removeList) {
        const fullPath = path.join("public", filePath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      }

      await db.execute(
        `DELETE FROM post_files 
         WHERE post_id=? AND file_path IN (${removeList.map(() => "?").join(",")})`,
        [id, ...removeList]
      );
    }

    // 🔥 새 파일 저장
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
   📥 다운로드 → 파일 전송
============================================================ */
router.get("/download-file", async (req, res) => {
  try {
    const filePath = req.query.path;
    const originalName = req.query.name;

    const absPath = path.join("public", filePath);

    if (!fs.existsSync(absPath)) {
      return res.status(404).send("File not found");
    }

    // 🔥 한글 파일명 깨짐 방지
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`
    );

    res.setHeader("Content-Type", "application/octet-stream");

    return res.download(absPath);

  } catch (err) {
    console.error("📌 다운로드 오류:", err);
    res.status(500).send("Download error");
  }
});

/* ============================================================
   📥 다운로드 로그 (프론트 호출)
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
