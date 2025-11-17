import express from "express";
import multer from "multer";
import db from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// 🔥 업로드 위치 — server/uploads/products
const upload = multer({
  dest: "server/uploads/products/"
});

// 제품 목록
router.get("/list/:category", async (req, res) => {
  const { category } = req.params;
  const { lang } = req.query;

  try {
    const [rows] = await db.execute(
      `SELECT * FROM products 
       WHERE category = ? AND lang = ?
       ORDER BY order_index ASC, id DESC`,
      [category, lang]
    );

    // 이미지 경로 public URL 변환
    rows.forEach(p => {
      if (p.image) {
        p.image = `/uploads/products/${p.image}`;
      }
    });

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "제품 불러오기 실패" });
  }
});

// 제품 단일 조회
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT * FROM products WHERE id = ?`, [
      req.params.id
    ]);

    if (!rows.length) return res.status(404).json({ message: "없는 제품" });

    const p = rows[0];
    if (p.image) {
      p.image = `/uploads/products/${p.image}`;
    }

    res.json(p);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "단일 제품 조회 실패" });
  }
});

// 제품 등록
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { category, lang, title, description, link, order_index } = req.body;
    const image = req.file ? req.file.filename : null;

    await db.execute(
      `
      INSERT INTO products 
      (category, lang, title, description, link, order_index, image)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [category, lang, title, description, link, order_index, image]
    );

    res.json({ message: "등록 완료" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "등록 실패" });
  }
});

// 제품 수정
router.put("/:id", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { category, lang, title, description, link, order_index } = req.body;
    const id = req.params.id;

    if (req.file) {
      const image = req.file.filename;
      await db.execute(
        `UPDATE products SET category=?,lang=?,title=?,description=?,link=?,order_index=?,image=? WHERE id=?`,
        [category, lang, title, description, link, order_index, image, id]
      );
    } else {
      await db.execute(
        `UPDATE products SET category=?,lang=?,title=?,description=?,link=?,order_index=? WHERE id=?`,
        [category, lang, title, description, link, order_index, id]
      );
    }

    res.json({ message: "수정 완료" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "수정 실패" });
  }
});

// 삭제
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await db.execute(`DELETE FROM products WHERE id=?`, [req.params.id]);
    res.json({ message: "삭제 완료" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "삭제 실패" });
  }
});

export default router;
