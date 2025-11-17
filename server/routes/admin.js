import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import db from "../config/db.js";
import verifyToken from "../middleware/auth.js";

const router = express.Router();

/* ============================================================
   📂 자료실 업로드 (기존 코드)
============================================================ */
const upload = multer({ dest: "server/uploads/downloads/" });

router.post("/upload-download", upload.single("file"), async (req, res) => {
  try {
    const { lang, title, desc, date } = req.body;
    const filePath = `/uploads/downloads/${req.file.filename}_${req.file.originalname}`;
    const jsonFile = path.join("data", `downloads_${lang}.json`);

    const newItem = { title, desc, date, file: filePath };

    let data = [];
    if (fs.existsSync(jsonFile)) {
      data = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
    }
    data.unshift(newItem);

    fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2));

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});


/* ============================================================
   📊 관리자 대시보드 — 월간 조회수 / 전체 조회수 / Top5
============================================================ */
router.get("/dashboard", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "권한 없음" });
    }

    // 이번달 조회수
    const [tm] = await db.execute(`
      SELECT COUNT(*) AS views
      FROM post_view_logs
      WHERE MONTH(viewed_at) = MONTH(NOW())
        AND YEAR(viewed_at) = YEAR(NOW())
    `);

    // 지난달 조회수
    const [lm] = await db.execute(`
      SELECT COUNT(*) AS views
      FROM post_view_logs
      WHERE MONTH(viewed_at) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
        AND YEAR(viewed_at) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
    `);

    // 게시물 총 개수
    const [pc] = await db.execute(`
      SELECT COUNT(*) AS count FROM posts
    `);

    // 조회수 TOP 5
    const [top] = await db.execute(`
      SELECT 
        p.id,
        p.title,
        (
          SELECT COUNT(*)
          FROM post_view_logs v
          WHERE v.post_id = p.id
        ) AS total_views
      FROM posts p
      ORDER BY total_views DESC
      LIMIT 5
    `);

    res.json({
      thisMonthViews: tm[0].views,
      lastMonthViews: lm[0].views,
      postCount: pc[0].count,
      topPosts: top
    });

  } catch (err) {
    console.error("관리자 대시보드 오류:", err);
    res.status(500).json({ message: "관리자 대시보드 오류" });
  }
});


/* ============================================================
   📈 월별 조회수 통계 (그래프용)
============================================================ */
router.get("/monthly-views", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "권한 없음" });
    }

    const [rows] = await db.execute(`
      SELECT 
        YEAR(viewed_at) AS year,
        MONTH(viewed_at) AS month,
        COUNT(*) AS total_views
      FROM post_view_logs
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
