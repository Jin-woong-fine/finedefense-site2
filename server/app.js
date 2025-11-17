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
// 🔥 app 선언은 최상단 import 아래에만 두어야 함
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
// 📁 업로드 폴더 static 제공
// ============================================================

app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// ============================================================
// 📌 API Routers 등록
// ============================================================

// 제품 관리 (파일 업로드 포함)
app.use("/api/products", productsRouter);

// 1:1 문의
app.use("/api/inquiry", sendInquiryRouter);

// 인증
app.use("/api/auth", authRouter);

// 관리자 통계/관리
app.use("/api/admin", adminRouter);

// 뉴스룸/게시물
app.use("/api/posts", postsRouter);

// ============================================================
// 🌐 정적 파일 제공 (홈페이지 HTML)
// ============================================================

app.use(express.static(path.join(__dirname, "../")));

// ============================================================
// 🚀 서버 실행
// ============================================================

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
