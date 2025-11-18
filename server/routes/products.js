// server/routes/products.js
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import db from "../config/db.js";

const router = express.Router();

/* =========================================================
   📂 업로드 경로
========================================================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "../public/uploads/products");

/* =========================================================
   🧩 Multer (용량 제한 없음)
========================================================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9가-힣_-]/g, "")
      .substring(0, 40);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${base || "img"}-${unique}${ext}`);
  },
});

// ⭐ limits 제거 → 파일 무제한 처리 가능
const upload = multer({ storage });

/* =========================================================
   📌 POST /api/products
   (multer 에러 핸들링 포함)
========================================================= */
router.post("/", (req, res) => {
  upload.array("images")(req, res, async (err) => {
    if (err) {
      console.error("🔥 Multer Error:", err);
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

      // 썸네일 = 첫 번째 파일
      let thumbnail = null;
      if (req.files && req.files.length > 0) {
        thumbnail = "/uploads/products/" + req.files[0].filename;
      }

      // 1) 제품 저장
      const [insert] = await db.execute(
        `INSERT INTO products (title, category, thumbnail, description_html)
         VALUES (?, ?, ?, ?)`,
        [title, category, thumbnail, description_html || ""]
      );

      const productId = insert.insertId;

      // 2) 이미지 저장
      if (req.files && req.files.length > 0) {
        const values = req.files.map((f, idx) => [
          productId,
          "/uploads/products/" + f.filename,
          idx,
        ]);

        await db.query(
          `INSERT INTO product_images (product_id, url, sort_order) VALUES ?`,
          [values]
        );
      }

      return res.status(201).json({ message: "created", id: productId });

    } catch (e) {
      console.error("🔥 POST /api/products SERVER ERROR:", e);
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
      FROM products ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (e) {
    console.error("GET list error:", e);
    res.status(500).json({ message: "server error" });
  }
});

/* =========================================================
   📥 조회
========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [[product]] = await db.execute(
      `SELECT * FROM products WHERE id = ?`, [id]
    );
    if (!product) return res.status(404).json({ message: "not found" });

    const [images] = await db.execute(
      `SELECT id, url, sort_order FROM product_images 
       WHERE product_id = ? ORDER BY sort_order`,
      [id]
    );

    res.json({ product, images });
  } catch (e) {
    console.error("GET /:id error:", e);
    res.status(500).json({ message: "server error" });
  }
});

/* =========================================================
   🗑 삭제
========================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.execute(
      `DELETE FROM products WHERE id = ?`, [req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "not found" });

    res.json({ message: "deleted" });
  } catch (e) {
    console.error("DELETE error:", e);
    res.status(500).json({ message: "server error" });
  }
});

export default router;
