// server/routes/posts_common.js
import express from "express";
import db from "../config/db.js";
import jwt from "jsonwebtoken";

const router = express.Router();

/* =====================================================
   📈 조회수 증가 (안전 수정 버전)
===================================================== */
router.post("/view/:id", async (req, res) => {
  try {
    const postId = Number(req.params.id);
    if (!postId) {
      return res.status(400).json({ message: "invalid id" });
    }

    // 토큰 파싱 (관리자 제외용)
    let token = null;
    try {
      token = req.headers.authorization?.split(" ")[1] || null;
    } catch {}

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (["admin", "superadmin", "editor"].includes(decoded.role)) {
          return res.json({ message: "관리자 제외", added: false });
        }
      } catch {}
    }

    // IP / UA
    const rawIp =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.ip ||
      "0.0.0.0";

    const ip = rawIp.substring(0, 100);
    const ua = (req.headers["user-agent"] || "unknown").substring(0, 255);

    // 24시간 중복 체크
    const [exists] = await db.execute(
      `
      SELECT id
        FROM post_view_logs
       WHERE post_id = ?
         AND ip = ?
         AND user_agent = ?
         AND viewed_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
      `,
      [postId, ip, ua]
    );

    if (exists.length) {
      return res.json({ message: "중복 조회", added: false });
    }

    // 🔥 핵심 수정: viewed_at 명시 + 변수명 수정
    await db.execute(
      `
      INSERT INTO post_view_logs
        (post_id, ip, user_agent, viewed_at)
      VALUES (?, ?, ?, NOW())
      `,
      [postId, ip, ua]
    );

    // posts.views 증가 (있다면)
    await db.execute(
      `UPDATE posts SET views = views + 1 WHERE id = ?`,
      [postId]
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
    const postId = req.params.id;

    const [rows] = await db.execute(
      `SELECT p.*,
              u.name AS author_name,
              (SELECT COUNT(*) FROM post_view_logs v WHERE v.post_id = p.id) AS views
         FROM posts p
         LEFT JOIN users u ON p.author_id = u.id
        WHERE p.id = ?`,
      [postId]
    );

    if (!rows.length) return res.json({});
    const post = rows[0];

    // 이미지
    const [images] = await db.execute(
      `SELECT image_path FROM post_images WHERE post_id=?`,
      [postId]
    );
    post.images = images.map(i => i.image_path);

    // 파일 (🔥 반드시 id 포함)
    const [files] = await db.execute(
      `SELECT id, file_path, original_name, file_size
         FROM post_files
        WHERE post_id=?`,
      [postId]
    );

    post.files = files;

    res.json(post);

  } catch (err) {
    console.error("조회 오류:", err);
    res.status(500).json({ message: "조회 오류" });
  }
});


/* =====================================================
   📤 목록 조회
===================================================== */
router.get("/list/:category", async (req, res) => {
  try {
    const category = req.params.category;
    const lang = req.query.lang || "kr";

    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 99999;

    const offset = (page - 1) * pageSize;

    let countSQL = `SELECT COUNT(*) AS cnt FROM posts WHERE category=?`;
    const countParams = [category];

    if (lang !== "all") {
      countSQL += ` AND lang=?`;
      countParams.push(lang);
    }

    const [countRows] = await db.execute(countSQL, countParams);
    const total = countRows[0].cnt;
    const pages = Math.ceil(total / pageSize);

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


/* =====================================================
   📌 최신 글 가져오기
===================================================== */
router.get("/latest", async (req, res) => {
  try {
    const lang = req.query.lang || "kr";
    const limit = Number(req.query.limit) || 3;

    const sql = `
      SELECT p.*,
             u.name AS author_name,
             (SELECT COUNT(*) FROM post_view_logs v WHERE v.post_id = p.id) AS views
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
       WHERE p.category IN ('notice', 'news')
         AND p.lang = ?
       ORDER BY p.created_at DESC
       LIMIT ${limit}
    `;

    const [rows] = await db.execute(sql, [lang]);

    res.json(rows);

  } catch (err) {
    console.error("🔥 최신 글 조회 오류:", err);
    res.status(500).json({ message: "latest error" });
  }
});


export default router;
