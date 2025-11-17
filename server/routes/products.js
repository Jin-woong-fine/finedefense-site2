import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import db from "../config/db.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 업로드 폴더
const uploadDir = path.join(__dirname, "../public/uploads/products");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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
   📌 제품 등록
   POST /api/products
============================================================ */
router.post(
  "/",   // ★★★ 핵심 변경: "/products" → "/"
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 20 },
  ]),
  async (req, res) => {
    try {
      const { title, category, description_html } = req.body;
      if (!title || !category) {
        return res.status(400).json({ message: "title, category 필수" });
      }

      let thumbnailPath = null;
      if (req.files?.thumbnail?.[0]) {
        thumbnailPath = `/uploads/products/${req.files.thumbnail[0].filename}`;
      }

      const [result] = await db.execute(
        "INSERT INTO products (title, category, thumbnail, description_html) VALUES (?, ?, ?, ?)",
        [title, category, thumbnailPath, description_html || ""]
      );

      const productId = result.insertId;

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
   📌 제품 목록
   GET /api/products
============================================================ */
router.get("/", async (req, res) => {   // ★ 변경
  try {
    const [rows] = await db.execute(
      "SELECT id, title, category, thumbnail, created_at FROM products ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /products error:", err);
    res.status(500).json({ message: "server error" });
  }
});

/* ============================================================
   📌 제품 상세
   GET /api/products/:id
============================================================ */
router.get("/:id", async (req, res) => {   // ★ 변경
  try {
    const { id } = req.params;

    const [[product]] = await db.execute(
      "SELECT id, title, category, thumbnail, description_html, created_at FROM products WHERE id = ?",
      [id]
    );

    if (!product) return res.status(404).json({ message: "not found" });

    const [images] = await db.execute(
      "SELECT id, url, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC",
      [id]
    );

    res.json({ product, images });
  } catch (err) {
    console.error("GET /products/:id error:", err);
    res.status(500).json({ message: "server error" });
  }
});

/* ============================================================
   📌 제품 수정
   PUT /api/products/:id
============================================================ */
router.put(
  "/:id",  // ★ 변경
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 20 },
  ]),
  async (req, res) => {
    const { id } = req.params;

    try {
      const { title, category, description_html } = req.body;

      const [[old]] = await db.execute(
        "SELECT thumbnail FROM products WHERE id = ?",
        [id]
      );

      let thumbnailPath = old.thumbnail;

      if (req.files?.thumbnail?.[0]) {
        thumbnailPath = `/uploads/products/${req.files.thumbnail[0].filename}`;

        // 기존 파일 삭제
        const oldFile = path.join(__dirname, "../public", old.thumbnail);
        if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
      }

      await db.execute(
        "UPDATE products SET title = ?, category = ?, thumbnail = ?, description_html = ? WHERE id = ?",
        [title, category, thumbnailPath, description_html, id]
      );

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
   📌 제품 삭제
   DELETE /api/products/:id
============================================================ */
router.delete("/:id", async (req, res) => {   // ★ 변경
  const { id } = req.params;
  try {
    const [[product]] = await db.execute(
      "SELECT thumbnail FROM products WHERE id = ?",
      [id]
    );

    if (product?.thumbnail) {
      const f = path.join(__dirname, "../public", product.thumbnail);
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }

    const [imgs] = await db.execute(
      "SELECT url FROM product_images WHERE product_id = ?",
      [id]
    );
    imgs.forEach((img) => {
      const f = path.join(__dirname, "../public", img.url);
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });

    await db.execute("DELETE FROM products WHERE id = ?", [id]);
    res.json({ message: "deleted" });
  } catch (err) {
    console.error("DELETE /products/:id error:", err);
    res.status(500).json({ message: "server error" });
  }
});

/* ============================================================
   📌 개별 이미지 삭제
   DELETE /api/product-images/:imageId
============================================================ */
router.delete("/image/:imageId", async (req, res) => {  // ★ 변경
  const { imageId } = req.params;

  try {
    const [[img]] = await db.execute(
      "SELECT url FROM product_images WHERE id = ?",
      [imageId]
    );
    if (!img) return res.status(404).json({ message: "not found" });

    const f = path.join(__dirname, "../public", img.url);
    if (fs.existsSync(f)) fs.unlinkSync(f);

    await db.execute("DELETE FROM product_images WHERE id = ?", [imageId]);

    res.json({ message: "image deleted" });
  } catch (err) {
    console.error("DELETE /product-images/:imageId error:", err);
    res.status(500).json({ message: "server error" });
  }
});

export default router;
