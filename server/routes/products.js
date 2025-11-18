import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../config/db.js"; // 너가 쓰는 db 커넥션 모듈

const router = express.Router();

/* =========================================================================
   📂 업로드 폴더 준비 (/uploads/products)
========================================================================= */
const uploadDir = path.join(process.cwd(), "uploads", "products");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/* =========================================================================
   📸 multer 설정
========================================================================= */
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 40);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${base}-${unique}${ext}`);
  },
});

const upload = multer({ storage });

/* =========================================================================
   📌 제품 등록 (POST /api/products)
   - 필드:
     title, category, description_html
   - 파일:
     images[] 여러 장 (최대 20)
========================================================================= */
router.post(
  "/",
  upload.array("images", 20), // input name="images" 여러개
  async (req, res) => {
    const conn = db; // mysql2/promise 기반이라고 가정

    try {
      const { title, category, description_html } = req.body;

      if (!title || !category) {
        return res.status(400).json({ message: "title, category 필수" });
      }

      // 업로드된 파일들
      const files = req.files || [];
      let thumbnailPath = null;

      if (files.length > 0) {
        // 첫 번째 이미지를 썸네일로
        thumbnailPath = "/uploads/products/" + files[0].filename;
      }

      // 1) products 테이블 insert
      const [result] = await conn.execute(
        `
        INSERT INTO products (title, category, thumbnail, description_html)
        VALUES (?, ?, ?, ?)
      `,
        [title, category, thumbnailPath, description_html || ""]
      );

      const productId = result.insertId;

      // 2) product_images 테이블 insert
      if (files.length > 0) {
        const values = files.map((file, idx) => [
          productId,
          "/uploads/products/" + file.filename,
          idx,
        ]);

        await conn.query(
          `
          INSERT INTO product_images (product_id, url, sort_order)
          VALUES ?
        `,
          [values]
        );
      }

      res.status(201).json({ message: "created", id: productId });
    } catch (err) {
      console.error("POST /api/products error:", err);
      res.status(500).json({ message: "server error" });
    }
  }
);

/* =========================================================================
   📥 제품 목록 (GET /api/products)
   - 리스트용: 썸네일만
========================================================================= */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `
      SELECT id, title, category, thumbnail, created_at
      FROM products
      ORDER BY id DESC
    `
    );

    res.json(rows);
  } catch (err) {
    console.error("GET /api/products error:", err);
    res.status(500).json({ message: "server error" });
  }
});

/* =========================================================================
   📥 제품 상세 (GET /api/products/:id)
   - 본문 HTML + 이미지 목록
========================================================================= */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [[product]] = await db.execute(
      `
      SELECT id, title, category, thumbnail, description_html, created_at
      FROM products
      WHERE id = ?
    `,
      [id]
    );

    if (!product) {
      return res.status(404).json({ message: "not found" });
    }

    const [images] = await db.execute(
      `
      SELECT id, url, sort_order
      FROM product_images
      WHERE product_id = ?
      ORDER BY sort_order ASC, id ASC
    `,
      [id]
    );

    res.json({ product, images });
  } catch (err) {
    console.error("GET /api/products/:id error:", err);
    res.status(500).json({ message: "server error" });
  }
});

/* =========================================================================
   ❌ 삭제 (DELETE /api/products/:id)
========================================================================= */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // FK ON DELETE CASCADE라 product_images는 자동 삭제
    await db.execute("DELETE FROM products WHERE id = ?", [id]);
    res.json({ message: "deleted" });
  } catch (err) {
    console.error("DELETE /api/products/:id error:", err);
    res.status(500).json({ message: "server error" });
  }
});

export default router;
