// server/routes/sendInquiry.js
import express from "express";
import db from "../config/db.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// ============================
// 📌 하이웍스 SMTP 설정
// ============================
const transporter = nodemailer.createTransport({
  host: "smtp.hiworks.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.HIWORKS_USER,   // 🔥 환경변수로 이동
    pass: process.env.HIWORKS_PASS
  }
});

// ============================
// 📌 POST /api/inquiry/send
// ============================
router.post("/send", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "필수 값 누락" });
    }

    // 회사 메일로 전달
    await transporter.sendMail({
      from: `"Fine Defense Inquiry" <${process.env.HIWORKS_USER}>`,
      to: process.env.HIWORKS_USER,
      subject: subject || "새로운 1:1 문의",
      html: `
        <h3>새로운 1:1 문의 접수</h3>
        <p><b>이름:</b> ${name}</p>
        <p><b>이메일:</b> ${email}</p>
        <p><b>제목:</b> ${subject}</p>
        <p><b>내용:</b><br>${message.replace(/\n/g, "<br>")}</p>
      `
    });

    // 문의자에게 자동 안내
    await transporter.sendMail({
      from: `"Fine Defense" <${process.env.HIWORKS_USER}>`,
      to: email,
      subject: "[Fine Defense] 문의가 접수되었습니다",
      html: `
        <p>${name}님, 문의가 접수되었습니다.</p>
        <p>담당자가 빠르게 확인 후 회신 드립니다.</p>
      `
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("[Inquiry Error] ", err);
    return res.status(500).json({ message: "문의 전송 중 오류 발생" });
  }
});

export default router;
