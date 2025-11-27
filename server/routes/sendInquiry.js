// server/routes/sendInquiry.js
import express from "express";
import db from "../config/db.js";   // 🔥 반드시 이걸로!
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
    user: process.env.HIWORKS_USER,
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

    // ===========================================
    // 🔵 1) DB 저장
    // ===========================================
    const [result] = await db.query(
      `
        INSERT INTO inquiry (name, email, subject, message, status)
        VALUES (?, ?, ?, ?, 0)
      `,
      [name, email, subject || null, message]
    );

    const insertedId = result.insertId;

    // ===========================================
    // 🔵 2) 회사 메일 발송
    // ===========================================
    await transporter.sendMail({
      from: `"Fine Defense Inquiry" <inquiry@finedefense.co.kr>`,
      to: "inquiry@finedefense.co.kr, jwpark@finedefense.co.kr",
      subject: subject || "새로운 1:1 문의",
      html: `
        <h3>새로운 1:1 문의 접수</h3>
        <p><b>번호:</b> ${insertedId}</p>
        <p><b>이름:</b> ${name}</p>
        <p><b>이메일:</b> ${email}</p>
        <p><b>제목:</b> ${subject}</p>
        <p><b>내용:</b><br>${message.replace(/\n/g, "<br>")}</p>
        <hr>
        <p style="color:#888;font-size:12px;">Fine Defense 문의 시스템 자동 발송</p>
      `
    });

    // ===========================================
    // 🔵 3) 문의자 자동회신
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

    return res.json({ success: true, id: insertedId });

  } catch (err) {
    console.error("[Inquiry Error] ", err);
    return res.status(500).json({
      message: "문의 전송 중 오류가 발생했습니다."
    });
  }
});

export default router;
