// server/app.js
import express from "express";
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

const app = express();

// 경로 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 미들웨어
app.use(cors());
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));

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

// ------------------------------------------------------
// 📌 라우터 등록
// ------------------------------------------------------
app.use("/api/auth", authRouter);

app.use("/api/cert-items", postsCertificationRouter);

app.use("/api/admin", adminDashboardRouter);
app.use("/api/admin", adminRouter);

app.use("/api/news", postsNewsRouter);
app.use("/api/gallery", postsGalleryRouter);
app.use("/api/products", productsRouter);
app.use("/api/uploads", uploadsRouter);

app.use("/api/logs/login", loginLogsRouter);
app.use("/api/users/me", userProfileRouter);
app.use("/api/users", usersRouter);

app.use("/api/inquiry", inquiryRouter);
app.use("/api/inquiry", sendInquiryRouter);

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
