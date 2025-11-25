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

// 게시물 공통 / 뉴스
import postsCommonRouter from "./routes/posts_common.js";
import postsNewsRouter from "./routes/posts_news.js";

// 갤러리
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
//
// PM2 실행 폴더 = /home/ubuntu/finedefense_homepage/server
// 업로드 폴더 = /home/ubuntu/finedefense_homepage/server/uploads
//
// URL: http://서버/uploads/파일명
//
const UPLOAD_DIR = path.join(__dirname, "uploads");
console.log("📁 Upload Serve Path:", UPLOAD_DIR);

app.use("/uploads", express.static(UPLOAD_DIR));


// ============================
// 📌 API 라우터 등록
// ============================

// 인증
app.use("/api/auth", authRouter);

// 문의
app.use("/api/inquiry", sendInquiryRouter);

// 관리자
app.use("/api/admin", adminDashboardRouter);
app.use("/api/admin", adminRouter);

// 공통 게시물(공지/뉴스)
app.use("/api/posts", postsCommonRouter);

// 뉴스 CRUD
app.use("/api/news", postsNewsRouter);

// 갤러리 CRUD
app.use("/api/gallery", galleryRouter);

// 제품 관리
app.use("/api/products", productsRouter);

// Quill 이미지 업로드
app.use("/api/uploads", uploadsRouter);

// 로그인 기록
app.use("/api/logs/login", loginLogsRouter);

// 내 프로필
app.use("/api/users/me", userProfileRouter);

// 사용자 관리
app.use("/api/users", usersRouter);


// ============================
// 📌 정적 페이지 제공 (마지막)
// ============================
//
// frontend root = finededefense_homepage/
//
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
  console.log(`🚀 Fine Defense Server Running on http://0.0.0.0:${PORT}`);
});
