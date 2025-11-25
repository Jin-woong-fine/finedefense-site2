// server/app.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// ============================
// 📌 라우터 임포트
// ============================
import sendInquiryRouter from "./routes/sendInquiry.js";
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


// ============================
// 📌 기본 설정
// ============================
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));


// ============================
// 📌 업로드 폴더 정적 제공 (최우선)
// ============================
//
// ✔ 저장 위치: /home/ubuntu/finedefense_homepage/server/uploads
// ✔ URL 접근: http://서버주소/uploads/파일명
//
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))   // ★ 수정된 부분
);


// ============================
// 📌 API 라우터 등록
// ============================
app.use("/api/auth", authRouter);
app.use("/api/inquiry", sendInquiryRouter);
app.use("/api/admin", adminDashboardRouter);
app.use("/api/admin", adminRouter);
app.use("/api/posts", postsCommonRouter);
app.use("/api/news", postsNewsRouter);
app.use("/api/gallery", postsGalleryRouter);
app.use("/api/products", productsRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/logs/login", loginLogsRouter);
app.use("/api/users/me", userProfileRouter);
app.use("/api/users", usersRouter);


// ============================
// 📌 정적 페이지 제공 (마지막)
// ============================
app.use(express.static(path.resolve(__dirname, "../")));


// ============================
// 📌 API 404
// ============================
app.use("/api/*", (req, res) => {
  res.status(404).json({ message: "API not found" });
});


// ============================
// 📌 에러 핸들러
// ============================
app.use((err, req, res, next) => {
  console.error("🔥 서버 오류:", err);
  res.status(500).json({ message: "Server error" });
});


// ============================
// 📌 서버 시작
// ============================
const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Fine Defense Server Running: http://0.0.0.0:${PORT}`);
});
