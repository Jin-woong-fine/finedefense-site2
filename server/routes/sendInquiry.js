import express from "express";
import multer from "multer";
import AWS from "aws-sdk";
import fs from "fs";
import path from "path";

const router = express.Router();

// ✅ 저장 경로 + 원본 파일명 유지
const storage = multer.diskStorage({
  destination: "uploads/inquiry_attachments/",
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^\w.-]/g, "_");
    cb(null, `${timestamp}_${safeName}`);
  }
});
const upload = multer({ storage });

// ✅ AWS SES 설정
AWS.config.update({ region: "ap-northeast-2" });
const ses = new AWS.SES();

// ✅ 문의 접수 API
router.post("/sendInquiry", upload.single("file"), async (req, res) => {
  try {
    const { name, email, subject, category, message } = req.body;
    const file = req.file;

    // ✅ 첨부파일 MIME 처리
    let attachmentPart = "";
    if (file) {
      const fileData = fs.readFileSync(file.path).toString("base64");
      const contentType = file.mimetype;

      attachmentPart = `
--NextPart
Content-Type: ${contentType}; name="${file.originalname}"
Content-Disposition: attachment; filename="${file.originalname}"
Content-Transfer-Encoding: base64

${fileData}
`;
    }

    // ✅ 메일 본문
    const emailBody = `
이름: ${name}<br>
이메일: ${email}<br>
문의유형: ${category}<br><br>
<strong>문의내용:</strong><br>
${message.replace(/\n/g, "<br>")}
`;

    const rawMail = [
      "From: 화인디펜스 문의센터 <no-reply@finedefense.co.kr>",
      "To: inquiry@finedefense.co.kr",
      `Subject: [문의접수] ${subject}`,
      "MIME-Version: 1.0",
      "Content-Type: multipart/mixed; boundary=\"NextPart\"",
      "",
      "--NextPart",
      "Content-Type: text/html; charset=UTF-8",
      "",
      emailBody,
      attachmentPart,
      "--NextPart--",
    ].join("\r\n");

    // ✅ AWS SES 발송
    await ses.sendRawEmail({ RawMessage: { Data: Buffer.from(rawMail) } }).promise();

    // ✅ 문의 내역 JSON 저장
    const DATA_FILE = path.join("data", "inquiries.json");
    const entry = {
      id: Date.now(),
      name,
      email,
      subject,
      category,
      message,
      file: file ? file.originalname : null,        // 원본명
      savedName: file ? path.basename(file.path) : null, // 실제 서버 파일명
      date: new Date().toISOString().slice(0, 10),
    };

    let data = [];
    if (fs.existsSync(DATA_FILE)) {
      data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }
    data.unshift(entry);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

    res.json({ success: true });
  } catch (err) {
    console.error("❌ 문의 전송 오류:", err);
    res.status(500).json({ success: false });
  }
});

export default router;
