// server/routes/posts_gallery.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* ===========================================================
   📁 업로드 경로 (절대경로)
=========================================================== */
const UPLOAD_DIR = path.join(process.cwd(), "server/uploads/gallery");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/* ===========================================================
   📁 Multer 설정
=========================================================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "_" + Math.round(Math.random() * 1e9) + ext);
  }
});

const uploadGallery = multer({ storage });

/* ===========================================================
   📌 갤러리 생성
=========================================================== */
router.post("/create", verifyToken, uploadGallery.array("images", 20), async (req, res) => {
  try {
    const { title, description, lang } = req.body;

    if (!title) return res.status(400).json({ message: "제목은 필수입니다." });
    if (!req.files.length) return res.status(400).json({ message: "이미지는 최소 1개 필요" });

    const coverImage = `/uploads/gallery/${req.files[0].filename}`;

    const [result] = await db.execute(
      `INSERT INTO posts (title, content, category, lang, author_id, main_image)
       VALUES (?, ?, 'gallery', ?, ?, ?)`,
      [title, description || "", lang, req.user.id, coverImage]
    );

    const postId = result.insertId;

    for (const f of req.files) {
      await db.execute(
        `INSERT INTO post_images (post_id, image_path) VALUES (?, ?)`,
        [postId, `/uploads/gallery/${f.filename}`]
      );
    }

    res.json({ message: "갤러리 생성 완료", postId });

  } catch (err) {
    console.error("갤러리 생성 오류:", err);
    res.status(500).json({ message: "갤러리 생성 오류" });
  }
});

/* ===========================================================
   📌 갤러리 수정
=========================================================== */
router.put("/edit/:id", verifyToken, uploadGallery.array("images", 20), async (req, res) => {
  try {
    const postId = req.params.id;
    const { title, description, lang } = req.body;

    const hasNewImages = req.files.length > 0;
    const coverImage = hasNewImages ? `/uploads/gallery/${req.files[0].filename}` : null;

    await db.execute(
      `UPDATE posts
         SET title=?, content=?, lang=?, main_image = IFNULL(?, main_image)
       WHERE id=? AND category='gallery'`,
      [title, description, lang, coverImage, postId]
    );

    if (hasNewImages) {
      const [oldImages] = await db.execute(
        `SELECT image_path FROM post_images WHERE post_id=?`,
        [postId]
      );

      for (const img of oldImages) {
        const realPath = path.join(process.cwd(), "server", img.image_path);
        try { fs.unlinkSync(realPath); } catch {}
      }

      await db.execute(`DELETE FROM post_images WHERE post_id=?`, [postId]);

      for (const f of req.files) {
        await db.execute(
          `INSERT INTO post_images (post_id, image_path) VALUES (?, ?)`,
          [postId, `/uploads/gallery/${f.filename}`]
        );
      }
    }

    res.json({ message: "갤러리 수정 완료" });

  } catch (err) {
    console.error("갤러리 수정 오류:", err);
    res.status(500).json({ message: "갤러리 수정 오류" });
  }
});

/* ===========================================================
   📌 삭제
=========================================================== */
router.delete("/delete/:id", verifyToken, async (req, res) => {
  try {
    const postId = req.params.id;

    const [images] = await db.execute(
      `SELECT image_path FROM post_images WHERE post_id=?`,
      [postId]
    );

    for (const img of images) {
      const real = path.join(process.cwd(), "server", img.image_path);
      try { fs.unlinkSync(real); } catch {}
    }

    await db.execute(`DELETE FROM post_images WHERE post_id=?`, [postId]);
    await db.execute(`DELETE FROM posts WHERE id=? AND category='gallery'`, [postId]);

    res.json({ message: "갤러리 삭제 완료" });

  } catch (err) {
    console.error("갤러리 삭제 오류:", err);
    res.status(500).json({ message: "갤러리 삭제 오류" });
  }
});

/* ===========================================================
   📌 목록 조회
=========================================================== */
router.get("/list", async (req, res) => {
  try {
    const lang = req.query.lang || "kr";

    let sql = `
      SELECT p.*,
             u.name AS author_name,
             (SELECT COUNT(*) FROM post_images i WHERE i.post_id = p.id) AS image_count,
             (SELECT COUNT(*) FROM post_view_logs v WHERE v.post_id = p.id) AS views
        FROM posts p
        LEFT JOIN users u ON u.id = p.author_id
       WHERE p.category='gallery'
    `;

    const params = [];

    if (lang !== "all") {
      sql += ` AND p.lang=?`;
      params.push(lang);
    }

    sql += ` ORDER BY p.created_at DESC`;

    const [rows] = await db.execute(sql, params);
    res.json(rows);

  } catch (err) {
    console.error("갤러리 목록 오류:", err);
    res.status(500).json({ message: "갤러리 목록 오류" });
  }
});

export default router;
