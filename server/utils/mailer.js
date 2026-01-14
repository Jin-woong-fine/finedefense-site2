import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.hiworks.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.HIWORKS_USER,
    pass: process.env.HIWORKS_PASS
  }
});

transporter.verify((err) => {
  if (err) {
    console.error("❌ SMTP 연결 실패:", err);
  } else {
    console.log("✅ SMTP 연결 성공");
  }
});

export default transporter;
