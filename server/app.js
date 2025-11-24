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
import usersRouter from "./routes/users.js";   // 사용자 관리

// ✨ 게시물(Post) 구조 (신규 적용)
import postsCommonRouter from "./routes/posts_common.js"; // 조회/상세/목록
import postsNewsRouter from "./routes/posts_news.js";     // 뉴스 등록/수정/삭제


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
// 📌 업로드 폴더 정적 제공 — 반드시 최우선
// ============================
// serve: /uploads → server/public/uploads/*
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
app.use("/api/admin", adminDashboardRouter);  // 대시보드
app.use("/api/admin", adminRouter);           // 게시판/기본 관리

// 4) 게시물 (new 구조)
// 공통 조회 기능 (공지/뉴스/자료 모두)
app.use("/api/posts", postsCommonRouter);

// 뉴스 전용 (이미지 업로드 포함: create/edit/delete)
app.use("/api/news", postsNewsRouter);

// 5) 제품 관리
app.use("/api/products", productsRouter);

// 6) 공통 이미지 업로드 (Quill 포함)
app.use("/api/uploads", uploadsRouter);

// 7) 로그인 기록
app.use("/api/logs/login", loginLogsRouter);

// 8) 사용자 - 내 프로필
app.use("/api/users/me", userProfileRouter);

// 9) 사용자 관리 (목록/추가/수정/삭제)
app.use("/api/users", usersRouter);


// ============================
// 📌 정적 페이지 제공 — MUST BE LAST
// ============================
// server/../ → 프로젝트 전체 HTML/CSS/JS 제공
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
// 📌 서버 시작
// ============================
const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Fine Defense Server Running: http://0.0.0.0:${PORT}`);
});
