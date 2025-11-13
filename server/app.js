import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import sendInquiryRouter from "./routes/sendInquiry.js";

const app = express();

// ✅ 경로 처리
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ 정적 폴더 제공
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/data", express.static(path.join(__dirname, "data")));

// ✅ 라우터 연결
app.use("/api", sendInquiryRouter);

// ✅ 서버 실행
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});



app.use(express.static(path.join(__dirname, "public")));
