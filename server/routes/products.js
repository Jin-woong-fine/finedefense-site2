import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import db from "../config/db.js";
import { verifyToken, verifyEditor, verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "../public/uploads/products");

/* ============================================
   🚀 Multer 설정
============================================ */
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9가-힣_-]/g, "")
      .substring(0, 40);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${base || "img"}-${unique}${ext}`);
  }
});
const upload = multer({ storage });


/* ==========================================================
   📌 제품 등록 (EDITOR 이상)
========================================================== */
router.post("/", verifyToken, verifyEditor, (req, res) => {
  upload.array("images")(req, res, async (err) => {
    if (err)
      return res.status(400).json({ message: "Upload error", detail: err.message });

    try {
      const { title, summary, category, description_html, sort_order, lang } = req.body;

      if (!title || !category || !lang)
        return res.status(400).json({ message: "Missing required fields" });

      let thumbnail = null;
      if (req.files?.length > 0)
        thumbnail = "/uploads/products/" + req.files[0].filename;

      const [insert] = await db.execute(
        `INSERT INTO products (title, summary, category, thumbnail, description_html, sort_order, lang)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          summary || "",
          category,
          thumbnail,
          description_html || "",
          sort_order || 999,
          lang
        ]
      );

      const productId = insert.insertId;

      if (req.files?.length > 0) {
        const values = req.files.map((f, idx) => [
          productId,
          "/uploads/products/" + f.filename,
          idx
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


/* ==========================================================
   📥 목록 조회 (언어별)
========================================================== */
router.get("/", async (req, res) => {
  try {
    const lang = req.query.lang || "kr";

    const [rows] = await db.execute(
      `SELECT id, title, summary, category, thumbnail, lang, sort_order, created_at
       FROM products
       WHERE lang = ?
       ORDER BY sort_order ASC, created_at DESC`,
      [lang]
    );

    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: "server error" });
  }
});


/* ==========================================================
   📥 단일 조회
========================================================== */
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
       ORDER BY sort_order ASC`,
      [id]
    );

    res.json({ product, images });

  } catch (e) {
    res.status(500).json({ message: "server error" });
  }
});


/* ==========================================================
   ✏ 제품 수정 (EDITOR 이상)
========================================================== */
router.put("/:id", verifyToken, verifyEditor, (req, res) => {
  upload.array("images")(req, res, async (err) => {
    if (err)
      return res.status(400).json({ message: "Upload error", detail: err.message });

    try {
      const { id } = req.params;
      const { title, category, description_html } = req.body;

      if (!title || !category)
        return res.status(400).json({ message: "Missing required fields" });

      const removedImages = JSON.parse(req.body.removedImages || "[]");

      /* ---------------------------------------------
         1) 기본 정보 수정
      --------------------------------------------- */
      await db.execute(
        `UPDATE products
         SET title = ?, category = ?, description_html = ?
         WHERE id = ?`,
        [title, category, description_html || "", id]
      );

      /* ---------------------------------------------
         2) 삭제된 이미지 제거
      --------------------------------------------- */
      if (removedImages.length > 0) {
        await db.query(
          `DELETE FROM product_images 
           WHERE product_id = ? AND url IN (?)`,
          [id, removedImages]
        );
      }

      /* ---------------------------------------------
         3) 새 이미지 저장
      --------------------------------------------- */
      if (req.files?.length > 0) {
        const values = req.files.map((f, idx) => [
          id,
          "/uploads/products/" + f.filename,
          idx
        ]);

        await db.query(
          `INSERT INTO product_images (product_id, url, sort_order)
           VALUES ?`,
          [values]
        );
      }

      res.json({ message: "updated" });

    } catch (e) {
      console.error("PUT error:", e);
      res.status(500).json({ message: "server error" });
    }
  });
});


/* ==========================================================
   🔄 이미지 순서 업데이트 (Drag & Drop)
========================================================== */
router.put("/:id/reorder-images", verifyToken, verifyEditor, async (req, res) => {
  try {
    const { id } = req.params;
    const { order } = req.body;  
    // order = [{ imageId: 12, sort: 0 }, { imageId: 15, sort: 1 }, ...]

    if (!Array.isArray(order)) {
      return res.status(400).json({ message: "Invalid order format" });
    }

    // 여러개 업데이트 → Promise.all로 병렬 처리
    await Promise.all(
      order.map((item) =>
        db.query(
          `UPDATE product_images 
           SET sort_order = ? 
           WHERE id = ? AND product_id = ?`,
          [item.sort, item.imageId, id]
        )
      )
    );

    res.json({ message: "reordered" });

  } catch (err) {
    console.error("Reorder error:", err);
    res.status(500).json({ message: "server error" });
  }
});

/* ==========================================================
   ❌ 제품 삭제 (EDITOR 이상)
========================================================== */
router.delete("/:id", verifyToken, verifyEditor, async (req, res) => {
  try {
    const { id } = req.params;

    // 1) 제품 존재 확인
    const [[product]] = await db.execute(
      `SELECT * FROM products WHERE id = ?`,
      [id]
    );

    if (!product) {
      return res.status(404).json({ message: "not found" });
    }

    // 2) 이미지 목록 조회
    const [images] = await db.execute(
      `SELECT url FROM product_images WHERE product_id = ?`,
      [id]
    );

    // 3) DB 삭제
    await db.execute(`DELETE FROM product_images WHERE product_id = ?`, [id]);
    await db.execute(`DELETE FROM products WHERE id = ?`, [id]);

    // 4) 실제 파일 삭제 (옵션)
    import fs from "fs";
    images.forEach(img => {
      const filePath = path.join(__dirname, "../public", img.url || "");
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    res.json({ message: "deleted" });

  } catch (err) {
    console.error("DELETE product error:", err);
    res.status(500).json({ message: "server error" });
  }
});






export default router;
