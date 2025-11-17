import express from "express";
import multer from "multer";
import db from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 절대경로
const uploadDir = path.join(__dirname, "../uploads/products");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 업로드 폴더 생성:", uploadDir);
}



/* ============================================================
   📌 1) Multer 저장 설정 (강화판)
============================================================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("📥 [multer] destination 호출됨 →", uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // .png .jpg 유지
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e6);
    const newName = unique + ext;

    console.log("🖼 [multer] 업로드 파일명:", newName);

    cb(null, newName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

/* ============================================================
   📌 2) 제품 목록
============================================================ */
router.get("/list/:category", async (req, res) => {
  console.log("📄 [제품 목록 요청]", req.params.category, req.query.lang);

  const { category } = req.params;
  const { lang } = req.query;

  try {
    const [rows] = await db.execute(
      `SELECT * FROM products 
       WHERE category = ? AND lang = ?
       ORDER BY order_index ASC, id DESC`,
      [category, lang]
    );

    rows.forEach(p => {
      if (p.image) {
        p.image = `/uploads/products/${p.image}`;
      }
    });

    res.json(rows);
  } catch (err) {
    console.error("❌ 제품 불러오기 오류:", err);
    res.status(500).json({ message: "제품 불러오기 실패" });
  }
});

/* ============================================================
   📌 3) 제품 단일 조회
============================================================ */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM products WHERE id = ?`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "없는 제품" });
    }

    const p = rows[0];
    if (p.image) {
      p.image = `/uploads/products/${p.image}`;
    }

    res.json(p);
  } catch (err) {
    console.error("❌ 단일 제품 조회 오류:", err);
    res.status(500).json({ message: "단일 제품 조회 실패" });
  }
});

/* ============================================================
   📌 4) 제품 등록 (multer 디버그)
============================================================ */
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  console.log("====================================");
  console.log("🔥 [제품 등록 요청 들어옴]");
  console.log("📦 req.body:", req.body);
  console.log("🖼 req.file:", req.file);
  console.log("====================================");

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

    console.log("✅ [제품 등록 완료]");

    res.json({ message: "등록 완료" });
  } catch (err) {
    console.error("❌ 제품 등록 오류:", err);
    res.status(500).json({ message: "등록 실패" });
  }
});

/* ============================================================
   📌 5) 제품 수정
============================================================ */
router.put("/:id", verifyToken, upload.single("image"), async (req, res) => {
  console.log("====================================");
  console.log("♻️ [제품 수정 요청]", req.params.id);
  console.log("📦 req.body:", req.body);
  console.log("🖼 req.file:", req.file);
  console.log("====================================");

  try {
    const { category, lang, title, description, link, order_index } = req.body;
    const id = req.params.id;

    if (req.file) {
      const image = req.file.filename;

      await db.execute(
        `UPDATE products 
         SET category=?, lang=?, title=?, description=?, link=?, order_index=?, image=? 
         WHERE id=?`,
        [category, lang, title, description, link, order_index, image, id]
      );
    } else {
      await db.execute(
        `UPDATE products 
         SET category=?, lang=?, title=?, description=?, link=?, order_index=? 
         WHERE id=?`,
        [category, lang, title, description, link, order_index, id]
      );
    }

    console.log("✅ [제품 수정 완료]");
    res.json({ message: "수정 완료" });
  } catch (err) {
    console.error("❌ 제품 수정 오류:", err);
    res.status(500).json({ message: "수정 실패" });
  }
});

/* ============================================================
   📌 6) 제품 삭제
============================================================ */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await db.execute(`DELETE FROM products WHERE id=?`, [req.params.id]);
    console.log("🗑 제품 삭제:", req.params.id);
    res.json({ message: "삭제 완료" });
  } catch (err) {
    console.error("❌ 제품 삭제 오류:", err);
    res.status(500).json({ message: "삭제 실패" });
  }
});

/* ============================================================
   📌 7) 제품 상세페이지 조회수 증가 (신규)
============================================================ */
router.post("/view/:id", async (req, res) => {
  const productId = req.params.id;

  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;
  const ua = req.headers["user-agent"] || "unknown";

  try {
    // 하루 중복 방지
    const [exists] = await db.execute(
      `
      SELECT id FROM product_view_logs
      WHERE product_id = ?
        AND ip = ?
        AND user_agent = ?
        AND viewed_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
      `,
      [productId, ip, ua]
    );

    if (exists.length > 0) {
      return res.json({ added: false });
    }

    // 조회수 저장
    await db.execute(
      `
      INSERT INTO product_view_logs (product_id, ip, user_agent)
      VALUES (?, ?, ?)
      `,
      [productId, ip, ua]
    );

    res.json({ added: true });
  } catch (err) {
    console.error("❌ 제품 조회수 증가 오류:", err);
    res.status(500).json({ message: "조회수 처리 실패" });
  }
});

export default router;
