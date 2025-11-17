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

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS
app.use(cors());

// 🔥 1) uploads static 먼저
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🔥 2) 파일 업로드 라우트 (multer 사용)
app.use("/api/products", productsRouter);

// 🔥 3) 그 다음 JSON parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 4) 나머지 라우트
app.use("/api/inquiry", sendInquiryRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/posts", postsRouter);

// 5) Static HTML
app.use(express.static(path.join(__dirname, "../")));

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
