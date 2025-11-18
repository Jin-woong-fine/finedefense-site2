// server/routes/products.js
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import db from "../config/db.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "../public/uploads/products");

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

const upload = multer({ storage });

/* =========================================================
   📌 POST /api/products
========================================================= */
router.post("/", (req, res) => {
  upload.array("images")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: "upload error", detail: err.message });
    }

    try {
      const { title, category, description_html, lang } = req.body;

      if (!title || !category || !lang) {
        return res.status(400).json({ message: "필수값 누락" });
      }

      let thumbnail = null;
      if (req.files?.length > 0) {
        thumbnail = "/uploads/products/" + req.files[0].filename;
      }

      const [insert] = await db.execute(
        `INSERT INTO products (title, category, thumbnail, description_html, lang)
         VALUES (?, ?, ?, ?, ?)`,
        [title, category, thumbnail, description_html || "", lang]
      );

      const productId = insert.insertId;

      if (req.files?.length > 0) {
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

      res.status(201).json({ message: "created", id: productId });
    } catch (e) {
      console.error("POST error:", e);
      res.status(500).json({ message: "server error" });
    }
  });
});

/* =========================================================
   📥 GET /api/products (언어별 목록)
========================================================= */
router.get("/", async (req, res) => {
  try {
    const lang = req.query.lang || "kr";

    const [rows] = await db.execute(
      `SELECT id, title, category, thumbnail, lang, created_at
       FROM products WHERE lang = ?
       ORDER BY created_at DESC`,
      [lang]
    );

    res.json(rows);
  } catch (e) {
    console.error("GET error:", e);
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
      `SELECT id, url, sort_order
       FROM product_images
       WHERE product_id = ?
       ORDER BY sort_order`,
      [id]
    );

    res.json({ product, images });
  } catch (e) {
    console.error("GET detail error:", e);
    res.status(500).json({ message: "server error" });
  }
});

/* =========================================================
   🗑 삭제
========================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.execute(
      `DELETE FROM products WHERE id = ?`,
      [req.params.id]
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
