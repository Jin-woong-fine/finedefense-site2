// server/app.js
import express from "express";
import rateLimit from "express-rate-limit";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// 라우터들
import sendInquiryRouter from "./routes/sendInquiry.js";
import inquiryRouter from "./routes/inquiry.js";

import authRouter from "./routes/auth.js";
import adminRouter from "./routes/admin.js";
import adminDashboardRouter from "./routes/adminDashboard.js";

import productsRouter from "./routes/products.js";
import uploadsRouter from "./routes/uploads.js";
import loginLogsRouter from "./routes/login_logs.js";
import userProfileRouter from "./routes/user_profile.js";
import usersRouter from "./routes/users.js";

import postsCommonRouter from "./routes/posts_common.js";
import postsNewsRouter from "./routes/posts_news.js";
import postsGalleryRouter from "./routes/posts_gallery.js";
import postsCertificationRouter from "./routes/posts_certification.js";
import postsNoticeRouter from "./routes/posts_notice.js";

import catalogRouter from "./routes/catalog.js";

import downloadsRouter from "./routes/downloads.js";

import uploadsEditorRouter from "./routes/uploads_editor.js";

import trafficRouter from "./routes/traffic.js";

import helmet from "helmet";



const app = express();

app.set("trust proxy", true);

// 경로 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 미들웨어
app.use(cors({
  origin: [
    "http://52.79.83.18",
    "https://www.finedefense.co.kr"
  ],
  credentials: true
}));
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.use(helmet());



// ------------------------------------------------------
// 📌 업로드 경로 (한글 파일명 깨짐 방지 헤더 포함)
// ------------------------------------------------------
app.use(
  "/uploads",
  express.static(path.join(__dirname, "public/uploads"), {
    setHeaders: (res) => {
      res.setHeader("Content-Type", "application/octet-stream; charset=utf-8");
    }
  })
);

// 🔐 관리자 IP 화이트리스트
const ADMIN_IPS = [

  "1.220.123.2", // 회사 공인 IP
  "125.251.61.201", // 공장 공인 IP
  "119.195.161.193",  // 개발자 집 IP
];

function adminIpGuard(req, res, next) {
  const ip = req.ip;

  if (!ADMIN_IPS.includes(ip)) {
    // 404로 위장 (관리자 API 존재 숨김)
    return res.status(404).json({ message: "Not Found" });
  }
  next();
}


const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 10,                 // 10회 제한
  standardHeaders: true,
  legacyHeaders: false
});




// ------------------------------------------------------
// 📌 라우터 등록
// ------------------------------------------------------
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth", authRouter);

app.use("/api/cert-items", postsCertificationRouter);

app.use("/api/admin", adminIpGuard, adminDashboardRouter);
app.use("/api/admin", adminIpGuard, adminRouter);

app.use("/api/news", postsNewsRouter);
app.use("/api/gallery", postsGalleryRouter);
app.use("/api/products", productsRouter);
app.use("/api/uploads", uploadsRouter);

app.use("/api/logs/login", loginLogsRouter);
app.use("/api/users/me", userProfileRouter);
app.use("/api/users", usersRouter);

app.use("/api/inquiry", inquiryRouter);
app.use("/api/inquiry", sendInquiryRouter);


app.use("/api/catalog", catalogRouter);


app.use("/api/uploads/editor", uploadsEditorRouter);

app.use("/api/downloads", downloadsRouter);

app.use("/api/traffic", trafficRouter);





// 🔥 중요! posts_common보다 notice 라우터가 항상 위에 있어야 함
app.use("/api/posts/notice", postsNoticeRouter);
app.use("/api/posts", postsCommonRouter);

// ------------------------------------------------------
// 📌 프론트 정적 제공
// ------------------------------------------------------
app.use(express.static(path.resolve(__dirname, "../")));

// ------------------------------------------------------
// 📌 API 404
// ------------------------------------------------------
app.use("/api/*", (req, res) => {
  res.status(404).json({ message: "API not found" });
});

// ------------------------------------------------------
// 📌 에러 핸들러
// ------------------------------------------------------
app.use((err, req, res, next) => {
  console.error("🔥 서버 오류:", err);
  res.status(500).json({ message: "Server error" });
});

// ------------------------------------------------------
// 📌 서버 시작
// ------------------------------------------------------
const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Fine Defense Server Running: http://0.0.0.0:${PORT}`);
});
