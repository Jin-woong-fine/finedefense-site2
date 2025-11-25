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
   📁 server 절대경로 계산
=========================================================== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔹 업로드 루트: /server/uploads
const UPLOAD_ROOT = path.join(__dirname, "../uploads");
// 🔹 갤러리 폴더: /server/uploads/gallery
const GALLERY_DIR = path.join(UPLOAD_ROOT, "gallery");

if (!fs.existsSync(GALLERY_DIR)) {
  fs.mkdirSync(GALLERY_DIR, { recursive: true });
}

/* ===========================================================
   📁 Multer 설정
=========================================================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, GALLERY_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const safeExt = ext || ".jpg";
    cb(
      null,
      `${Date.now()}_${Math.round(Math.random() * 1e9)}${safeExt}`
    );
  }
});

const uploadGallery = multer({ storage });

/* ===========================================================
   🔧 헬퍼 함수
=========================================================== */

// 디스크 파일명 -> 공개 URL(/uploads/gallery/...)
const toPublicPath = (filename) => `/uploads/gallery/${filename}`;

// DB에 저장된 공개 URL(/uploads/...) -> 실제 디스크 경로
const toDiskPathFromPublic = (publicPath) => {
  if (!publicPath) return null;
  // "/uploads/gallery/xxx" → "gallery/xxx"
  const rel = publicPath.replace(/^\/+uploads\/?/, "");
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

      if (!title) {
        return res.status(400).json({ message: "제목은 필수입니다." });
      }
      if (!files.length) {
        return res.status(400).json({ message: "이미지는 최소 1개 필요합니다." });
      }

      const postLang = lang || "kr";
      const coverImage = toPublicPath(files[0].filename);

      const [result] = await db.execute(
        `INSERT INTO posts (title, content, category, lang, author_id, main_image)
         VALUES (?, ?, 'gallery', ?, ?, ?)`,
        [title, description || "", postLang, req.user.id, coverImage]
      );

      const postId = result.insertId;

      // 이미지 목록 저장
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
      if (!postId) {
        return res.status(400).json({ message: "잘못된 ID입니다." });
      }

      const { title, description, lang } = req.body;
      const files = req.files || [];
      const hasNewImages = files.length > 0;
      const postLang = lang || "kr";

      const coverImage = hasNewImages ? toPublicPath(files[0].filename) : null;

      // 기본 정보 수정
      await db.execute(
        `UPDATE posts
           SET title = ?,
               content = ?,
               lang = ?,
               main_image = IFNULL(?, main_image)
         WHERE id = ? AND category = 'gallery'`,
        [title, description || "", postLang, coverImage, postId]
      );

      if (hasNewImages) {
        // 기존 이미지 경로 조회
        const [oldImages] = await db.execute(
          `SELECT image_path FROM post_images WHERE post_id = ?`,
          [postId]
        );

        // 디스크에서 기존 파일 삭제
        for (const img of oldImages) {
          const diskPath = toDiskPathFromPublic(img.image_path);
          if (!diskPath) continue;
          try {
            fs.unlinkSync(diskPath);
          } catch (e) {
            if (e.code !== "ENOENT") {
              console.warn("갤러리 이미지 삭제 실패:", e.message);
            }
          }
        }

        // DB에서 기존 이미지 레코드 삭제
        await db.execute(`DELETE FROM post_images WHERE post_id = ?`, [postId]);

        // 새 이미지 레코드 추가
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
    if (!postId) {
      return res.status(400).json({ message: "잘못된 ID입니다." });
    }

    // 이미지 경로 조회
    const [images] = await db.execute(
      `SELECT image_path FROM post_images WHERE post_id = ?`,
      [postId]
    );

    // 디스크 파일 삭제
    for (const img of images) {
      const diskPath = toDiskPathFromPublic(img.image_path);
      if (!diskPath) continue;
      try {
        fs.unlinkSync(diskPath);
      } catch (e) {
        if (e.code !== "ENOENT") {
          console.warn("갤러리 이미지 삭제 실패:", e.message);
        }
      }
    }

    // 이미지 레코드 삭제
    await db.execute(`DELETE FROM post_images WHERE post_id = ?`, [postId]);

    // 게시글 삭제(카테고리 한 번 더 체크)
    await db.execute(
      `DELETE FROM posts WHERE id = ? AND category = 'gallery'`,
      [postId]
    );

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
             (SELECT COUNT(*) FROM post_images i WHERE i.post_id = p.id) AS image_count,
             (SELECT COUNT(*) FROM post_view_logs v WHERE v.post_id = p.id) AS views
        FROM posts p
        LEFT JOIN users u ON u.id = p.author_id
       WHERE p.category = 'gallery'
    `;

    const params = [];

    if (lang !== "all") {
      sql += ` AND p.lang = ?`;
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
