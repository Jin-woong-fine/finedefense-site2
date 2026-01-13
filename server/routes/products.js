import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import db from "../config/db.js";
import { verifyToken, verifyEditor, verifyAdmin } from "../middleware/auth.js";
import fs from "fs";
import Audit from "../utils/auditLogger.js";

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
  upload.array("images")(req, res, async err => {
    if (err) {
      return res.status(400).json({ message: "Upload error", detail: err.message });
    }

    try {
      const {
        title,
        summary = "",
        category,
        description_html = "",
        sort_order = 999,
        lang
      } = req.body;

      if (!title || !category || !lang) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const [[g]] = await db.execute(
        `SELECT IFNULL(MAX(group_id),0)+1 AS gid FROM products`
      );
      const groupId = g.gid;

      const thumbnail = req.files?.[0]
        ? `/uploads/products/${req.files[0].filename}`
        : null;

      const [insert] = await db.execute(
        `INSERT INTO products
         (group_id, title, summary, category, thumbnail,
          description_html, sort_order, lang)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          groupId,
          title,
          summary,
          category,
          thumbnail,
          description_html,
          sort_order,
          lang
        ]
      );

      const productId = insert.insertId;

      if (req.files?.length) {
        const values = req.files.map((f, i) => [
          productId,
          `/uploads/products/${f.filename}`,
          i
        ]);

        await db.query(
          `INSERT INTO product_images (product_id, url, sort_order)
           VALUES ?`,
          [values]
        );
      }

      await Audit.log({
        contentType: Audit.CONTENT_TYPE.PRODUCT,
        contentId: productId,
        action: Audit.ACTION.CREATE,
        actor: req.user,
        before: null,
        after: { title, category, lang, sort_order, thumbnail },
        req
      });

      res.status(201).json({ message: "created", id: productId });

    } catch (e) {
      console.error("POST error:", e);
      res.status(500).json({ message: "server error" });
    }
  });
});



/* ==========================================================
   🔢 제품 순번(sort_order) 저장
   - en 존재 시: kr + en 모두 변경
   - en 없을 시: kr만 변경
========================================================== */
router.put("/sort-order", verifyToken, verifyEditor, async (req, res) => {
  try {
    const { orders } = req.body;

    if (!Array.isArray(orders)) {
      return res.status(400).json({ message: "Invalid orders format" });
    }

    for (const { id, sort_order } of orders) {

      // 1️⃣ 기준(kr) 제품의 group_id 조회
      const [[base]] = await db.execute(
        `SELECT group_id FROM products WHERE id = ?`,
        [id]
      );

      if (!base) continue;

      // 2️⃣ 같은 group_id에 en 버전 존재 여부 확인
      const [[hasEn]] = await db.execute(
        `SELECT id FROM products WHERE group_id = ? AND lang = 'en'`,
        [base.group_id]
      );

      if (hasEn) {
        // ✅ en 존재 → kr + en 모두 업데이트
        await db.execute(
          `UPDATE products
          SET sort_order = ?, updated_at = NOW()
          WHERE group_id = ?`,
          [sort_order, base.group_id]
        );
      } else {
        // ✅ en 없음 → kr만 업데이트
        await db.execute(
          `UPDATE products
          SET sort_order = ?, updated_at = NOW()
          WHERE id = ?`,
          [sort_order, id]
        );
      }
    }

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
      `SELECT
         id,
         title,
         summary,
         category,
         thumbnail,
         description_html,
         created_at,
         updated_at
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

    if (!before) {
      return res.status(404).json({ message: "product not found" });
    }

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
  upload.array("images")(req, res, async err => {
    if (err) {
      return res.status(400).json({ message: "Upload error", detail: err.message });
    }

    let before = null;

    try {
      const { id } = req.params;
      const {
        lang,
        title,
        summary = "",
        category,
        sort_order = 999,
        description_html = "",
        old_images
      } = req.body;

      if (!lang || !title || !category) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const [[base]] = await db.execute(
        `SELECT group_id FROM products WHERE id=?`,
        [id]
      );
      if (!base) return res.status(404).json({ message: "not found" });

      const [[target]] = await db.execute(
        `SELECT * FROM products WHERE group_id=? AND lang=?`,
        [base.group_id, lang]
      );
      if (!target) return res.status(404).json({ message: "lang not found" });

      before = {
        title: target.title,
        summary: target.summary,
        category: target.category,
        sort_order: target.sort_order,
        description_html: target.description_html,
        thumbnail: target.thumbnail
      };

      await db.execute(
        `UPDATE products
         SET title=?, summary=?, category=?, sort_order=?,
             description_html=?, updated_at=NOW()
         WHERE id=?`,
        [
          title,
          summary,
          category,
          sort_order,
          description_html,
          target.id
        ]
      );

      let keep = [];
      try {
        keep = old_images ? JSON.parse(old_images) : [];
      } catch {}

      const [imgs] = await db.execute(
        `SELECT url FROM product_images WHERE product_id=?`,
        [target.id]
      );

      const dbList = imgs.map(i => i.url.replace("/uploads/products/", ""));
      const removed = dbList.filter(n => !keep.includes(n));

      if (removed.length) {
        const urls = removed.map(n => "/uploads/products/" + n);
        await db.query(
          `DELETE FROM product_images
           WHERE product_id=? AND url IN (?)`,
          [target.id, urls]
        );

        removed.forEach(n => {
          const p = path.join(uploadDir, n);
          if (fs.existsSync(p)) fs.unlinkSync(p);
        });
      }

      if (req.files?.length) {
        const values = req.files.map((f, i) => [
          target.id,
          `/uploads/products/${f.filename}`,
          keep.length + i
        ]);

        await db.query(
          `INSERT INTO product_images (product_id, url, sort_order)
           VALUES ?`,
          [values]
        );
      }


      await Promise.all(
        keep.map((filename, index) =>
          db.query(
            `UPDATE product_images
            SET sort_order=?
            WHERE product_id=? AND url=?`,
            [index, target.id, "/uploads/products/" + filename]
          )
        )
      );

      const newThumb =
        keep[0]
          ? "/uploads/products/" + keep[0]
          : req.files?.[0]
            ? "/uploads/products/" + req.files[0].filename
            : null;

      await db.execute(
        `UPDATE products SET thumbnail=? WHERE id=?`,
        [newThumb, target.id]
      );

      await Audit.log({
        contentType: Audit.CONTENT_TYPE.PRODUCT,
        contentId: target.id,
        action: Audit.ACTION.UPDATE,
        actor: req.user,
        before,
        after: {
          title,
          summary,
          category,
          lang,
          sort_order,
          addedImages: req.files?.map(f => f.originalname) || [],
          removedImages: removed
        },
        req
      });

      res.json({ message: "updated" });

    } catch (e) {
      console.error("PUT error:", e);
      res.status(500).json({ message: "server error" });
    }
  });
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
      (group_id, title, summary, category, thumbnail,
      description_html, sort_order, lang, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
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


    // ⭐ AUDIT LOG (TRANSLATE = CREATE)
    await Audit.log({
      contentType: Audit.CONTENT_TYPE.PRODUCT,
      contentId: newId,
      action: Audit.ACTION.CREATE,
      actor: req.user,
      before: null,   // ✅ 추가
      after: {
        base_id: id,
        lang,
        group_id: base.group_id
      },
      req
    });


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


/* ==========================================================
   🗑 제품 삭제 (ADMIN 이상만)
========================================================== */
router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
  let before = null;

  try {
    const { id } = req.params;

    const [[row]] = await db.execute(
      `SELECT * FROM products WHERE id=?`,
      [id]
    );
    if (!row) return res.status(404).json({ message: "not found" });

    before = row;

    const [imgs] = await db.execute(
      `SELECT url FROM product_images WHERE product_id=?`,
      [id]
    );

    imgs.forEach(i => {
      const p = path.join(uploadDir, i.url.replace("/uploads/products/", ""));
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });

    const [[base]] = await db.execute(
      `SELECT group_id FROM products WHERE id=?`,
      [id]
    );

    const [products] = await db.execute(
      `SELECT id FROM products WHERE group_id=?`,
      [base.group_id]
    );

    const ids = products.map(p => p.id);

    const [imgs] = await db.query(
      `SELECT url FROM product_images WHERE product_id IN (?)`,
      [ids]
    );

    imgs.forEach(i => {
      const p = path.join(uploadDir, i.url.replace("/uploads/products/", ""));
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });

    await db.query(`DELETE FROM product_images WHERE product_id IN (?)`, [ids]);
    await db.query(`DELETE FROM products WHERE id IN (?)`, [ids]);


    await Audit.log({
      contentType: Audit.CONTENT_TYPE.PRODUCT,
      contentId: id,
      action: Audit.ACTION.DELETE,
      actor: req.user,
      before,
      req
    });

    res.json({ message: "deleted" });

  } catch (e) {
    console.error("DELETE error:", e);
    res.status(500).json({ message: "server error" });
  }
});



export default router;
