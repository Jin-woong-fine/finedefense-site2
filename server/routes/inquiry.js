// server/routes/inquiry.js
import express from "express";
import db from "../config/db.js";

const router = express.Router();

/* ============================
   📌 GET /api/inquiry/list
   전체 목록 조회 (최신순)
============================ */
router.get("/list", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, name, email, subject, created_at, status, admin_note
      FROM inquiry
      ORDER BY id DESC
    `);

    return res.json(rows);
  } catch (err) {
    console.error("[Inquiry List Error]", err);
    return res.status(500).json({ message: "목록 조회 실패" });
  }
});

/* ============================
   📌 GET /api/inquiry/view/:id
   단건 상세 조회
============================ */
router.get("/view/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const [rows] = await db.query(`
      SELECT *
      FROM inquiry
      WHERE id = ?
      LIMIT 1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "해당 문의 없음" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("[Inquiry View Error]", err);
    return res.status(500).json({ message: "상세 조회 실패" });
  }
});

/* ============================
   📌 PATCH /api/inquiry/status/:id
   상태 변경 (0=미확인, 1=확인)
============================ */
router.patch("/status/:id", async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;

  try {
    await db.query(`
      UPDATE inquiry
      SET status = ?
      WHERE id = ?
    `, [status, id]);

    return res.json({ success: true });
  } catch (err) {
    console.error("[Inquiry Status Error]", err);
    return res.status(500).json({ message: "상태 업데이트 실패" });
  }
});

/* ============================
   📌 PATCH /api/inquiry/note/:id
   관리자 메모 저장
============================ */
router.patch("/note/:id", async (req, res) => {
  const id = req.params.id;
  const { note } = req.body;

  try {
    await db.query(`
      UPDATE inquiry
      SET admin_note = ?
      WHERE id = ?
    `, [note, id]);

    return res.json({ success: true });
  } catch (err) {
    console.error("[Inquiry Note Error]", err);
    return res.status(500).json({ message: "메모 저장 실패" });
  }
});

export default router;
