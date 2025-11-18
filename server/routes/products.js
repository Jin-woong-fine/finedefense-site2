// server/routes/products.js
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import db from "../config/db.js";


const router = express.Router();

// ------------------------------------------------------
// ⛳ 업로드 경로 설정
//    실제 파일: server/public/uploads/products/파일명
//    브라우저:  /uploads/products/파일명
// ------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/uploads/products"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);         // .jpg, .png 등
    const base = path.basename(file.originalname, ext);  // 원본 파일명
    const safe = base.replace(/[^a-zA-Z0-9가-힣_-]/g, "").substring(0, 40);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${safe || "img"}-${unique}${ext}`);
  },
});

const upload = multer({ storage });

// ------------------------------------------------------
// 📌 제품 등록 (POST /api/products)
//    - 필드: title, category, description_html
//    - 파일: images[] (여러 개)
//    - 첫 번째 이미지를 자동으로 thumbnail로 사용
// ------------------------------------------------------

router.post(
  "/",
  upload.array("images", 20),
  async (req, res) => {
    try {
      const { title, category, description_html } = req.body;

      if (!title || !category) {
        return res.status(400).json({ message: "title, category 필수" });
      }

      // 1) 메인 제품 레코드 생성
      let thumbnailPath = null;

      if (req.files && req.files.length > 0) {
        // 첫 번째 이미지를 썸네일로 사용
        thumbnailPath = "/uploads/products/" + req.files[0].filename;
      }

      const [result] = await db.execute(
        `
        INSERT INTO products (title, category, thumbnail, description_html)
        VALUES (?, ?, ?, ?)
      `,
        [title, category, thumbnailPath, description_html || ""]
      );

      const productId = result.insertId;

      // 2) 상세 이미지 여러 개 저장
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
      console.error("POST /api/products error:", err);
      return res.status(500).json({ message: "server error" });
    }
  }
);

// ------------------------------------------------------
// 📥 제품 목록 조회 (GET /api/products)
// ------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `
      SELECT id, title, category, thumbnail, created_at
      FROM products
      ORDER BY created_at DESC
    `
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /api/products error:", err);
    res.status(500).json({ message: "server error" });
  }
});

// ------------------------------------------------------
// 📥 단일 제품 조회 + 이미지들 (GET /api/products/:id)
//   (edit_product 페이지 등에서 쓰면 됨)
// ------------------------------------------------------
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [[product]] = await db.execute(
      `SELECT * FROM products WHERE id = ?`,
      [id]
    );
    if (!product) return res.status(404).json({ message: "not found" });

    const [images] = await db.execute(
      `SELECT id, url, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order ASC`,
      [id]
    );

    res.json({ product, images });
  } catch (err) {
    console.error("GET /api/products/:id error:", err);
    res.status(500).json({ message: "server error" });
  }
});

// ------------------------------------------------------
// 🗑 제품 삭제 (DELETE /api/products/:id)
//   FK ON DELETE CASCADE 덕분에 이미지도 같이 삭제
// ------------------------------------------------------
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.execute(`DELETE FROM products WHERE id = ?`, [
      id,
    ]);
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
