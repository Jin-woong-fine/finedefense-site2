// server/routes/posts_common.js
import express from "express";
import db from "../config/db.js";
import jwt from "jsonwebtoken";

const router = express.Router();

/* =====================================================
   📈 조회수 증가
===================================================== */
router.post("/view/:id", async (req, res) => {
  try {
    const postId = Number(req.params.id);
    if (!postId) return res.status(400).json({ message: "invalid id" });

    const token = req.headers.authorization?.split(" ")[1];

    // 관리자 제외
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (["admin", "superadmin", "editor"].includes(decoded.role)) {
          return res.json({ message: "관리자 제외", added: false });
        }
      } catch {}
    }

    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;
    const ua = req.headers["user-agent"] || "unknown";

    const [exists] = await db.execute(
      `SELECT id FROM post_view_logs 
       WHERE post_id=? AND ip=? AND user_agent=? 
         AND viewed_at > DATE_SUB(NOW(), INTERVAL 1 DAY)`,
      [postId, ip, ua]
    );

    if (exists.length)
      return res.json({ message: "중복 조회", added: false });

    await db.execute(
      `INSERT INTO post_view_logs (post_id, ip, user_agent) VALUES (?, ?, ?)`,
      [postId, ip, ua]
    );

    res.json({ message: "조회수 +1", added: true });

  } catch (err) {
    console.error("조회 오류:", err);
    res.status(500).json({ message: "조회 오류" });
  }
});


/* =====================================================
   📄 상세 조회
===================================================== */
router.get("/detail/:id", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.*, u.name AS author_name
         FROM posts p
         LEFT JOIN users u ON p.author_id = u.id
        WHERE p.id = ?`,
      [req.params.id]
    );

    if (!rows.length) return res.json({});
    const post = rows[0];

    const [images] = await db.execute(
      `SELECT image_path FROM post_images WHERE post_id=?`,
      [req.params.id]
    );
    post.images = images.map(i => i.image_path);

    const [files] = await db.execute(
      `SELECT file_path, original_name FROM post_files WHERE post_id=?`,
      [req.params.id]
    );
    post.files = files;

    res.json(post);

  } catch (err) {
    console.error("조회 오류:", err);
    res.status(500).json({ message: "조회 오류" });
  }
});


/* =====================================================
   📤 목록 조회 + Pagination (안정 버전)
===================================================== */
router.get("/list/:category", async (req, res) => {
  try {
    const category = req.params.category;
    const lang = req.query.lang || "kr";

    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 99999;

    const offset = (page - 1) * pageSize;

    /* ---------------------------
       전체 개수
    ---------------------------- */
    let countSQL = `SELECT COUNT(*) AS cnt FROM posts WHERE category=?`;
    const countParams = [category];

    if (lang !== "all") {
      countSQL += ` AND lang=?`;
      countParams.push(lang);
    }

    const [countRows] = await db.execute(countSQL, countParams);
    const total = countRows[0].cnt;
    const pages = Math.ceil(total / pageSize);

    /* ---------------------------
       실제 데이터 조회
       LIMIT/OFFSET → 문자열 삽입
    ---------------------------- */
    let listSQL = `
      SELECT p.*,
             u.name AS author_name,
             (SELECT COUNT(*) FROM post_view_logs v WHERE v.post_id = p.id) AS views
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
       WHERE p.category = ?
    `;
    const listParams = [category];

    if (lang !== "all") {
      listSQL += ` AND p.lang=? `;
      listParams.push(lang);
    }

    listSQL += `
      ORDER BY p.sort_order, p.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const [rows] = await db.execute(listSQL, listParams);

    /* ---------------------------
       응답
    ---------------------------- */
    res.json({
      list: rows,
      total,
      page,
      pages,
      pageSize
    });

  } catch (err) {
    console.error("🔥 목록 오류:", err);
    res.status(500).json({ message: "목록 오류" });
  }
});


export default router;
