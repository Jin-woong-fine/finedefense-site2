// server/routes/recruit_talent.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../config/db.js";
import Audit from "../utils/auditLogger.js";

const router = express.Router();

/* ============================================================
   📁 업로드 경로 설정
============================================================ */
const UPLOAD_BASE = "/home/ubuntu/finedefense_uploads/recruit";

// 폴더 없으면 생성
if (!fs.existsSync(UPLOAD_BASE)) {
  fs.mkdirSync(UPLOAD_BASE, { recursive: true });
}

/* ============================================================
   📎 multer 설정
============================================================ */
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOAD_BASE);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const safeName =
      Date.now() + "_" + Math.random().toString(36).slice(2);
    cb(null, safeName + ext);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter(req, file, cb) {
    const allowed = [".pdf", ".jpg", ".jpeg", ".png"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowed.includes(ext)) {
      return cb(new Error("허용되지 않은 파일 형식"));
    }
    cb(null, true);
  }
});

/* ============================================================
   🔓 인재 DB 등록 (비로그인)
============================================================ */
router.post(
  "/apply",
  upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "cover", maxCount: 1 },
    { name: "portfolio", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { name, email, message } = req.body;

      if (!name || !email) {
        return res.status(400).json({ message: "필수 값 누락" });
      }

      if (!req.files?.resume) {
        return res.status(400).json({ message: "이력서는 필수입니다" });
      }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "이메일 형식 오류" });
    }

      const resumePath = req.files.resume[0].filename;
      const coverPath = req.files.cover?.[0]?.filename || null;
      const portfolioPath = req.files.portfolio?.[0]?.filename || null;

      const ip =
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        null;

      const [result] = await db.execute(
        `
        INSERT INTO recruit_talents
          (name, email, message,
           resume_path, cover_path, portfolio_path,
           ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          name,
          email,
          message || null,
          resumePath,
          coverPath,
          portfolioPath,
          ip
        ]
      );

      res.json({ message: "인재 DB 등록 완료" });

    } catch (err) {
      console.error("❌ 인재 DB 등록 오류:", err);
      res.status(500).json({ message: "등록 중 오류 발생" });
    }
  }
);

export default router;
