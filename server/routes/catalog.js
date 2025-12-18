// server/routes/catalog.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../config/db.js";
import { verifyToken, allowRoles } from "../middleware/auth.js";
import { fileURLToPath } from "url";
import { canUpdate } from "../middleware/auth.js";

const router = express.Router();

// 절대경로
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 업로드 루트
const UPLOAD_ROOT = path.join(__dirname, "../public/uploads/catalog");
if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

/* ======================================================
   📁 Multer (한글 파일명 깨짐 방지 + 안정화)
====================================================== */
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOAD_ROOT);
  },
  filename(req, file, cb) {
    const utf8 = Buffer.from(file.originalname, "latin1").toString("utf8");
    const ext = path.extname(utf8);
    const safe = `${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safe);
  }
});

const uploadCatalog = multer({
  storage,
  fileFilter(req, file, cb) {
    file.originalname = Buffer.from(file.originalname, "latin1").toString("utf8");
    cb(null, true);
  }
});

// 변환 함수
const toPublicPath = (filename) => `/uploads/catalog/${filename}`;
const toDiskPath = (publicPath) => {
  const rel = publicPath.replace(/^\/+uploads\//, "");
  return path.join(__dirname, "../public/uploads", rel);
};

/* ======================================================
   📌 1) 카탈로그 생성
====================================================== */
router.post(
  "/create",
  verifyToken,
  uploadCatalog.fields([{ name: "thumb", maxCount: 1 }, { name: "file", maxCount: 1 }]),
  async (req, res) => {
    try {
      const { title, lang, category, sort_order } = req.body;
      const safeSort = Number.isInteger(+sort_order) ? +sort_order : 9999;

      if (!title || !lang || !category) {
        return res.status(400).json({ message: "필수 값 누락" });
      }

      const thumb = req.files.thumb?.[0] || null;
      const file = req.files.file?.[0] || null;

      const thumbUrl = thumb ? toPublicPath(thumb.filename) : null;
      const fileUrl = file ? toPublicPath(file.filename) : null;
      const fileSize = file?.size || 0;

      const [result] = await db.execute(
        `INSERT INTO catalog_items
         (title, lang, category, thumb_url, file_url, file_size, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          lang,
          category,
          thumbUrl,
          fileUrl,
          fileSize,
          safeSort
        ]
      );

      res.json({ message: "카탈로그 등록 완료", id: result.insertId });

    } catch (err) {
      console.error("[catalog create] 오류:", err);
      res.status(500).json({ message: "등록 오류" });
    }
  }
);

/* ======================================================
   📌 2) 카탈로그 수정
====================================================== */
router.put(
  "/update/:id",
  verifyToken,
  uploadCatalog.fields([{ name: "thumb", maxCount: 1 }, { name: "file", maxCount: 1 }]),
  async (req, res) => {
    try {
      const id = req.params.id;
      const { title, lang, category, sort_order } = req.body;
      const safeSort = Number.isInteger(+sort_order) ? +sort_order : 9999;

      // 기존 정보
      const [rows] = await db.execute(
        `SELECT * FROM catalog_items WHERE id=?`,
        [id]
      );

      if (!rows.length) return res.status(404).json({ message: "not found" });

      const old = rows[0];

      const thumb = req.files.thumb?.[0] || null;
      const file = req.files.file?.[0] || null;

      let thumbUrl = old.thumb_url;
      let fileUrl = old.file_url;
      let fileSize = old.file_size;

      // 썸네일 교체
      if (thumb) {
        if (old.thumb_url) {
          const oldThumbPath = toDiskPath(old.thumb_url);
          if (fs.existsSync(oldThumbPath)) fs.unlinkSync(oldThumbPath);
        }
        thumbUrl = toPublicPath(thumb.filename);
      }

      // PDF 교체
      if (file) {
        if (old.file_url) {
          const oldFilePath = toDiskPath(old.file_url);
          if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
        }
        fileUrl = toPublicPath(file.filename);
        fileSize = file.size;
      }

      await db.execute(
        `UPDATE catalog_items
         SET title=?, lang=?, category=?, thumb_url=?, file_url=?, file_size=?, sort_order=?
         WHERE id=?`,
        [
          title,
          lang,
          category,
          thumbUrl,
          fileUrl,
          fileSize,
          safeSort,
          id
        ]
      );

      res.json({ message: "수정 완료" });

    } catch (err) {
      console.error("[catalog update] 오류:", err);
      res.status(500).json({ message: "수정 오류" });
    }
  }
);

