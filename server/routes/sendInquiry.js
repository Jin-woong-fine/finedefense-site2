// server/routes/sendInquiry.js
import express from "express";
import db from "../config/db.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

const transporter = nodemailer.createTransport({
  host: "smtp.hiworks.com",
  port: 587,
  secure: false, // ⭐ 중요
  auth: {
    user: process.env.HIWORKS_USER,
    pass: process.env.HIWORKS_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});


router.post("/send", async (req, res) => {
  try {
    const { name, email, subject, message, lang } = req.body;

    const LANG = lang === "en" ? "en" : "kr"; // 기본값 KR

    if (!name || !email || !message) {
      return res.status(400).json({ message: "필수 값 누락" });
    }

    // 🔵 DB 저장
    const [result] = await db.query(`
      INSERT INTO inquiry (name, email, subject, message, lang, status)
      VALUES (?, ?, ?, ?, ?, 0)
    `, [name, email, subject || null, message, LANG]);

    const id = result.insertId;

    // 🔵 메일 본문 다국어 지원
    const adminMailHTML = `
      <h3>New Inquiry Submitted (${LANG.toUpperCase()})</h3>
      <p><b>ID:</b> ${id}</p>
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Subject:</b> ${subject}</p>
      <p><b>Message:</b><br>${message.replace(/\n/g, "<br>")}</p>
    `;

    const userMailHTML_KR = `
      <p>${name}님,</p>
      <p>문의해주셔서 감사합니다.</p>
      <p>담당자가 확인 후 빠르게 회신 드리겠습니다.</p>
      <p style="color:#888;font-size:12px;">본 메일은 자동 발송되었습니다.</p>
    `;

    const userMailHTML_EN = `
      <p>Dear ${name},</p>
      <p>Thank you for contacting Fine Defense.</p>
      <p>Our team will review your inquiry and reply shortly.</p>
      <p style="color:#888;font-size:12px;">This email was sent automatically.</p>
    `;

    // 🔵 1) 관리자에게 메일
    await transporter.sendMail({
      from: `"Fine Defense Inquiry" <${process.env.HIWORKS_USER}>`,
      to: "inquiry@finedefense.co.kr, jwpark@finedefense.co.kr, finedefense@finedefense.co.kr, jawon814@finedefense.co.kr, kimsc@finedefense.co.kr, gwpark@finedefense.co.kr",
      subject: `[${LANG.toUpperCase()}] New Inquiry`,
      html: adminMailHTML
    });

    // 🔵 2) 고객 자동 회신 (언어 선택)
    await transporter.sendMail({
      from: `"Fine Defense" <${process.env.HIWORKS_USER}>`,
      to: email,
      subject: LANG === "en"
        ? "[Fine Defense] Your Inquiry Has Been Received"
        : "[Fine Defense] 문의가 접수되었습니다",
      html: LANG === "en" ? userMailHTML_EN : userMailHTML_KR
    });

    return res.json({ success: true, id });

  } catch (err) {
    console.error("[Inquiry Error] ", err);
    return res.status(500).json({ message: "문의 전송 중 오류" });
  }
});

export default router;
