import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Routers
import sendInquiryRouter from "./routes/sendInquiry.js";
import authRouter from "./routes/auth.js";
import adminRouter from "./routes/admin.js";
import postsRouter from "./routes/posts.js";
import productsRouter from "./routes/products.js";

// ============================================================
// 📌 기본 설정
// ============================================================

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// 🔧 공통 미들웨어
// ============================================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// 📁 업로드 이미지 static 경로 (절대 중요!)
// ============================================================
//
// /uploads/xxx → server/public/uploads/xxx 연결
//
// 예) 브라우저 요청
//   http://3.36.100.60/uploads/products/aaa.png
// 실제 파일:
//   server/public/uploads/products/aaa.png
//

app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// ============================================================
// 📌 API 라우터 등록
// ============================================================
//
// /api/products → 제품 관리 API (파일 업로드 포함)
// /api/inquiry  → 문의 처리
// /api/auth     → 로그인/토큰
// /api/admin    → 관리자 통계
// /api/posts    → 게시물/뉴스룸
//

app.use("/api/products", productsRouter);
app.use("/api/inquiry", sendInquiryRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/posts", postsRouter);

// ============================================================
// 🌐 정적 파일 제공 (홈페이지 + 관리자 페이지 HTML)
// ============================================================
//
// / → server/../ (= 프로젝트 루트 / 홈페이지 정적 HTML)
//
// 서버폴더 구조 기준
// server/
//   app.js
// ../ (프로젝트 루트)
//   kr/index.html
//   img/...
//

app.use(express.static(path.join(__dirname, "../")));

// ============================================================
// 🚀 서버 실행
// ============================================================

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
