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
import userProfileRouter from "./routes/user_profile.js";
import usersRouter from "./routes/users.js";        // ⭐ 사용자 관리 라우터 추가

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
// 📌 업로드 폴더 정적 제공 — 반드시 제일 먼저
// ============================
// /uploads → server/public/uploads
app.use(
  "/uploads",
  express.static(path.resolve(__dirname, "public/uploads"))
);


// ============================
// 📌 API 라우터 등록
// ============================

// 1) 인증 / 로그인
app.use("/api/auth", authRouter);

// 2) 문의하기
app.use("/api/inquiry", sendInquiryRouter);

// 3) 관리자 기능

// ⭐ 대시보드 API — editor / viewer도 접근 가능
app.use("/api/admin", adminDashboardRouter);

// ⭐ admin 기능 — editor 또는 admin만 가능
app.use("/api/admin", adminRouter);

// 4) 뉴스룸
app.use("/api/posts", postsRouter);

// 5) 제품 관리
app.use("/api/products", productsRouter);

// 6) 공통 이미지 업로드 (Quill 등)
app.use("/api/uploads", uploadsRouter);

// 7) 로그인 로그
app.use("/api/logs/login", loginLogsRouter);

// 8) 사용자 프로필 (내 정보)
app.use("/api/users/me", userProfileRouter);

// 9) 사용자 관리(목록/추가/삭제/역할변경 등) ⭐ 반드시 추가해야 users.html 동작함
app.use("/api/users", usersRouter);


// ============================
// 📌 정적 페이지 제공 — MUST BE THE LAST
// ============================
// 프로젝트 루트 전체를 정적으로 제공 (html/css/js/img)
app.use(express.static(path.resolve(__dirname, "../")));


// ============================
// 📌 404 (API 전용)
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
