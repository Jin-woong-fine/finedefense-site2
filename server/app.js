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
import postsRouter from "./routes/posts.js";
import productsRouter from "./routes/products.js";
import uploadsRouter from "./routes/uploads.js";
import loginLogsRouter from "./routes/login_logs.js";
import userProfileRouter from "./routes/user_profile.js";   // ⭐ 추가!!!

// ============================
// 📌 기본 설정
// ============================
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS 허용
app.use(cors());

// Body 파서
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));


// ============================
// 📌 업로드 폴더 정적 제공 ★ 수정됨
// ============================
app.use(
  "/uploads",
  express.static(path.resolve(__dirname, "public/uploads"))
);


// ============================
// 📌 API 라우터 등록
// ============================

// 인증 / 로그인
app.use("/api/auth", authRouter);

// 문의하기
app.use("/api/inquiry", sendInquiryRouter);

// 관리자 기능
app.use("/api/admin", adminRouter);
app.use("/api/admin", adminDashboardRouter);

// 뉴스룸 게시판
app.use("/api/posts", postsRouter);

// 제품 관리
app.use("/api/products", productsRouter);

// 업로드 공통 처리
app.use("/api/uploads", uploadsRouter);

// 로그인 로그
app.use("/api/logs/login", loginLogsRouter);

// ⭐ 사용자 프로필(Me) 기능
app.use("/api/users/me", userProfileRouter);


// ============================
// 📌 정적 페이지 제공 ★ 반드시 맨 마지막!
// ============================
app.use(express.static(path.resolve(__dirname, "../")));


// ============================
// 📌 404 핸들링 (API)
// ============================
app.use("/api/*", (req, res) => {
  res.status(404).json({ message: "API not found" });
});

// ============================
// 📌 전역 에러 핸들러
// ============================
app.use((err, req, res, next) => {
  console.error("🔥 서버 오류:", err);
  res.status(500).json({ message: "Server error" });
});

// ============================
// 📌 서버 실행
// ============================
const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Fine Defense Server Running: http://0.0.0.0:${PORT}`);
});
