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

// ✨ 게시물(Post) 구조
import postsCommonRouter from "./routes/posts_common.js";
import postsNewsRouter from "./routes/posts_news.js";

// ✨ 갤러리
import galleryRouter from "./routes/gallery.js";


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
// 결론: 모든 업로드는 /server/uploads 에 저장됨
// → URL 요청: /uploads/파일명
// → 실제 경로: server/uploads/파일명  ← 이 구조로 통일
app.use(
  "/uploads",
  express.static(path.resolve(__dirname, "uploads"))
);


// ============================
// 📌 API 라우터 등록
// ============================

// 1) 인증 / 로그인
app.use("/api/auth", authRouter);

// 2) 문의하기
app.use("/api/inquiry", sendInquiryRouter);

// 3) 관리자 기능
app.use("/api/admin", adminDashboardRouter);
app.use("/api/admin", adminRouter);

// 4) 게시물 공통 조회 (공지 · 뉴스)
app.use("/api/posts", postsCommonRouter);

// 5) 뉴스 CRUD
app.use("/api/news", postsNewsRouter);

// 6) 갤러리 CRUD ★ 추가됨
app.use("/api/gallery", galleryRouter);

// 7) 제품 관리
app.use("/api/products", productsRouter);

// 8) 공통 이미지 업로드(Quill 포함)
app.use("/api/uploads", uploadsRouter);

// 9) 로그인 기록
app.use("/api/logs/login", loginLogsRouter);

// 10) 사용자 - 내 프로필
app.use("/api/users/me", userProfileRouter);

// 11) 사용자 관리
app.use("/api/users", usersRouter);


// ============================
// 📌 정적 페이지 제공 — MUST BE LAST
// ============================
// "/server/../" → 프로젝트 최상위 전체 HTML 제공
app.use(express.static(path.resolve(__dirname, "../")));


// ============================
// 📌 API 404 처리
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
