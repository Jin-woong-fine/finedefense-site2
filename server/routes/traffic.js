// server/routes/traffic.js
import express from "express";
import db from "../config/db.js";
import geoip from "geoip-lite";  // ⭐ 추가

const router = express.Router();

/* ================================
   🟦 공통 함수: 디바이스 식별
================================ */
function parseDevice(ua = "") {
  ua = ua.toLowerCase();
  if (ua.includes("mobile")) return "mobile";
  if (ua.includes("tablet")) return "tablet";
  return "pc";
}

/* ================================
   🟦 1) 방문 기록 저장
   POST /api/traffic/visit
================================ */
router.post("/visit", async (req, res) => {
  try {
    // 🔥 1) IP 가져오기 (Proxy 대비)
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.ip ||
      "unknown";

    const ua = req.headers["user-agent"] || "";
    const device = parseDevice(ua);

    const { page = "", referrer = "" } = req.body;

    // 🔥 2) 국가 자동 감지
    const geo = geoip.lookup(ip);
    const country = geo?.country || "UNKNOWN";

    // 🔥 3) DB 저장
    await db.execute(
      `INSERT INTO traffic_logs
       (ip, user_agent, device_type, referrer, page, country)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ip, ua, device, referrer, page, country]
    );

    res.json({ message: "logged", ip, country });
  } catch (err) {
    console.error("traffic visit error:", err);
    res.status(500).json({ message: "error" });
  }
});

/* ================================
   🟦 2) 일별 통계
================================ */
router.get("/daily", async (req, res) => {
  const [rows] = await db.execute(`
    SELECT 
      DATE(created_at) AS day,
      COUNT(*) AS visits
    FROM traffic_logs
    GROUP BY DATE(created_at)
    ORDER BY day DESC
    LIMIT 30
  `);

  res.json(rows);
});

/* ================================
   🟦 3) 월별 통계
================================ */
router.get("/monthly", async (req, res) => {
  const [rows] = await db.execute(`
    SELECT
      YEAR(created_at) AS year,
      MONTH(created_at) AS month,
      COUNT(*) AS visits
    FROM traffic_logs
    GROUP BY year, month
    ORDER BY year DESC, month DESC
    LIMIT 12
  `);

  res.json(rows);
});

/* ================================
   🟦 4) 페이지별 방문 수
================================ */
router.get("/page-view", async (req, res) => {
  const [rows] = await db.execute(`
    SELECT
      page,
      COUNT(*) AS views
    FROM traffic_logs
    WHERE page IS NOT NULL AND page != ''
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
   🟦 7) 국가별 통계
================================ */
router.get("/country", async (req, res) => {
  const [rows] = await db.execute(`
    SELECT
      country,
      COUNT(*) AS cnt
    FROM traffic_logs
    GROUP BY country
    ORDER BY cnt DESC
  `);

  res.json(rows);
});

export default router;
