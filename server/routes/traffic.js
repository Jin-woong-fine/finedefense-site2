// server/routes/traffic.js
import express from "express";
import db from "../config/db.js";
import geoip from "geoip-lite";

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

    // 🚫 개발자 IP 제외 (⭐ 여기!)
    const DEV_IPS = [
      "119.195.161.193",
      "1.220.123.2",
      "125.251.61.201"
    ];

    function isPrivateIP(ip) {
      return (
        ip.startsWith("10.") ||
        ip.startsWith("192.168.") ||
        ip.startsWith("172.")
      );
    }

    if (DEV_IPS.includes(ip) || isPrivateIP(ip)) {
      return res.json({
        message: "internal skip",
        counted: false
      });
    }


    // 🇰🇷 국가 판별
    let country = "UNKNOWN";
    const geo = geoip.lookup(ip);
    if (geo?.country) country = geo.country;

    // 1️⃣ 오늘 이미 기록됐는지 체크 (INSERT 시도)
    const [dedupe] = await db.execute(
      `INSERT IGNORE INTO traffic_dedupe (ip, page, view_date)
       VALUES (?, ?, CURDATE())`,
      [ip, page]
    );

    // 2️⃣ 오늘 처음이면 → 실제 방문 기록
    if (dedupe.affectedRows === 1) {
      await db.execute(
        `INSERT INTO traffic_logs
         (ip, user_agent, device_type, referrer, page, country)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [ip, ua, device, referrer, page, country]
      );
    }

    res.json({
      message: "ok",
      counted: dedupe.affectedRows === 1,
      ip,
      country
    });

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
