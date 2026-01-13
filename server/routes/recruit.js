// server/routes/recruit.js
import express from "express";
import db from "../config/db.js";
import { verifyToken, canDelete } from "../middleware/auth.js";
import Audit from "../utils/auditLogger.js";

const router = express.Router();


/* ===============================
   관리자 – 채용공고 공개/비공개
=============================== */
router.put("/toggle/:id", verifyToken, async (req, res) => {
  const id = Number(req.params.id);
  const { is_active } = req.body;

  await db.execute(
    `UPDATE recruit_posts SET is_active=? WHERE id=?`,
    [is_active, id]
  );

  await Audit.log({
    contentType: Audit.CONTENT_TYPE.RECRUIT,
    contentId: id,
    action: Audit.ACTION.UPDATE,
    actor: req.user,
    after: { is_active },
    req
  });

  res.json({ message: "updated" });
});


/* ============================================================
   📌 채용공고 등록
============================================================ */
router.post("/create", verifyToken, async (req, res) => {
  try {
    const {
      title,
      employment_type,
      career_level,
      location,
      content,
      sort_order = 9999
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "필수 값 누락" });
    }

    const [result] = await db.execute(
      `
      INSERT INTO recruit_posts
        (title, employment_type, career_level, location, content, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
      `,
      [title, employment_type, career_level, location, content, sort_order]
    );

    const postId = result.insertId;

    await Audit.log({
      contentType: Audit.CONTENT_TYPE.RECRUIT,
      contentId: postId,
      action: Audit.ACTION.CREATE,
      actor: req.user,
      after: { title, employment_type, career_level, location, sort_order },
      req
    });

    res.json({ message: "채용공고 등록 완료", id: postId });

  } catch (err) {
    console.error("📌 채용공고 등록 오류:", err);
    res.status(500).json({ message: "채용공고 등록 오류" });
  }
});

/* ============================================================
   📌 채용공고 수정
============================================================ */
router.put("/update/:id", verifyToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      title,
      employment_type,
      career_level,
      location,
      content,
      sort_order,
      is_active
    } = req.body;

    const [[before]] = await db.execute(
      `SELECT * FROM recruit_posts WHERE id=?`,
      [id]
    );

    if (!before) {
      return res.status(404).json({ message: "채용공고 없음" });
    }

    await db.execute(
      `
      UPDATE recruit_posts SET
        title = COALESCE(?, title),
        employment_type = COALESCE(?, employment_type),
        career_level = COALESCE(?, career_level),
        location = COALESCE(?, location),
        content = COALESCE(?, content),
        sort_order = COALESCE(?, sort_order),
        is_active = COALESCE(?, is_active),
        updated_at = NOW()
      WHERE id=?
      `,
      [
        title,
        employment_type,
        career_level,
        location,
        content,
        sort_order,
        is_active,
        id
      ]
    );

    await Audit.log({
      contentType: Audit.CONTENT_TYPE.RECRUIT,
      contentId: id,
      action: Audit.ACTION.UPDATE,
      actor: req.user,
      before,
      after: req.body,
      req
    });

    res.json({ message: "채용공고 수정 완료" });

  } catch (err) {
    console.error("📌 채용공고 수정 오류:", err);
    res.status(500).json({ message: "수정 오류" });
  }
});

/* ============================================================
   📌 채용공고 삭제 (soft)
============================================================ */
router.delete("/delete/:id", verifyToken, canDelete, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const [[before]] = await db.execute(
      `SELECT * FROM recruit_posts WHERE id=?`,
      [id]
    );

    if (!before) {
      return res.status(404).json({ message: "채용공고 없음" });
    }

    await db.execute(
      `UPDATE recruit_posts SET is_active=0, updated_at=NOW() WHERE id=?`,
      [id]
    );

    await Audit.log({
      contentType: Audit.CONTENT_TYPE.RECRUIT,
      contentId: id,
      action: Audit.ACTION.DELETE,
      actor: req.user,
      before,
      req
    });

    res.json({ message: "채용공고 삭제 완료" });

  } catch (err) {
    console.error("📌 채용공고 삭제 오류:", err);
    res.status(500).json({ message: "삭제 오류" });
  }
});

/* ============================================================
   📌 채용공고 목록 (관리자)
============================================================ */
router.get("/list", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM recruit_posts ORDER BY sort_order ASC, created_at DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error("📌 채용공고 목록 오류:", err);
    res.status(500).json({ message: "목록 오류" });
  }
});

/* ============================================================
   📌 채용공고 단건 (관리자)
============================================================ */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const [[row]] = await db.execute(
      `SELECT * FROM recruit_posts WHERE id=?`,
      [req.params.id]
    );

    if (!row) {
      return res.status(404).json({ message: "채용공고 없음" });
    }

    res.json(row);
  } catch (err) {
    console.error("📌 채용공고 단건 오류:", err);
    res.status(500).json({ message: "조회 오류" });
  }
});


/* ===============================
   관리자 – 인재 DB 목록
=============================== */
router.get("/talents", verifyToken, async (req, res) => {
  const [rows] = await db.execute(`
    SELECT id, name, email, resume_path, created_at
    FROM recruit_talents
    ORDER BY created_at DESC
  `);
  res.json(rows);
});

/* ===============================
   관리자 – 인재 DB 삭제
=============================== */
router.delete("/talent/:id", verifyToken, canDelete, async (req, res) => {
  const id = Number(req.params.id);

  await db.execute(`DELETE FROM recruit_talents WHERE id=?`, [id]);

  await Audit.log({
    contentType: Audit.CONTENT_TYPE.RECRUIT,
    contentId: id,
    action: Audit.ACTION.DELETE,
    actor: req.user,
    req
  });

  res.json({ message: "deleted" });
});

export default router;
