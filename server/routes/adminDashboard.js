// server/routes/adminDashboard.js
import express from "express";
import pool from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* ============================================================
   📊 1) 관리자 대시보드 통계 API
   GET /api/admin/dashboard
============================================================ */
router.get("/dashboard", verifyToken, async (req, res) => {
  try {
    // 이번달 조회수
    const [[thisMonth]] = await pool.execute(`
      SELECT COUNT(*) AS cnt
      FROM post_view_logs
      WHERE YEAR(viewed_at) = YEAR(NOW())
        AND MONTH(viewed_at) = MONTH(NOW())
    `);

    // 지난달 조회수
    const [[lastMonth]] = await pool.execute(`
      SELECT COUNT(*) AS cnt
      FROM post_view_logs
      WHERE YEAR(viewed_at) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
        AND MONTH(viewed_at) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
    `);

    // 전체 게시물 수
    const [[postCount]] = await pool.execute(`
      SELECT COUNT(*) AS cnt FROM posts
    `);

    // TOP 5 인기글
    const [topPosts] = await pool.execute(`
      SELECT p.id, p.title,
             COUNT(v.id) AS total_views
      FROM posts p
      LEFT JOIN post_view_logs v ON p.id = v.post_id
      GROUP BY p.id
      ORDER BY total_views DESC
      LIMIT 5
    `);

    // 최근 등록 제품 5개
    const [recentProducts] = await pool.execute(`
      SELECT id, title, category, thumbnail
      FROM products
      ORDER BY created_at DESC
      LIMIT 5
    `);

    recentProducts.forEach(p => {
      p.image = p.thumbnail || null;
    });

    res.json({
      thisMonthViews: thisMonth.cnt,
      lastMonthViews: lastMonth.cnt,
      postCount: postCount.cnt,
      topPosts,
      recentProducts
    });

  } catch (err) {
    console.error("📌 Dashboard API 오류:", err);
    res.status(500).json({ message: "Dashboard load error" });
  }
});


/* ============================================================
   📈 2) 월별 조회수 그래프 API
   GET /api/admin/monthly-views
============================================================ */
router.get("/monthly-views", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        YEAR(viewed_at) AS year,
        MONTH(viewed_at) AS month,
        COUNT(*) AS total_views
      FROM post_view_logs
      GROUP BY YEAR(viewed_at), MONTH(viewed_at)
      ORDER BY year DESC, month DESC
      LIMIT 12
    `);

    res.json(rows);
  } catch (err) {
    console.error("월별 조회수 오류:", err);
    res.status(500).json({ message: "월별 조회수 오류" });
  }
});

export default router;
