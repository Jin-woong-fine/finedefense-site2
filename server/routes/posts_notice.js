// server/routes/posts_notice.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import iconv from "iconv-lite";
import db from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* ============================================================
   📁 Multer - 공지 첨부파일 저장 (public/uploads로 이동)
============================================================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "public/uploads/notice_files";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },

  filename: (req, file, cb) => {
    // 한글 파일명 깨짐 방지
    const decoded = iconv.decode(Buffer.from(file.originalname, "latin1"), "utf8");
    const ext = path.extname(decoded);
    const filename = Date.now() + "_" + Math.round(Math.random() * 1e9) + ext;
    cb(null, filename);
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
        `INSERT INTO post_files (post_id, file_path, original_name)
         VALUES (?, ?, ?)`,
        [
          postId,
          `/uploads/notice_files/${f.filename}`,
          f.originalname
        ]
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

    // 기본 정보 업데이트
    await db.execute(
      `UPDATE posts 
         SET title=?, content=?, lang=?, sort_order=? 
       WHERE id=?`,
      [title, content, lang, sort_order, id]
    );

    /* ============================================================
       🗑 기존 파일 삭제 목록 처리
    ============================================================= */
    let removeList = [];
    try {
      removeList = JSON.parse(req.body.removeFiles || "[]");
    } catch { /* ignore */ }

    if (removeList.length > 0) {
      for (const filePath of removeList) {
        const localPath = ("public" + filePath).replace(/^\//, "");
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      }

      await db.execute(
        `DELETE FROM post_files WHERE post_id=? AND file_path IN (${removeList.map(() => "?").join(",")})`,
        [id, ...removeList]
      );
    }

    /* ============================================================
       🆕 새 파일 저장
    ============================================================= */
    for (const f of req.files) {
      await db.execute(
        `INSERT INTO post_files (post_id, file_path, original_name)
         VALUES (?, ?, ?)`,
        [
          id,
          `/uploads/notice_files/${f.filename}`,
          f.originalname
        ]
      );
    }

    res.json({ message: "공지 수정 완료" });

  } catch (err) {
    console.error("📌 공지 수정 오류:", err);
    res.status(500).json({ message: "공지 수정 오류" });
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

    // 파일 삭제
    for (const f of files) {
      const localPath = ("public" + f.file_path).replace(/^\//, "");
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    }

    await db.execute(`DELETE FROM post_files WHERE post_id=?`, [id]);
    await db.execute(`DELETE FROM posts WHERE id=?`, [id]);

    res.json({ message: "공지 삭제 완료" });

  } catch (err) {
    console.error("📌 공지 삭제 오류:", err);
    res.status(500).json({ message: "삭제 오류" });
  }
});

/* ============================================================
   📥 다운로드 로그 저장
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
