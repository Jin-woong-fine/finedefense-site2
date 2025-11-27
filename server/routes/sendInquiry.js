// server/routes/sendInquiry.js
import express from "express";
import db from "../config/db.js";   // 🔥 반드시 이걸로!
import nodemailer from "nodemailer";


const router = express.Router();

// ============================
// 📌 하이웍스 SMTP 설정
// ============================
const transporter = nodemailer.createTransport({
  host: "smtp.hiworks.com",
  port: 465,
  secure: true,
  auth: {
    user: "inquiry@finedefense.co.kr", // 문의용 메일 계정
    pass: "fine!202310"             // 하이웍스 SMTP 비밀번호
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

    // ===========================================
    // 🔵 1) 회사 메일로 문의 내용 보내기
    // ===========================================
    await transporter.sendMail({
      from: `"Fine Defense Inquiry" <inquiry@fine-defense.com>`,
      to: "inquiry@fine-defense.com",
      subject: subject || "새로운 1:1 문의",
      html: `
        <h3>새로운 1:1 문의 접수</h3>
        <p><b>이름:</b> ${name}</p>
        <p><b>이메일:</b> ${email}</p>
        <p><b>제목:</b> ${subject}</p>
        <p><b>내용:</b><br>${message.replace(/\n/g, "<br>")}</p>
        <hr>
        <p style="color:#888;font-size:12px;">Fine Defense 문의 시스템 자동 발송</p>
      `
    });

    // ===========================================
    // 🔵 2) 문의자에게 자동 안내 메일 보내기
    // ===========================================
    await transporter.sendMail({
      from: `"Fine Defense" <inquiry@finedefense.co.kr>`,
      to: email,
      subject: "[Fine Defense] 문의가 접수되었습니다",
      html: `
        <p>${name}님,</p>
        <p>문의해주셔서 감사합니다.</p>
        <p>담당자가 확인 후 빠르게 회신 드리겠습니다.</p>
        <br>
        <p style="color:#888;font-size:12px;">이 메일은 자동 발송되었습니다.</p>
      `
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("[Inquiry Error] ", err);
    return res.status(500).json({
      message: "문의 전송 중 오류가 발생했습니다."
    });
  }
});

export default router;
