// server/routes/recruit_talent.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../config/db.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

console.log("🔥 recruit_talent.js ACTIVE");



// 🔴 여기부터 중요
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 👉 server/.env를 정확히 지정
dotenv.config({
  path: path.resolve(__dirname, "../.env")
});

const transporter = nodemailer.createTransport({
  host: "smtp.hiworks.com",
  port: 587,
  secure: false, // ⭐ 587에서는 false
  auth: {
    user: process.env.HIWORKS_USER,
    pass: process.env.HIWORKS_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});


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

      await db.execute(
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

      /* ===============================
         📧 메일 발송 (여기서!)
      =============================== */

      // 관리자 알림
      try {
        await transporter.sendMail({
          from: `"Fine Defense Recruit" <${process.env.HIWORKS_USER}>`,
      to: [
        "inquiry@finedefense.co.kr",
        "jwpark@finedefense.co.kr",
        "kimsc@finedefense.co.kr",
        "finedefense@finedefense.co.kr",
      ],
          subject: "[채용] 인재 DB 신규 등록",
          html: `
            <h3>인재 DB 신규 등록</h3>
            <p><b>이름:</b> ${name}</p>
            <p><b>이메일:</b> ${email}</p>
            <p><b>IP:</b> ${ip}</p>
            <p>
              이력서: ${resumePath ? "O" : "X"}<br>
              자기소개서: ${coverPath ? "O" : "X"}<br>
              포트폴리오: ${portfolioPath ? "O" : "X"}
            </p>
            <p>※ 파일은 관리자 페이지에서 확인하세요.</p>
          `
        });
      } catch (e) {
        console.error("관리자 메일 실패:", e);
      }

      // 지원자 자동 회신
      try {
        await transporter.sendMail({
          from: `"Fine Defense" <${process.env.HIWORKS_USER}>`,
          to: email,
          subject: "[Fine Defense] 인재 DB 등록이 완료되었습니다",
          html: `
            <p>${name}님 안녕하세요.</p>
            <p>Fine Defense 인재 DB에 정상적으로 등록되었습니다.</p>
            <p>
              등록해주신 정보는 향후 채용 진행 시 참고되며,<br>
              관련 법령에 따라 최대 12개월간 보관됩니다.
            </p>
            <p style="color:#888;font-size:12px;">
              본 메일은 자동 발송되었습니다.
            </p>
          `
        });
      } catch (e) {
        console.error("지원자 메일 실패:", e);
      }

      res.json({ message: "인재 DB 등록 완료" });

    } catch (err) {
      console.error("❌ 인재 DB 등록 오류:", err);
      res.status(500).json({ message: "등록 중 오류 발생" });
    }
  }
);



/* ============================================================
   🔐 인재 DB 목록 조회 (관리자)
============================================================ */
router.get("/talents", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        id,
        name,
        email,
        resume_path,
        created_at
      FROM recruit_talents
      ORDER BY created_at DESC
    `);

    res.json(rows);

  } catch (err) {
    console.error("❌ 인재 DB 조회 오류:", err);
    res.status(500).json({ message: "인재 DB 조회 실패" });
  }
});

/* ============================================================
   🔐 인재 DB 삭제 (관리자)
============================================================ */
router.delete("/talent/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [[talent]] = await db.execute(
      `
      SELECT
        resume_path,
        cover_path,
        portfolio_path
      FROM recruit_talents
      WHERE id = ?
      `,
      [id]
    );

    if (!talent) {
      return res.status(404).json({ message: "인재 정보 없음" });
    }

    // 📁 파일 삭제
    [talent.resume_path, talent.cover_path, talent.portfolio_path]
      .filter(Boolean)
      .forEach(file => {
        const filePath = path.join(UPLOAD_BASE, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });

    // 🗑 DB 삭제
    await db.execute(
      "DELETE FROM recruit_talents WHERE id = ?",
      [id]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("❌ 인재 DB 삭제 오류:", err);
    res.status(500).json({ message: "삭제 실패" });
  }
});


/* ============================================================
   🔐 인재 DB 상세 조회 (관리자)
============================================================ */
router.get("/talent/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [[talent]] = await db.execute(
      `
      SELECT
        id,
        name,
        email,
        message,
        resume_path,
        cover_path,
        portfolio_path,
        ip_address,
        created_at
      FROM recruit_talents
      WHERE id = ?
      `,
      [id]
    );

    if (!talent) {
      return res.status(404).json({ message: "인재 정보 없음" });
    }

    res.json(talent);

  } catch (err) {
    console.error("❌ 인재 DB 상세 조회 오류:", err);
    res.status(500).json({ message: "상세 조회 실패" });
  }
});


/* ============================================================
   🔐 인재 DB 첨부파일 다운로드 (관리자)
============================================================ */
router.get("/talent/file/:id/:type", async (req, res) => {
  const { id, type } = req.params;

  const fieldMap = {
    resume: "resume_path",
    cover: "cover_path",
    portfolio: "portfolio_path"
  };

  if (!fieldMap[type]) {
    return res.status(400).json({ message: "잘못된 파일 타입" });
  }

  try {
    const [[row]] = await db.execute(
      `SELECT ${fieldMap[type]} AS file FROM recruit_talents WHERE id = ?`,
      [id]
    );

    if (!row || !row.file) {
      return res.status(404).json({ message: "파일 없음" });
    }

    const filePath = path.join(UPLOAD_BASE, row.file);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "파일 누락" });
    }

    // 🔥 핵심 수정
    res.setHeader("Content-Disposition", "inline");
    res.sendFile(filePath);

  } catch (err) {
    console.error("❌ 파일 미리보기 오류:", err);
    res.status(500).json({ message: "파일 처리 실패" });
  }
});




export default router;
