import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import db from "../config/db.js";
import { verifyToken, verifyEditor, verifyAdmin } from "../middleware/auth.js";
import fs from "fs";


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

      if (summary && summary.length > 255) {
        return res.status(400).json({
          message: "Summary is too long (max 255 characters)"
        });
      }

      let thumbnail = null;
      if (req.files?.length > 0)
        thumbnail = "/uploads/products/" + req.files[0].filename;

        const [insert] = await db.execute(
          `INSERT INTO products
          (title, summary, category, thumbnail, description_html, sort_order, lang)
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

        await db.execute(
          `UPDATE products SET group_id = ? WHERE id = ?`,
          [productId, productId]
        );


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
   🔢 제품 순번(sort_order) 저장
========================================================== */
router.put("/sort-order", verifyToken, verifyEditor, async (req, res) => {
  try {
    const { orders } = req.body;

    if (!Array.isArray(orders)) {
      return res.status(400).json({ message: "Invalid orders format" });
    }

    await Promise.all(
      orders.map(({ id, sort_order }) =>
        db.query(
          `UPDATE products SET sort_order = ? WHERE id = ?`,
          [sort_order, id]
        )
      )
    );

    res.json({ message: "ok" });

  } catch (err) {
    console.error("sort-order error:", err);
    res.status(500).json({ message: "server error" });
  }
});




/* ==========================================================
   📥 목록 조회 (언어별)
========================================================== */
router.get("/", verifyToken, verifyEditor, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        p.*,

        EXISTS (
          SELECT 1 FROM products e
          WHERE e.group_id = p.group_id AND e.lang = 'en'
        ) AS has_en,

        (
          SELECT e.id FROM products e
          WHERE e.group_id = p.group_id AND e.lang = 'en'
          LIMIT 1
        ) AS en_id

      FROM products p
      WHERE p.lang = 'kr'
      ORDER BY p.sort_order ASC, p.created_at DESC
    `);

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
});


/* ==========================================================
   🌐 공개용 제품 목록 (프론트)
========================================================== */
router.get("/public", async (req, res) => {
  try {
    const lang = req.query.lang || "kr";

    const [rows] = await db.execute(
      `SELECT id, title, summary, category, thumbnail, description_html
       FROM products
       WHERE lang = ?
       ORDER BY sort_order ASC, created_at DESC`,
      [lang]
    );

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
});



/* ==========================================================
   📥 단일 조회
========================================================== */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const lang = req.query.lang || "kr";

    // 1️⃣ group_id 찾기
    const [[base]] = await db.execute(
      `SELECT group_id FROM products WHERE id = ?`,
      [id]
    );

    if (!base) {
      return res.status(404).json({ message: "not found" });
    }

    // 2️⃣ 같은 group_id + lang 제품 조회
    const [[product]] = await db.execute(
      `SELECT * FROM products WHERE group_id = ? AND lang = ?`,
      [base.group_id, lang]
    );

    if (!product) {
      return res.status(404).json({ message: "not found for this language" });
    }

    // 3️⃣ 이미지도 group 기준
    const [images] = await db.execute(
      `SELECT id, url, sort_order
       FROM product_images
       WHERE product_id = ?
       ORDER BY sort_order ASC`,
      [product.id]
    );

    res.json({ product, images });

  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
});

