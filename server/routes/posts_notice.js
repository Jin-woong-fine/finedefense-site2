// server/routes/posts_notice.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* ========= Multer (공지 첨부파일) ========= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/notice_files";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "_" + Math.round(Math.random() * 1e9) + ext);
  }
});
const uploadNotice = multer({ storage });

/* ========= 공지 등록 ========= */
router.post("/create", verifyToken, uploadNotice.array("files", 10), async (req, res) => {
  try {
    const { title, content, lang } = req.body;

    const [result] = await db.execute(
      `INSERT INTO posts (title, content, category, lang, author_id)
       VALUES (?, ?, 'notice', ?, ?)`,
      [title, content, lang, req.user.id]
    );

    const postId = result.insertId;

    for (const f of req.files) {
      await db.execute(
        `INSERT INTO post_files (post_id, file_path, original_name)
         VALUES (?, ?, ?)`,
        [postId, `/uploads/notice_files/${f.filename}`, f.originalname]
      );
    }

    res.json({ message: "공지 등록 완료", postId });

  } catch (err) {
    console.error("공지 등록 오류:", err);
    res.status(500).json({ message: "공지 등록 오류" });
  }
});


/* ========= 공지 수정 ========= */
router.put("/update/:id", verifyToken, uploadNotice.array("files", 10), async (req, res) => {
  try {
    const id = req.params.id;
    const { title, content, lang } = req.body;

    await db.execute(
      `UPDATE posts SET title=?, content=?, lang=? WHERE id=?`,
      [title, content, lang, id]
    );

    // 기존 파일 삭제
    const [oldFiles] = await db.execute(
      `SELECT file_path FROM post_files WHERE post_id=?`,
      [id]
    );

    for (const f of oldFiles) {
      const pathStr = f.file_path.replace(/^\//, "");
      if (fs.existsSync(pathStr)) fs.unlinkSync(pathStr);
    }

    await db.execute(`DELETE FROM post_files WHERE post_id=?`, [id]);

    // 새 파일 저장
    for (const f of req.files) {
      await db.execute(
        `INSERT INTO post_files (post_id, file_path, original_name)
         VALUES (?, ?, ?)`,
        [id, `/uploads/notice_files/${f.filename}`, f.originalname]
      );
    }

    res.json({ message: "공지 수정 완료" });

  } catch (err) {
    console.error("공지 수정 오류:", err);
    res.status(500).json({ message: "수정 오류" });
  }
});


/* ========= 공지 삭제 ========= */
router.delete("/delete/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;

    const [files] = await db.execute(
      `SELECT file_path FROM post_files WHERE post_id=?`,
      [id]
    );

    for (const f of files) {
      const pathStr = f.file_path.replace(/^\//, "");
      if (fs.existsSync(pathStr)) fs.unlinkSync(pathStr);
    }

    await db.execute(`DELETE FROM post_files WHERE post_id=?`, [id]);
    await db.execute(`DELETE FROM posts WHERE id=?`, [id]);

    res.json({ message: "공지 삭제 완료" });

  } catch (err) {
    console.error("공지 삭제 오류:", err);
    res.status(500).json({ message: "삭제 오류" });
  }
});


/* =====================================================================
    📥 공지사항 첨부파일 다운로드 로그  ← 여기에 붙여넣기!
===================================================================== */
router.post("/notice/download", async (req, res) => {
  try {
    const { notice_id, file_path, original_name } = req.body;

    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || "";
    const ua = req.headers["user-agent"] || "unknown";

    await db.execute(
      `INSERT INTO notice_download_logs (notice_id, file_path, original_name, ip, user_agent)
       VALUES (?, ?, ?, ?, ?)`,
      [notice_id, file_path, original_name, ip, ua]
    );

    res.json({ message: "download logged" });

  } catch (err) {
    console.error("다운로드 로그 오류:", err);
    res.status(500).json({ message: "로그 오류" });
  }
});


export default router;