/* ======================================================
   📌 3) 카탈로그 삭제
====================================================== */
router.delete(
  "/delete/:id",
  verifyToken,
  allowRoles("superadmin"),
  async (req, res) => {
  try {
    const id = req.params.id;

    const [rows] = await db.execute(
      `SELECT * FROM catalog_items WHERE id=?`,
      [id]
    );

    if (!rows.length) return res.status(404).json({ message: "not found" });

    const item = rows[0];

    // 파일 삭제
    if (item.thumb_url) {
      const p = toDiskPath(item.thumb_url);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }

    if (item.file_url) {
      const p = toDiskPath(item.file_url);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }

    await db.execute(`DELETE FROM catalog_items WHERE id=?`, [id]);

    res.json({ message: "삭제 완료" });

  } catch (err) {
    console.error("[catalog delete] 오류:", err);
    res.status(500).json({ message: "삭제 오류" });
  }
});

/* ======================================================
   📌 4) 리스트 조회
====================================================== */
router.get("/list", async (req, res) => {
  try {
    const { lang = "all", category = "all", search = "" } = req.query;

    let sql = `SELECT * FROM catalog_items WHERE 1=1`;
    const params = [];

    if (lang !== "all") {
      sql += ` AND lang=?`;
      params.push(lang);
    }

    if (category !== "all") {
      sql += ` AND category=?`;
      params.push(category);
    }

    if (search) {
      sql += ` AND title LIKE ?`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY sort_order, created_at DESC`;

    const [rows] = await db.execute(sql, params);
    res.json(rows);

  } catch (err) {
    console.error("[catalog list] 오류:", err);
    res.status(500).json({ message: "목록 오류" });
  }
});

/* ======================================================
   📌 5) 상세 조회
====================================================== */
router.get("/detail/:id", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM catalog_items WHERE id=?`,
      [req.params.id]
    );

    if (!rows.length) return res.json({});

    res.json(rows[0]);

  } catch (err) {
    console.error("[catalog detail] 오류:", err);
    res.status(500).json({ message: "조회 오류" });
  }
});

/* ======================================================
   📌 6) 조회수 증가 (카탈로그 PDF 열람)
====================================================== */
router.post("/view/:id", async (req, res) => {
  try {
    await db.execute(
      `UPDATE catalog_items
       SET views = views + 1
       WHERE id = ?`,
      [req.params.id]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("[catalog view] 오류:", err);
    res.status(500).json({ success: false });
  }
});


/* ======================================================
   📌 7) 다운로드 수 증가
====================================================== */
router.post("/download/:id", async (req, res) => {
  try {
    await db.execute(
      `UPDATE catalog_items
       SET downloads = downloads + 1
       WHERE id = ?`,
      [req.params.id]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("[catalog download] 오류:", err);
    res.status(500).json({ success: false });
  }
});

/* ======================================================
   📌 8) 카탈로그 조회수 TOP 5
====================================================== */
router.get(
  "/top-views",
  verifyToken,
  async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, title, views
       FROM catalog_items
       ORDER BY views DESC
       LIMIT 5`
    );
    res.json(rows);
  } catch (err) {
    console.error("[catalog top views] 오류:", err);
    res.status(500).json([]);
  }
});


/* ======================================================
   📌 9) 카탈로그 다운로드 TOP 5
====================================================== */
router.get(
  "/top-downloads",
  verifyToken,
  async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, title, downloads
       FROM catalog_items
       ORDER BY downloads DESC
       LIMIT 5`
    );
    res.json(rows);
  } catch (err) {
    console.error("[catalog top downloads] 오류:", err);
    res.status(500).json([]);
  }
});

/* ======================================================
   📌 순번(sort_order) 단독 수정
====================================================== */
router.post(
  "/update-sort/:id",
  verifyToken,
  canUpdate,
  async (req, res) => {
  const { id } = req.params;
  const { sort_order } = req.body;

  // 🔒 최소 방어
  const safeSort = Number.isInteger(+sort_order) ? +sort_order : 9999;

  try {
    const [result] = await db.execute(
      `UPDATE catalog_items
         SET sort_order = ?
       WHERE id = ?`,
      [safeSort, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "항목을 찾을 수 없음" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[catalog update-sort] 오류:", err);
    res.status(500).json({ message: "순번 수정 실패" });
  }
});


export default router; 