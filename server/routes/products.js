// server/routes/products.js
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import db from "../config/db.js";

const router = express.Router();

/* =========================================================
   📂 업로드 경로 설정
========================================================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "../public/uploads/products");

/* =========================================================
   🧩 Multer 설정 (10MB 파일 허용)
========================================================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9가-힣_-]/g, "")
      .substring(0, 40);

    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${base || "img"}-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 20,
  },
});

/* =========================================================
   📌 제품 등록 (POST)
   🔥 multer 에러 핸들링 포함
========================================================= */

router.post("/", (req, res) => {
  upload.array("images", 20)(req, res, async (err) => {
    // -------------------------------
    // 🔥 Multer 에러 처리 (중요)
    // -------------------------------
    if (err) {
      console.error("🔥 [Multer Error] 파일 업로드 실패:", err);

      return res.status(400).json({
        message: "upload error",
        detail: err.message,
        code: err.code,
      });
    }

    try {
      const { title, category, description_html } = req.body;

      if (!title || !category) {
        return res.status(400).json({ message: "title, category 필수" });
      }

      // 📌 thumbnail = 첫 이미지
      let thumbnailPath = null;
      if (req.files && req.files.length > 0) {
        thumbnailPath = "/uploads/products/" + req.files[0].filename;
      }

      // 1) 제품 레코드 생성
      const [result] = await db.execute(
        `
        INSERT INTO products (title, category, thumbnail, description_html)
        VALUES (?, ?, ?, ?)
        `,
        [title, category, thumbnailPath, description_html || ""]
      );

      const productId = result.insertId;

      // 2) 상세 이미지 저장
      if (req.files && req.files.length > 0) {
        const values = req.files.map((file, idx) => [
          productId,
          "/uploads/products/" + file.filename,
          idx,
        ]);

        await db.query(
          `
          INSERT INTO product_images (product_id, url, sort_order)
          VALUES ?
          `,
          [values]
        );
      }

      return res.status(201).json({ message: "created", id: productId });
    } catch (err) {
      console.error("🔥 POST /api/products error:", err);
      return res.status(500).json({ message: "server error" });
    }
  });
});

/* =========================================================
   📥 목록 조회
========================================================= */

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT id, title, category, thumbnail, created_at
      FROM products
      ORDER BY created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("GET /api/products error:", err);
    res.status(500).json({ message: "server error" });
  }
});

/* =========================================================
   📥 단일 조회
========================================================= */

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [[product]] = await db.execute(
      `SELECT * FROM products WHERE id = ?`,
      [id]
    );

    if (!product) return res.status(404).json({ message: "not found" });

    const [images] = await db.execute(
      `
      SELECT id, url, sort_order
      FROM product_images
      WHERE product_id = ?
      ORDER BY sort_order ASC
      `,
      [id]
    );

    res.json({ product, images });
  } catch (err) {
    console.error("GET /api/products/:id error:", err);
    res.status(500).json({ message: "server error" });
  }
});

/* =========================================================
   🗑 삭제
========================================================= */

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      `DELETE FROM products WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "not found" });
    }

    res.json({ message: "deleted" });
  } catch (err) {
    console.error("DELETE /api/products/:id error:", err);
    res.status(500).json({ message: "server error" });
  }
});

export default router;
