// server/app.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// ============================
// 📌 라우터 임포트
// ============================
import sendInquiryRouter from "./routes/sendInquiry.js";   // 고객 문의 (메일 + DB)
import inquiryRouter from "./routes/inquiry.js";           // 관리자용 문의 관리

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

// ============================
// 📌 경로 설정
// ============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 기본 미들웨어
app.use(cors());
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));

// ============================
// 📌 업로드 폴더 정적 제공
//    - 실제 파일 저장: server/public/uploads/...
//    - URL: /uploads/...
// ============================
app.use(
  "/uploads",
  express.static(path.join(__dirname, "public/uploads"))
);

// ============================
// 📌 API 라우터 등록
// ============================

// 로그인 / 권한
app.use("/api/auth", authRouter);

// 인증/특허
app.use("/api/cert-items", postsCertificationRouter);

// 관리자 대시보드 & 관리자 공통
app.use("/api/admin", adminDashboardRouter);
app.use("/api/admin", adminRouter);

// 뉴스 CRUD
app.use("/api/news", postsNewsRouter);

// 갤러리 CRUD
app.use("/api/gallery", postsGalleryRouter);

// 제품 CRUD
app.use("/api/products", productsRouter);

// 업로드 (이미지/파일 업로드용 공통)
app.use("/api/uploads", uploadsRouter);

// 로그인 기록
app.use("/api/logs/login", loginLogsRouter);

// 프로필
app.use("/api/users/me", userProfileRouter);

// 사용자 관리
app.use("/api/users", usersRouter);

// 관리자 문의 관리 API (리스트, 상태 변경, 메모 등)
app.use("/api/inquiry", inquiryRouter);

// 문의 (고객 → DB 저장 + 메일 발송)
app.use("/api/inquiry", sendInquiryRouter);

// 공지사항 전용 CRUD (첨부파일 포함)
//  - POST   /api/posts/notice/create
//  - PUT    /api/posts/notice/update/:id
//  - DELETE /api/posts/notice/delete/:id
//  - POST   /api/posts/notice/download
app.use("/api/posts/notice", postsNoticeRouter);

// 게시물 공통 조회 (공지/뉴스/갤러리)
//  - GET /api/posts/list/:category
//  - GET /api/posts/detail/:id
//  - POST /api/posts/view/:id
app.use("/api/posts", postsCommonRouter);

// ============================
// 📌 프론트엔드 정적 제공 — 마지막
// ============================
app.use(express.static(path.resolve(__dirname, "../")));

// ============================
// 📌 API 404
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
