// server/routes/traffic.js
import express from "express";
import db from "../config/db.js";
import geoip from "geoip-lite";
import { verifyToken, canAccessDashboard } from "../middleware/auth.js";




const router = express.Router();

/* ================================
   🟦 공통 함수
================================ */
function parseDevice(ua = "") {
  ua = ua.toLowerCase();
  if (ua.includes("mobile")) return "mobile";
  if (ua.includes("tablet")) return "tablet";
  return "pc";
}

function getClientIp(req) {
  const raw =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip;

  if (!raw) return null;
  if (raw === "::1") return null;

  // IPv4-mapped IPv6
  if (raw.startsWith("::ffff:")) {
    return raw.replace("::ffff:", "");
  }

  return raw;
}

/* ================================
   🟦 1) 방문 기록 저장
================================ */
router.post("/visit", async (req, res) => {
  try {
    const ip = getClientIp(req);
    const ua = req.headers["user-agent"] || "";
    const device = parseDevice(ua);
    const { page = "", referrer = "" } = req.body;

    if (!ip || !page) {
      return res.json({ message: "skipped", reason: "no_ip_or_page" });
    }

    // 국가
    let country = "UNKNOWN";
    const geo = geoip.lookup(ip);
    if (geo?.country) country = geo.country;

    // ✅ 하루 1회 (IP + page 기준)
    const [dedupe] = await db.execute(
      `INSERT IGNORE INTO traffic_dedupe (ip, page, view_date)
       VALUES (?, ?, CURDATE())`,
      [ip, page]
    );

    // 처음 방문이면 실제 로그 기록
    if (dedupe.affectedRows === 1) {
      await db.execute(
        `INSERT INTO traffic_logs
         (ip, user_agent, device_type, referrer, page, country)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [ip, ua, device, referrer, page, country]
      );
    }

    return res.json({
      ok: true,
      counted: dedupe.affectedRows === 1
    });

  } catch (err) {
    console.error("traffic visit error:", err);
    return res.status(500).json({ message: "error" });
  }
});



/* ================================
   🟦 0) UV / PV 요약 (대시보드용)
================================ */
router.get("/summary", verifyToken, canAccessDashboard, async (req, res) => {
  const [rows] = await db.execute(`
    SELECT
      -- UV
      COUNT(DISTINCT CASE WHEN DATE(created_at)=CURDATE() THEN ip END) AS uv_today,
      COUNT(DISTINCT CASE
        WHEN YEAR(created_at)=YEAR(CURDATE())
         AND MONTH(created_at)=MONTH(CURDATE())
        THEN ip END) AS uv_month,

      COUNT(DISTINCT CASE
        WHEN YEAR(created_at)=YEAR(CURDATE() - INTERVAL 1 MONTH)
         AND MONTH(created_at)=MONTH(CURDATE() - INTERVAL 1 MONTH)
        THEN ip END) AS uv_last_month,

      -- PV
      COUNT(CASE WHEN DATE(created_at)=CURDATE() THEN 1 END) AS pv_today,
      COUNT(CASE
        WHEN YEAR(created_at)=YEAR(CURDATE())
         AND MONTH(created_at)=MONTH(CURDATE())
        THEN 1 END) AS pv_month,

      COUNT(CASE
        WHEN YEAR(created_at)=YEAR(CURDATE() - INTERVAL 1 MONTH)
         AND MONTH(created_at)=MONTH(CURDATE() - INTERVAL 1 MONTH)
        THEN 1 END) AS pv_last_month
    FROM traffic_logs
  `);

  res.json(rows[0]);
});




/* ================================
   🟦 2) 일별 통계 (UV / PV, 기간 선택)
   GET /api/traffic/daily?days=30
   - PV: COUNT(*)
   - UV: COUNT(DISTINCT ip)
================================ */
router.get("/daily", async (req, res) => {
  try {
    const days = Math.max(1, Number(req.query.days || 30));

    const [rows] = await db.execute(
      `
      SELECT
        DATE(created_at) AS day,
        COUNT(*) AS pv,
        COUNT(DISTINCT ip) AS uv
      FROM traffic_logs
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY day DESC
      `,
      [days]
    );

    res.json(rows);
  } catch (err) {
    console.error("traffic daily error:", err);
    res.status(500).json({ message: "error" });
  }
});



/* ================================
   🟦 연도 목록
   GET /api/traffic/years
================================ */
router.get("/years", async (req, res) => {
  const [rows] = await db.execute(`
    SELECT DISTINCT YEAR(created_at) AS year
    FROM traffic_logs
    ORDER BY year DESC
  `);

  res.json(rows.map(r => r.year));
});


/* ================================
   🟦 3) 월별 통계 (연도 선택 가능)
   /api/traffic/monthly?year=2024
================================ */
router.get("/monthly", async (req, res) => {
  const { year } = req.query;

  let sql = `
    SELECT
      YEAR(created_at) AS year,
      MONTH(created_at) AS month,
      COUNT(*) AS visits
    FROM traffic_logs
  `;

  const params = [];

  if (year && year !== "all") {
    sql += ` WHERE YEAR(created_at) = ? `;
    params.push(year);
  }

  sql += `
    GROUP BY year, month
    ORDER BY year DESC, month DESC
  `;

  const [rows] = await db.execute(sql, params);
  res.json(rows);
});



/* ================================
   🟦 4) 페이지별 방문 수
================================ */
router.get("/page-view", async (req, res) => {
  const days = Number(req.query.days || 0);

  let where = `WHERE page IS NOT NULL AND page != ''`;

  if (days > 0) {
    where += ` AND created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)`;
  }

  const [rows] = await db.execute(`
    SELECT page, COUNT(*) AS views
    FROM traffic_logs
    ${where}
    GROUP BY page
    ORDER BY views DESC
    LIMIT 50
  `);

  res.json(rows);
});


/* ================================
   🟦 5) referrer 통계
================================ */
router.get("/referrer", async (req, res) => {
  const [rows] = await db.execute(`
    SELECT
      referrer,
      COUNT(*) AS cnt
    FROM traffic_logs
    WHERE referrer IS NOT NULL AND referrer != ''
    GROUP BY referrer
    ORDER BY cnt DESC
    LIMIT 50
  `);
  res.json(rows);
});

/* ================================
   🟦 6) device 통계
================================ */
router.get("/device", async (req, res) => {
  const [rows] = await db.execute(`
    SELECT
      device_type,
      COUNT(*) AS cnt
    FROM traffic_logs
    GROUP BY device_type
  `);
  res.json(rows);
});


/* ================================
   🟦 7) 국가별 통계 (기간 선택)
   ?days=30
================================ */
router.get("/country", async (req, res) => {
  const days = Number(req.query.days || 0);

  let sql = `
    SELECT
      country,
      COUNT(*) AS cnt
    FROM traffic_logs
  `;
  const params = [];

  if (days > 0) {
    sql += " WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)";
    params.push(days);
  }

  sql += `
    GROUP BY country
    ORDER BY cnt DESC
  `;

  const [rows] = await db.execute(sql, params);
  res.json(rows);
});


/* ================================
   🟦 8) 오래된 로그 정리 (🔥 중요)
   기본: 180일 초과 삭제
================================ */
router.delete("/cleanup", async (req, res) => {
  const days = Number(req.query.days || 180);

  const [result] = await db.execute(
    `DELETE FROM traffic_logs
     WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [days]
  );

  res.json({
    message: "cleanup done",
    deleted: result.affectedRows,
    days
  });
});

export default router;
