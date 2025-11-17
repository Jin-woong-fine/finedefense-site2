import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import db from "../config/db.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ============================================================
   📂 업로드 폴더 설정 (nginx alias와 100% 일치)
   /uploads → /home/ubuntu/finedefense_homepage/server/uploads
============================================================ */
const uploadRoot = path.join(__dirname, "../uploads");
const uploadDir = path.join(uploadRoot, "products");

if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

/* 실제 파일 시스템 경로 변환 */
function resolveUploadPath(url) {
  if (!url) return null;
  return path.join(uploadRoot, url.replace("/uploads/", ""));
}

/* ============================================================
   📸 multer 설정
============================================================ */
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${base}-${unique}${ext}`);
  },
});

const upload = multer({ storage });

/* ============================================================
   📌 제품 등록 (POST /api/products)
============================================================ */
router.post(
  "/",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 20 },
  ]),
  async (req, res) => {
    try {
      const { title, category, description_html } = req.body;
      if (!title || !category)
        return res.status(400).json({ message: "title, category 필수" });

      let thumbnailPath = null;

      // 1) 썸네일 파일이 따로 온 경우
      if (req.files?.thumbnail?.[0]) {
        thumbnailPath = `/uploads/products/${req.files.thumbnail[0].filename}`;
      }
      // 2) 없으면 첫 번째 images 사용
      else if (req.files?.images?.[0]) {
        thumbnailPath = `/uploads/products/${req.files.images[0].filename}`;
      }

      const [result] = await db.execute(
        `INSERT INTO products (title, category, thumbnail, description_html)
         VALUES (?, ?, ?, ?)`,
        [title, category, thumbnailPath, description_html || ""]
      );

      const productId = result.insertId;

      // 상세 이미지 저장
      if (req.files?.images?.length) {
        const values = req.files.images.map((f, idx) => [
          productId,
          `/uploads/products/${f.filename}`,
          idx,
        ]);

        await db.query(
          "INSERT INTO product_images (product_id, url, sort_order) VALUES ?",
          [values]
        );
      }

      res.status(201).json({ message: "created", id: productId });
    } catch (err) {
      console.error("POST /products error:", err);
      res.status(500).json({ message: "server error" });
    }
  }
);

/* ============================================================
   📌 제품 목록 (GET /api/products)
============================================================ */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, title, category, thumbnail, created_at 
       FROM products ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /products error:", err);
    res.status(500).json({ message: "server error" });
  }
});

/* ============================================================
   📌 제품 상세 (GET /api/products/:id)
============================================================ */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [[product]] = await db.execute(
      `SELECT id, title, category, thumbnail, description_html, created_at
       FROM products WHERE id = ?`,
      [id]
    );
    if (!product) return res.status(404).json({ message: "not found" });

    const [images] = await db.execute(
      `SELECT id, url, sort_order 
       FROM product_images 
       WHERE product_id = ? 
       ORDER BY sort_order ASC, id ASC`,
      [id]
    );

    res.json({ product, images });
  } catch (err) {
    console.error("GET /products/:id error:", err);
    res.status(500).json({ message: "server error" });
  }
});

/* ============================================================
   📌 제품 수정 (PUT /api/products/:id)
============================================================ */
router.put(
  "/:id",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 20 },
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, category, description_html } = req.body;

      const [[old]] = await db.execute(
        "SELECT thumbnail FROM products WHERE id = ?",
        [id]
      );
      if (!old) return res.status(404).json({ message: "not found" });

      let thumbnailPath = old.thumbnail;

      // 썸네일이 새로 들어오면 교체
      if (req.files?.thumbnail?.[0]) {
        thumbnailPath = `/uploads/products/${req.files.thumbnail[0].filename}`;

        // 기존 썸네일 삭제
        const oldFile = resolveUploadPath(old.thumbnail);
        if (oldFile && fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
      }

      await db.execute(
        `UPDATE products
         SET title = ?, category = ?, thumbnail = ?, description_html = ?
         WHERE id = ?`,
        [title, category, thumbnailPath, description_html || "", id]
      );

      // 상세 이미지 추가
      if (req.files?.images?.length) {
        const values = req.files.images.map((f, idx) => [
          id,
          `/uploads/products/${f.filename}`,
          idx,
        ]);

        await db.query(
          "INSERT INTO product_images (product_id, url, sort_order) VALUES ?",
          [values]
        );
      }

      res.json({ message: "updated" });
    } catch (err) {
      console.error("PUT /products/:id error:", err);
      res.status(500).json({ message: "server error" });
    }
  }
);

/* ============================================================
   📌 제품 삭제 (DELETE /api/products/:id)
============================================================ */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [[product]] = await db.execute(
      "SELECT thumbnail FROM products WHERE id = ?",
      [id]
    );

    // 썸네일 삭제
    if (product?.thumbnail) {
      const f = resolveUploadPath(product.thumbnail);
      if (f && fs.existsSync(f)) fs.unlinkSync(f);
    }

    // 상세 이미지 삭제
    const [imgs] = await db.execute(
      "SELECT url FROM product_images WHERE product_id = ?",
      [id]
    );

    imgs.forEach((img) => {
      const f = resolveUploadPath(img.url);
      if (f && fs.existsSync(f)) fs.unlinkSync(f);
    });

    await db.execute("DELETE FROM products WHERE id = ?", [id]);

    res.json({ message: "deleted" });
  } catch (err) {
    console.error("DELETE /products/:id error:", err);
    res.status(500).json({ message: "server error" });
  }
});

/* ============================================================
   📌 개별 이미지 삭제 (DELETE /api/products/image/:imageId)
============================================================ */
router.delete("/image/:imageId", async (req, res) => {
  try {
    const { imageId } = req.params;

    const [[img]] = await db.execute(
      "SELECT url FROM product_images WHERE id = ?",
      [imageId]
    );
    if (!img) return res.status(404).json({ message: "not found" });

    const filePath = resolveUploadPath(img.url);
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await db.execute("DELETE FROM product_images WHERE id = ?", [imageId]);

    res.json({ message: "image deleted" });
  } catch (err) {
    console.error("DELETE /products/image/:imageId error:", err);
    res.status(500).json({ message: "server error" });
  }
});

export default router;
