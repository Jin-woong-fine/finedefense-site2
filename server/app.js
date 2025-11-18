import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// 🔥 라우터들 불러오기
import sendInquiryRouter from "./routes/sendInquiry.js";
import authRouter from "./routes/auth.js";
import adminRouter from "./routes/admin.js";
import postsRouter from "./routes/posts.js";
import productsRouter from "./routes/products.js";
import uploadsRouter from "./routes/uploads.js";   // ⭐️ Toast Editor 전용 업로드

// ------------------------------------------------------
// 기본 설정
// ------------------------------------------------------

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------------------------------------------
// 공통 미들웨어
// ------------------------------------------------------

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));


// ------------------------------------------------------
// 🔥 업로드 이미지 정적 제공
// ------------------------------------------------------
//
// URL:   https://domain/uploads/products/aaa.png
// 실제:  server/public/uploads/products/aaa.png
//
// URL:   https://domain/uploads/editor/bb.png
// 실제:  server/public/uploads/editor/bb.png
//
app.use(
  "/uploads",
  express.static(path.join(__dirname, "public", "uploads"))
);

// ------------------------------------------------------
// 📌 API 라우터
// ------------------------------------------------------

app.use("/api/products", productsRouter); // 제품
app.use("/api/inquiry", sendInquiryRouter); // 1:1 문의
app.use("/api/auth", authRouter); // 로그인
app.use("/api/admin", adminRouter); // 관리자
app.use("/api/posts", postsRouter); // 뉴스룸
app.use("/api/uploads", uploadsRouter); // ⭐️ Toast Editor 이미지 업로드 API

// ------------------------------------------------------
// 🌐 정적 파일 (홈페이지 배포용)
// ------------------------------------------------------
//
// /kr/index.html, /en/index.html ... 전부 여기서 서비스됨.
//
app.use(express.static(path.join(__dirname, "../")));

// ------------------------------------------------------
// 서버 실행
// ------------------------------------------------------

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});





