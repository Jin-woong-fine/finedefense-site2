// server/routes/posts_gallery.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";
import { fileURLToPath } from "url";

const router = express.Router();

/* ===========================================================
   📁 절대 경로 계산
=========================================================== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_ROOT = path.join(__dirname, "../public/uploads");
const GALLERY_DIR = path.join(UPLOAD_ROOT, "gallery");

if (!fs.existsSync(GALLERY_DIR)) {
  fs.mkdirSync(GALLERY_DIR, { recursive: true });
}

/* ===========================================================
   📁 Multer (한글 파일명 변환 + 안정성)
=========================================================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, GALLERY_DIR),
  filename: (req, file, cb) => {
    const utf8Name = Buffer.from(file.originalname, "latin1").toString("utf8");
    const ext = path.extname(utf8Name) || ".jpg";
    const safeName = `${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  }
});

const uploadGallery = multer({
  storage,
  fileFilter(req, file, cb) {
    file.originalname = Buffer.from(file.originalname, "latin1").toString("utf8");
    cb(null, true);
  }
});

/* ===========================================================
   🔧 헬퍼 함수
=========================================================== */
const toPublicPath = (filename) => `/uploads/gallery/${filename}`;

const toDiskPath = (publicPath) => {
  if (!publicPath) return null;
  const rel = publicPath.replace(/^\/+uploads\//, "");
  return path.join(UPLOAD_ROOT, rel);
};

/* ===========================================================
   📌 갤러리 생성
=========================================================== */
router.post(
  "/create",
  verifyToken,
  uploadGallery.array("images", 20),
  async (req, res) => {
    try {
      const { title, description, lang } = req.body;
      const files = req.files || [];

      if (!title) return res.status(400).json({ message: "제목은 필수입니다." });
      if (!files.length) return res.status(400).json({ message: "이미지는 최소 1개 필요합니다." });

      const coverImage = toPublicPath(files[0].filename);

      const [result] = await db.execute(
        `INSERT INTO posts (title, content, category, lang, author_id, main_image)
         VALUES (?, ?, 'gallery', ?, ?, ?)`,
        [title, description || "", lang || "kr", req.user.id, coverImage]
      );

      const postId = result.insertId;

      for (const f of files) {
        await db.execute(
          `INSERT INTO post_images (post_id, image_path) VALUES (?, ?)`,
          [postId, toPublicPath(f.filename)]
        );
      }

      res.json({ message: "갤러리 생성 완료", postId });

    } catch (err) {
      console.error("갤러리 생성 오류:", err);
      res.status(500).json({ message: "갤러리 생성 오류" });
    }
  }
);

/* ===========================================================
   📌 갤러리 수정
=========================================================== */
router.put(
  "/edit/:id",
  verifyToken,
  uploadGallery.array("images", 20),
  async (req, res) => {
    try {
      const postId = Number(req.params.id);
      if (!postId) return res.status(400).json({ message: "잘못된 ID" });

      const { title, description, lang } = req.body;
      const files = req.files || [];
      const coverImage = files.length ? toPublicPath(files[0].filename) : null;

      await db.execute(
        `UPDATE posts
           SET title=?, content=?, lang=?,
               main_image = IFNULL(?, main_image)
         WHERE id=? AND category='gallery'`,
        [title, description || "", lang || "kr", coverImage, postId]
      );

      if (files.length) {
        const [oldImages] = await db.execute(
          `SELECT image_path FROM post_images WHERE post_id=?`,
          [postId]
        );

        for (const img of oldImages) {
          const diskPath = toDiskPath(img.image_path);
          try { fs.unlinkSync(diskPath); } catch {}
        }

        await db.execute(`DELETE FROM post_images WHERE post_id=?`, [postId]);

        for (const f of files) {
          await db.execute(
            `INSERT INTO post_images (post_id, image_path) VALUES (?, ?)`,
            [postId, toPublicPath(f.filename)]
          );
        }
      }

      res.json({ message: "갤러리 수정 완료" });

    } catch (err) {
      console.error("갤러리 수정 오류:", err);
      res.status(500).json({ message: "갤러리 수정 오류" });
    }
  }
);

/* ===========================================================
   📌 갤러리 삭제
=========================================================== */
router.delete("/delete/:id", verifyToken, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    if (!postId) return res.status(400).json({ message: "잘못된 ID" });

    const [images] = await db.execute(
      `SELECT image_path FROM post_images WHERE post_id=?`,
      [postId]
    );

    for (const img of images) {
      const diskPath = toDiskPath(img.image_path);
      try { fs.unlinkSync(diskPath); } catch {}
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
   📌 갤러리 목록 조회
=========================================================== */
router.get("/list", async (req, res) => {
  try {
    const lang = req.query.lang || "kr";

    let sql = `
      SELECT p.*,
             u.name AS author_name,
             (SELECT COUNT(*) FROM post_images i WHERE i.post_id=p.id) AS image_count,
             (SELECT COUNT(*) FROM post_view_logs v WHERE v.post_id=p.id) AS views
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

/* ===========================================================
   📌 갤러리 상세 조회 (관리자 수정용)
=========================================================== */
router.get("/detail/:id", async (req, res) => {
  try {
    const postId = Number(req.params.id);
    if (!postId) {
      return res.status(400).json({ message: "잘못된 ID" });
    }

    // 1️⃣ 게시글 기본 정보
    const [rows] = await db.execute(
      `
      SELECT id, title, content, lang, main_image, created_at
        FROM posts
       WHERE id = ? AND category = 'gallery'
      `,
      [postId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "갤러리를 찾을 수 없습니다." });
    }

    const post = rows[0];

    // 2️⃣ 이미지 목록
    const [images] = await db.execute(
      `
      SELECT image_path
        FROM post_images
       WHERE post_id = ?
       ORDER BY id ASC
      `,
      [postId]
    );

    res.json({
      id: post.id,
      title: post.title,
      description: post.content,
      lang: post.lang,
      main_image: post.main_image,
      images: images.map(i => i.image_path),
      created_at: post.created_at
    });

  } catch (err) {
    console.error("갤러리 상세 조회 오류:", err);
    res.status(500).json({ message: "갤러리 상세 조회 오류" });
  }
});




export default router;
