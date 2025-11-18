import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import sendInquiryRouter from "./routes/sendInquiry.js";
import authRouter from "./routes/auth.js";
import adminRouter from "./routes/admin.js";
import postsRouter from "./routes/posts.js";
import productsRouter from "./routes/products.js";
import uploadsRouter from "./routes/uploads.js";
import loginLogsRouter from "./routes/login_logs.js";

// ⭐ 넣어야 하는 라우터
import adminDashboardRouter from "./routes/adminDashboard.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// ------------------------------------------------------
// 업로드 폴더 정적 제공
// ------------------------------------------------------
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));


// ------------------------------------------------------
// 🔥 API 라우터 등록
// ------------------------------------------------------
app.use("/api/auth", authRouter);
app.use("/api/inquiry", sendInquiryRouter);
app.use("/api/admin", adminRouter);
app.use("/api/admin", adminDashboardRouter);   // ⭐⭐ 반드시 있어야 함!
app.use("/api/posts", postsRouter);
app.use("/api/products", productsRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/logs/login", loginLogsRouter);


// ------------------------------------------------------
// 정적 페이지 제공
// ------------------------------------------------------
app.use(express.static(path.join(__dirname, "../")));


// ------------------------------------------------------
// 서버 실행
// ------------------------------------------------------
const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
