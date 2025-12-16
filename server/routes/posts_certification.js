// server/routes/posts_certification.js
import express from "express";
import db from "../config/db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import authMiddleware from "../middleware/auth.js";


const router = express.Router();

/* ============================================
   📌 파일 업로드 설정 (썸네일 + 원본)
============================================ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../public/uploads/certifications");
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + ext);
  }
});

const upload = multer({ storage });

/* ============================================
   📌 인증/특허 추가
============================================ */
router.post("/add", upload.fields([
  { name: "thumb", maxCount: 1 },
  { name: "file", maxCount: 1 }
]), async (req, res) => {
  try {
    const { type, title_kr, title_en, lang, sort_order } = req.body;

    const thumb = req.files["thumb"] ? "/uploads/certifications/" + req.files["thumb"][0].filename : null;
    const file = req.files["file"] ? "/uploads/certifications/" + req.files["file"][0].filename : null;

    const [result] = await db.execute(
      `INSERT INTO cert_items (type, title_kr, title_en, lang, sort_order, thumb_url, file_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [type, title_kr, title_en, lang, sort_order, thumb, file]
    );

    res.json({ id: result.insertId, message: "등록 완료" });

  } catch (err) {
    console.error("🔥 add 오류:", err);
    res.status(500).json({ message: "add 오류" });
  }
});


/* ============================================
   📌 인증/특허 상세 조회
============================================ */
router.get("/detail/:id", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM cert_items WHERE id=?`,
      [req.params.id]
    );

    if (!rows.length) return res.json({});
    res.json(rows[0]);

  } catch (err) {
    console.error("🔥 detail 오류:", err);
    res.status(500).json({ message: "detail 오류" });
  }
});


/* ============================================
   📌 인증/특허 수정
============================================ */
router.post("/update/:id", upload.fields([
  { name: "thumb", maxCount: 1 },
  { name: "file", maxCount: 1 }
]), async (req, res) => {
  try {
    const id = req.params.id;
    const { type, title_kr, title_en, lang, sort_order } = req.body;

    // 기존 데이터
    const [oldRows] = await db.execute(
      `SELECT * FROM cert_items WHERE id=?`,
      [id]
    );
    if (!oldRows.length) return res.status(404).json({ message: "not found" });

    let thumb_url = oldRows[0].thumb_url;
    let file_url = oldRows[0].file_url;

    if (req.files["thumb"]) {
      thumb_url = "/uploads/certifications/" + req.files["thumb"][0].filename;
    }
    if (req.files["file"]) {
      file_url = "/uploads/certifications/" + req.files["file"][0].filename;
    }

    await db.execute(
      `UPDATE cert_items
          SET type=?, title_kr=?, title_en=?, lang=?, sort_order=?, thumb_url=?, file_url=?
        WHERE id=?`,
      [type, title_kr, title_en, lang, sort_order, thumb_url, file_url, id]
    );

    res.json({ message: "수정 완료" });

  } catch (err) {
    console.error("🔥 update 오류:", err);
    res.status(500).json({ message: "update 오류" });
  }
});


/* ============================================
   📌 인증/특허 삭제
============================================ */
router.delete("/delete/:id", async (req, res) => {
  try {
    await db.execute(`DELETE FROM cert_items WHERE id=?`, [req.params.id]);
    res.json({ message: "삭제 완료" });
  } catch (err) {
    console.error("🔥 delete 오류:", err);
    res.status(500).json({ message: "delete 오류" });
  }
});


/* ============================================
   📌 목록 조회 + type/lang/search 필터
============================================ */
router.get("/list", async (req, res) => {
  try {
    const type = req.query.type || "all";
    const lang = req.query.lang || "all";
    const search = req.query.search || "";

    let sql = `
      SELECT *
        FROM cert_items
       WHERE 1=1
    `;
    let params = [];

    if (type !== "all") {
      sql += ` AND type=? `;
      params.push(type);
    }

    if (lang !== "all") {
      sql += ` AND (lang=? OR lang='all') `;
      params.push(lang);
    }

    if (search) {
      sql += ` AND (title_kr LIKE ? OR title_en LIKE ?) `;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY sort_order ASC, id DESC `;

    const [rows] = await db.execute(sql, params);

    res.json(rows);

  } catch (err) {
    console.error("🔥 list 오류:", err);
    res.status(500).json({ message: "list 오류" });
  }
});

/* ============================================
   📌 리스트에서 순번 수정
============================================ */

router.post("/update-sort/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { sort_order } = req.body;

  // ⭐ 최소 방어 (여기!)
  const order = Number(sort_order);
  if (isNaN(order)) {
    return res.status(400).json({ message: "잘못된 순번 값" });
  }

  try {
    await db.execute(
      "UPDATE cert_items SET sort_order=? WHERE id=?",
      [order, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("🔥 update-sort 오류:", err);
    res.status(500).json({ message: "정렬 순서 업데이트 실패" });
  }
});





export default router;
