// server/routes/adminDashboard.js
import express from "express";
import pool from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* ==========================================
   📊 관리자 대시보드 통계 API
   👉 GET /api/admin/dashboard
   🔥 로그인 사용자라면 모두 접근 가능
========================================== */
router.get("/dashboard", verifyToken, async (req, res) => {
  try {
    // 이번달 조회수
    const [[thisMonth]] = await pool.execute(`
      SELECT SUM(views) AS total
      FROM post_view_stats
      WHERE year = YEAR(NOW())
        AND month = MONTH(NOW())
    `);

    // 지난달 조회수
    const [[lastMonth]] = await pool.execute(`
      SELECT SUM(views) AS total
      FROM post_view_stats
      WHERE year = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
        AND month = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
    `);

    // 전체 게시물 수
    const [[postCount]] = await pool.execute(`
      SELECT COUNT(*) AS cnt FROM posts
    `);

    // 조회수 TOP 5
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

    // 최근 제품 5개
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
      thisMonthViews: thisMonth.total || 0,
      lastMonthViews: lastMonth.total || 0,
      postCount: postCount.cnt,
      topPosts,
      recentProducts
    });

  } catch (err) {
    console.error("📌 Dashboard API 오류:", err);
    res.status(500).json({ message: "Dashboard load error" });
  }
});

/* ==========================================
   📈 월별 조회수 API
   👉 GET /api/admin/monthly-views
   🔥 로그인 사용자라면 모두 접근 가능
========================================== */
router.get("/monthly-views", verifyToken, async (req, res) => {
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

export default router;