/* ==========================================================
   ✏ 제품 수정 (모든 필드 + 이미지 완전 지원)
========================================================== */
router.put("/:id", verifyToken, verifyEditor, (req, res) => {
  upload.array("images")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: "Upload error", detail: err.message });
    }

    try {
      const { id } = req.params;

      const {
        title,
        summary,
        category,
        lang,
        sort_order,
        description_html,
        old_images
      } = req.body;

      if (!title || !category || !lang) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (summary && summary.length > 255) {
        return res.status(400).json({
          message: "요약(summary)은 최대 255자까지 입력 가능합니다."
        });
      }

      // ✅ old_images 파싱 (유지할 이미지 목록)
      const oldList = JSON.parse(old_images || "[]");

      // ✅ DB 이미지 목록
      const [dbImages] = await db.execute(
        `SELECT url FROM product_images WHERE product_id = ? ORDER BY sort_order ASC`,
        [id]
      );

      const dbList = dbImages.map(img => img.url.replace("/uploads/products/", ""));

      // ✅ 삭제 대상 (DB - oldList)
      const removed = dbList.filter(name => !oldList.includes(name));

      /* 1) 텍스트 업데이트 */
      await db.execute(
        `UPDATE products
        SET title = ?,
            summary = ?,
            category = ?,
            sort_order = ?,
            description_html = ?
        WHERE id = ? AND lang = ?`,
        [
          title,
          summary || "",
          category,
          sort_order || 999,
          description_html || "",
          id,
          lang   // 🔥 조건으로만 사용
        ]
      );

      /* 2) 삭제된 이미지 DB 제거 + 파일 삭제 */
      if (removed.length > 0) {
        await db.query(
          `DELETE FROM product_images
           WHERE product_id = ? AND url IN (?)`,
          [id, removed.map(f => "/uploads/products/" + f)]
        );

        removed.forEach(name => {
          const filePath = path.join(uploadDir, name);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
      }

      /* 3) 신규 업로드 이미지 기록 */
      if (req.files?.length > 0) {
        const values = req.files.map((f, idx) => [
          id,
          "/uploads/products/" + f.filename,
          oldList.length + idx
        ]);

        await db.query(
          `INSERT INTO product_images (product_id, url, sort_order)
           VALUES ?`,
          [values]
        );
      }

      /* 4) 기존 이미지 순서 재정렬 (oldList 기준) */
      await Promise.all(
        oldList.map((filename, index) =>
          db.query(
            `UPDATE product_images
             SET sort_order = ?
             WHERE product_id = ? AND url = ?`,
            [index, id, "/uploads/products/" + filename]
          )
        )
      );

      /* 5) ✅ 대표 이미지(thumbnail) 재설정 (반드시 try 안, res.json 직전) */
      let newThumbnail = null;

      if (oldList.length > 0) {
        newThumbnail = "/uploads/products/" + oldList[0];
      } else if (req.files?.length > 0) {
        newThumbnail = "/uploads/products/" + req.files[0].filename;
      }

      await db.execute(
        `UPDATE products SET thumbnail = ? WHERE id = ?`,
        [newThumbnail, id]
      );

      // ✅ 응답은 단 한번, 맨 마지막
      return res.json({ message: "updated" });

    } catch (e) {
      console.error("PUT error:", e);
      return res.status(500).json({ message: "server error", error: e.message });
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



// 삭제 기능
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

    // 4) 실제 파일 삭제
    images.forEach(img => {
      if (!img.url) return;

      const filePath = path.join(__dirname, "../public", img.url);
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



/* ==========================================================
   🌐 제품 언어 버전 추가 (Translate)
   - 기존 제품(group_id 기준)에 다른 언어 row 생성
   - 이미지(product_images)까지 함께 복제
========================================================== */
router.post("/:id/translate", verifyToken, verifyEditor, async (req, res) => {
  try {
    const { id } = req.params;
    const { lang } = req.body;

    if (!lang) {
      return res.status(400).json({ message: "lang is required" });
    }

    // 1️⃣ 기준 제품 조회
    const [[base]] = await db.execute(
      `SELECT * FROM products WHERE id = ?`,
      [id]
    );

    if (!base) {
      return res.status(404).json({ message: "base product not found" });
    }

    // 2️⃣ 같은 group_id + lang 이미 존재하는지 체크
    const [[exists]] = await db.execute(
      `SELECT id FROM products WHERE group_id = ? AND lang = ?`,
      [base.group_id, lang]
    );

    if (exists) {
      return res.status(409).json({
        message: "This language version already exists",
        id: exists.id
      });
    }

    // 3️⃣ 신규 언어 버전 INSERT
    const [insert] = await db.execute(
      `INSERT INTO products
        (group_id, title, summary, category, thumbnail, description_html, sort_order, lang)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        base.group_id,
        base.title,
        base.summary,
        base.category,
        base.thumbnail,
        base.description_html,
        base.sort_order,
        lang
      ]
    );

    const newId = insert.insertId;

    // 4️⃣ 🔥 이미지(product_images) 복제
    const [images] = await db.execute(
      `SELECT url, sort_order FROM product_images WHERE product_id = ?`,
      [base.id]
    );

    if (images.length > 0) {
      const values = images.map(img => [
        newId,
        img.url,
        img.sort_order
      ]);

      await db.query(
        `INSERT INTO product_images (product_id, url, sort_order)
         VALUES ?`,
        [values]
      );
    }

    // 5️⃣ 응답
    res.status(201).json({
      message: "translated",
      id: newId
    });

  } catch (e) {
    console.error("TRANSLATE error:", e);
    res.status(500).json({ message: "server error" });
  }
});


export default router;
