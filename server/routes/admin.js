// server/routes/admin.js
import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { verifyToken } from "../middleware/auth.js";
import db from "../config/db.js";

const router = express.Router();

/* ============================================================
   📂 자료실 업로드
============================================================ */
const upload = multer({ dest: "server/uploads/downloads/" });

router.post(
  "/upload-download",
  verifyToken,
  upload.single("file"),
  async (req, res) => {
    try {
      const { lang, title, desc, date } = req.body;

      const filePath = `/uploads/downloads/${req.file.filename}_${req.file.originalname}`;
      const jsonFile = path.join("data", `downloads_${lang}.json`);

      const newItem = { title, desc, date, file: filePath };

      let data = [];
      if (fs.existsSync(jsonFile)) {
        data = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
      }

      data.unshift(newItem);
      fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2));

      res.json({ success: true });
    } catch (err) {
      console.error("자료실 업로드 오류:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

export default router;
