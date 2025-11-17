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
   📂 업로드 폴더 설정
============================================================ */
const uploadRoot = path.join(__dirname, "../public/uploads");
const uploadDir = path.join(uploadRoot, "products");

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

      if (!title || !category) {
        return res.status(400).json({ message: "title, category 필수" });
      }

      let thumbnailPath = null;

      // 썸네일 우선
      if (req.files?.thumbnail?.[0]) {
        thumbnailPath = "/uploads/products/" + req.files.thumbnail[0].filename;
      }
      // 없으면 images 첫 번째 파일 사용
      else if (req.files?.images?.[0]) {
        thumbnailPath = "/uploads/products/" + req.files.images[0].filename;
      }

      const [result] = await db.execute(
        "INSERT INTO products (title, category, thumbnail, description_html) VALUES (?, ?, ?, ?)",
        [title, category, thumbnailPath, description_html || ""]
      );

      const productId = result.insertId;

      // 상세 이미지 저장
      if (req.files?.images?.length) {
        const values = req.files.images.map((file, idx) => [
          productId,
          "/uploads/products/" + file.filename,
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
      "SELECT id, title, category, thumbnail, created_at FROM products ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /products error:", err);
    res.status(500).json({ message: "server error" });
  }
});

/* ============================================================
   📌 특정 카테고리 목록 (GET /api/products/list/:category)
   → 웹사이트 서브페이지에서 사용
============================================================ */
router.get("/list/:category", async (req, res) => {
  try {
    const { category } = req.params;

    const [rows] = await db.execute(
      "SELECT id, title, category, thumbnail FROM products WHERE category = ? ORDER BY id DESC",
      [category]
    );

    const formatted = rows.map((p) => ({
      id: p.id,
      title: p.title,
      image: p.thumbnail,
      category: p.category,
      link: `/kr/products/view.html?id=${p.id}`,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("GET /products/list/:category error:", err);
    res.status(500).json({ message: "server error" });
  }
});

/* ============================================================
   📌 제품 상세 조회 (GET /api/products/:id)
============================================================ */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [[product]] = await db.execute(
      "SELECT id, title, category, thumbnail, description_html FROM products WHERE id = ?",
      [id]
    );

    if (!product) {
      return res.status(404).json({ message: "not found" });
    }

    const [images] = await db.execute(
      "SELECT id, url FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC",
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
      const { title, category, description_html, removedImages } = req.body;

      const [[old]] = await db.execute(
        "SELECT thumbnail FROM products WHERE id = ?",
        [id]
      );
      if (!old) return res.status(404).json({ message: "not found" });

      let thumbnailPath = old.thumbnail;

      // 새 썸네일 업로드
      if (req.files?.thumbnail?.[0]) {
        thumbnailPath = "/uploads/products/" + req.files.thumbnail[0].filename;

        // 기존 파일 삭제
        if (old.thumbnail) {
          const oldFile = path.join(__dirname, "../public", old.thumbnail);
          if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
        }
      }

      // 기본 정보 업데이트
      await db.execute(
        "UPDATE products SET title = ?, category = ?, thumbnail = ?, description_html = ? WHERE id = ?",
        [title, category, thumbnailPath, description_html || "", id]
      );

      // 기존 이미지 삭제 처리
      if (removedImages) {
        const toDelete = JSON.parse(removedImages);
        for (const url of toDelete) {
          await db.execute(
            "DELETE FROM product_images WHERE product_id = ? AND url = ?",
            [id, url]
          );

          const filePath = path.join(__dirname, "../public", url);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      }

      // 새 이미지 추가
      if (req.files?.images?.length) {
        const values = req.files.images.map((file, idx) => [
          id,
          "/uploads/products/" + file.filename,
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
============================================================ */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 썸네일 삭제
    const [[product]] = await db.execute(
      "SELECT thumbnail FROM products WHERE id = ?",
      [id]
    );

    if (product?.thumbnail) {
      const f = path.join(__dirname, "../public", product.thumbnail);
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }

    // 이미지 삭제
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

export default router;
