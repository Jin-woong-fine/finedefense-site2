import express from "express";
import pool from "../config/db.js";
import { verifyToken, verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

/* ==========================================
   📊 관리자 대시보드 통계 API
   👉 GET /api/admin/dashboard
========================================== */
router.get("/dashboard", verifyToken, verifyAdmin, async (req, res) => {
  try {
    /* -------------------------------
       1) 이번달 조회수
    --------------------------------*/
    const [[thisMonth]] = await pool.execute(`
      SELECT SUM(views) AS total
      FROM post_view_stats
      WHERE year = YEAR(NOW())
      AND month = MONTH(NOW())
    `);

    /* -------------------------------
       2) 지난달 조회수
    --------------------------------*/
    const [[lastMonth]] = await pool.execute(`
      SELECT SUM(views) AS total
      FROM post_view_stats
      WHERE year = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
      AND month = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
    `);

    /* -------------------------------
       3) 전체 게시물 개수
    --------------------------------*/
    const [[postCount]] = await pool.execute(`
      SELECT COUNT(*) AS cnt FROM posts
    `);

    /* -------------------------------
       4) 조회수 TOP5 게시물
    --------------------------------*/
    const [topPosts] = await pool.execute(`
      SELECT 
        p.id,
        p.title,
        (
          SELECT SUM(views)
          FROM post_view_stats s
          WHERE s.post_id = p.id
        ) AS total_views
      FROM posts p
      ORDER BY total_views DESC
      LIMIT 5
    `);

    res.json({
      thisMonthViews: thisMonth.total || 0,
      lastMonthViews: lastMonth.total || 0,
      postCount: postCount.cnt,
      topPosts
    });

  } catch (err) {
    console.error("📌 Dashboard API 오류:", err);
    res.status(500).json({ message: "Dashboard load error" });
  }
});

export default router;



/* ==========================================
   📊 월별 조회수 API
   👉 GET /api/admin/monthly-views
========================================== */
router.get("/monthly-views", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        year,
        month,
        SUM(views) AS total_views
      FROM post_view_stats
      GROUP BY year, month
      ORDER BY year DESC, month DESC
      LIMIT 12
    `);

    res.json(rows);
  } catch (err) {
    console.error("월별 조회수 오류:", err);
    res.status(500).json({ message: "월별 조회수 오류" });
  }
});
