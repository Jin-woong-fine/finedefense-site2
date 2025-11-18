import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";

dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ 정적 파일 서비스
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "../"))); // 루트 사이트 서빙

// ✅ 라우트 등록
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);

// =====================================
// ⭐ 반드시 외부 접근이 가능하도록 host 지정
// =====================================
app.listen(process.env.PORT, "0.0.0.0", () => {
  console.log(`✅ Fine Defense Portal Server running at http://0.0.0.0:${process.env.PORT}`);
});
