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

// ====================================
//  경로 처리
// ====================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====================================
//  미들웨어
// ====================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====================================
//  정적 파일 제공
// ====================================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/data", express.static(path.join(__dirname, "data")));
app.use(express.static(path.join(__dirname, "public"))); // ← 이게 가장 아래로 가야 했던 문제 해결

// ====================================
//  라우터 연결
// ====================================
app.use("/api/inquiry", sendInquiryRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/posts", postsRouter);

// ====================================
//  서버 실행
// ====================================
const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
});

