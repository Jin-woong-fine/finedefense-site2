import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import db from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 업로드 폴더 생성
const UPLOAD_DIR = path.join(__dirname, "../public/uploads/downloads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer 설정 (한글 파일명 지원)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const utf8Name = Buffer.from(file.originalname, "latin1").toString("utf8");
    const unique = Date.now() + "_" + Math.round(Math.random() * 1e9);
    cb(null, unique + "_" + utf8Name);
  },
});
const uploadFile = multer({ storage });

/* ----------------------------------------
   📌 자료 등록
---------------------------------------- */
router.post("/create", verifyToken, uploadFile.single("file"), async (req, res) => {
  try {
    const { title, lang } = req.body;

    if (!req.file) return res.status(400).json({ message: "파일이 필요합니다." });

    const fileUrl = "/uploads/downloads/" + req.file.filename;

    await db.execute(
      `INSERT INTO downloads_items (title, lang, file_url, file_size)
       VALUES (?, ?, ?, ?)`,
      [title, lang || "kr", fileUrl, req.file.size]
    );

    res.json({ message: "등록 완료" });
  } catch (err) {
    console.error("자료 등록 오류:", err);
    res.status(500).json({ message: "자료 등록 오류" });
  }
});

/* ----------------------------------------
   📌 목록 조회
---------------------------------------- */
router.get("/list", async (req, res) => {
  try {
    const search = req.query.search || "";
    const lang = req.query.lang || "kr";

    const [rows] = await db.execute(
      `SELECT *
         FROM downloads_items
        WHERE lang = ?
          AND title LIKE ?
        ORDER BY sort_order, created_at DESC`,
      [lang, `%${search}%`]
    );

    res.json(rows);
  } catch (err) {
    console.error("자료 조회 오류:", err);
    res.status(500).json({ message: "자료 조회 오류" });
  }
});

/* ----------------------------------------
   📌 상세 조회
---------------------------------------- */
router.get("/detail/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await db.execute(
      `SELECT * FROM downloads_items WHERE id=?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: "not found" });

    res.json(rows[0]);
  } catch (err) {
    console.error("자료 상세 오류:", err);
    res.status(500).json({ message: "자료 상세 오류" });
  }
});

/* ----------------------------------------
   📌 수정
---------------------------------------- */
router.put("/update/:id", verifyToken, uploadFile.single("file"), async (req, res) => {
  try {
    const id = req.params.id;
    const { title, lang, sort_order } = req.body;

    let updateFile = "";
    let params = [title, lang, sort_order, id];

    if (req.file) {
      const fileUrl = "/uploads/downloads/" + req.file.filename;
      updateFile = ", file_url = ?, file_size = ?";
      params = [title, lang, sort_order, fileUrl, req.file.size, id];
    }

    await db.execute(
      `UPDATE downloads_items
          SET title = ?, lang = ?, sort_order = ?
              ${updateFile}
         WHERE id = ?`,
      params
    );

    res.json({ message: "수정 완료" });
  } catch (err) {
    console.error("자료 수정 오류:", err);
    res.status(500).json({ message: "자료 수정 오류" });
  }
});

/* ----------------------------------------
   📌 삭제
---------------------------------------- */
router.delete("/delete/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;

    const [fileRow] = await db.execute(
      `SELECT file_url FROM downloads_items WHERE id=?`,
      [id]
    );

    if (fileRow.length) {
      const rel = fileRow[0].file_url.replace(/^\//, "");
      const absPath = path.join(__dirname, "..", rel);
      if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
    }

    await db.execute(`DELETE FROM downloads_items WHERE id=?`, [id]);

    res.json({ message: "삭제 완료" });
  } catch (err) {
    console.error("자료 삭제 오류:", err);
    res.status(500).json({ message: "자료 삭제 오류" });
  }
});

export default router;
