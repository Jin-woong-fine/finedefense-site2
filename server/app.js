import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Routers
import sendInquiryRouter from "./routes/sendInquiry.js";
import authRouter from "./routes/auth.js";
import adminRouter from "./routes/admin.js";
import postsRouter from "./routes/posts.js";

const app = express();

// 경로 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 uploads 정적 제공
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// 🔥 API 라우터 등록
app.use("/api/inquiry", sendInquiryRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);  // ← 여기 하나만!
app.use("/api/posts", postsRouter);

// public 정적 파일 제공 (항상 마지막!)
app.use(express.static(path.join(__dirname, "public")));

// 서버 실행
const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
});
