// server/routes/downloads.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import db from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------------------------------------------
// 📁 업로드 루트 및 자료실 폴더
// ----------------------------------------------------
const UPLOAD_ROOT = path.join(__dirname, "../public/uploads");
const DOWNLOAD_DIR = path.join(UPLOAD_ROOT, "downloads");

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// 공개 URL(/uploads/...) -> 실제 디스크 경로로 변환
const toDiskPath = (publicPath) => {
  if (!publicPath) return null;
  const rel = publicPath.replace(/^\/+uploads\//, ""); // "downloads/xxx"
  return path.join(UPLOAD_ROOT, rel);
};

// ----------------------------------------------------
// 📁 Multer 설정 (다중 첨부파일 + 한글 파일명)
// ----------------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DOWNLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // 한글 파일명 깨짐 방지
    const utf8Name = Buffer.from(file.originalname, "latin1").toString("utf8");
    const unique = Date.now() + "_" + Math.round(Math.random() * 1e9);
    cb(null, `${unique}_${utf8Name}`);
  }
});

const uploadFiles = multer({ storage });

/* =========================================================
   🔧 헬퍼: 본문에서 첫 번째 이미지 src 추출 (썸네일용)
========================================================= */
function extractThumbFromContent(content) {
  if (!content) return null;
  const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

/* =========================================================
   📌 자료 등록
   POST /api/downloads/create
   - fields: title, content, lang, category, sort_order
   - files: files[]  (multiple)
========================================================= */
router.post(
  "/create",
  verifyToken,
  uploadFiles.array("files", 20),
  async (req, res) => {
    try {
      const {
        title,
        content = "",
        lang = "kr",
        category = "etc",
        sort_order
      } = req.body;

      if (!title) {
        return res.status(400).json({ message: "제목은 필수입니다." });
      }

      const files = req.files || [];
      if (!files.length) {
        return res.status(400).json({ message: "최소 1개 이상의 첨부파일이 필요합니다." });
      }

      const sortOrder = Number(sort_order || 9999);

      // 본문 첫 이미지로 썸네일 생성
      const thumbUrl = extractThumbFromContent(content);

      // 1) 메인 레코드 생성
      const [result] = await db.execute(
        `INSERT INTO downloads_items
           (title, content, lang, category, sort_order, thumb_url)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [title, content, lang, category, sortOrder, thumbUrl]
      );

      const itemId = result.insertId;

      // 2) 첨부파일 레코드 생성
      for (const f of files) {
        const utf8Original = Buffer.from(f.originalname, "latin1").toString("utf8");
        await db.execute(
          `INSERT INTO downloads_files
             (item_id, file_path, original_name, file_size)
           VALUES (?, ?, ?, ?)`,
          [itemId, `/uploads/downloads/${f.filename}`, utf8Original, f.size ?? 0]
        );
      }

      res.json({ message: "자료 등록 완료", id: itemId });
    } catch (err) {
      console.error("📌 자료 등록 오류:", err);
      res.status(500).json({ message: "자료 등록 오류" });
    }
  }
);

/* =========================================================
   📌 자료 목록
   GET /api/downloads/list?category=&lang=&search=
   - category: kr_catalog/en_catalog/company/etc/all
   - lang: kr/en/all
   - search: title like
========================================================= */
router.get("/list", async (req, res) => {
  try {
    const category = req.query.category || "all";
    const lang = req.query.lang || "all";
    const search = req.query.search || "";

    let sql = `
      SELECT i.*,
             (SELECT COUNT(*) FROM downloads_files f WHERE f.item_id = i.id) AS file_count,
             (SELECT IFNULL(SUM(f.file_size),0) FROM downloads_files f WHERE f.item_id = i.id) AS total_file_size
        FROM downloads_items i
       WHERE 1=1
    `;
    const params = [];

    if (category !== "all") {
      sql += ` AND i.category = ?`;
      params.push(category);
    }

    if (lang !== "all") {
      sql += ` AND i.lang = ?`;
      params.push(lang);
    }

    if (search) {
      sql += ` AND i.title LIKE ?`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY i.sort_order, i.created_at DESC`;

    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("📌 자료 목록 오류:", err);
    res.status(500).json({ message: "자료 목록 오류" });
  }
});

/* =========================================================
   📌 자료 상세
   GET /api/downloads/detail/:id
   - 본문 + 첨부파일 목록 같이 반환
========================================================= */
router.get("/detail/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "잘못된 ID" });

    const [items] = await db.execute(
      `SELECT * FROM downloads_items WHERE id = ?`,
      [id]
    );
    if (!items.length) {
      return res.status(404).json({ message: "자료를 찾을 수 없습니다." });
    }
    const item = items[0];

    const [files] = await db.execute(
      `SELECT id, file_path, original_name, file_size, created_at
         FROM downloads_files
        WHERE item_id = ?
        ORDER BY id`,
      [id]
    );

    item.files = files;

    res.json(item);
  } catch (err) {
    console.error("📌 자료 상세 오류:", err);
    res.status(500).json({ message: "자료 상세 오류" });
  }
});

/* =========================================================
   📌 자료 수정
   PUT /api/downloads/update/:id
   - fields: title, content, lang, category, sort_order, removeFileIds[]
   - files: files[] (새로 추가한 첨부파일들)
========================================================= */
router.put(
  "/update/:id",
  verifyToken,
  uploadFiles.array("files", 20),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ message: "잘못된 ID" });

      const {
        title,
        content = "",
        lang = "kr",
        category = "etc",
        sort_order
      } = req.body;

      if (!title) {
        return res.status(400).json({ message: "제목은 필수입니다." });
      }

      const sortOrder = Number(sort_order || 9999);
      const thumbUrl = extractThumbFromContent(content);

      // 1) 기본 정보 업데이트
      await db.execute(
        `UPDATE downloads_items
            SET title = ?,
                content = ?,
                lang = ?,
                category = ?,
                sort_order = ?,
                thumb_url = ?
          WHERE id = ?`,
        [title, content, lang, category, sortOrder, thumbUrl, id]
      );

      // 2) 삭제할 파일 처리 (removeFileIds: [1,2,3])
      let removeIds = [];
      try {
        removeIds = JSON.parse(req.body.removeFileIds || "[]");
      } catch {
        removeIds = [];
      }

      if (removeIds.length > 0) {
        // 삭제할 파일 경로 조회
        const placeholders = removeIds.map(() => "?").join(",");
        const [rows] = await db.execute(
          `SELECT file_path FROM downloads_files
            WHERE item_id = ? AND id IN (${placeholders})`,
          [id, ...removeIds]
        );

        // 디스크에서 삭제
        for (const f of rows) {
          const diskPath = toDiskPath(f.file_path);
          if (diskPath && fs.existsSync(diskPath)) {
            try {
              fs.unlinkSync(diskPath);
            } catch (e) {
              console.warn("파일 삭제 실패:", e.message);
            }
          }
        }

        // DB에서 삭제
        await db.execute(
          `DELETE FROM downloads_files
            WHERE item_id = ? AND id IN (${placeholders})`,
          [id, ...removeIds]
        );
      }

      // 3) 새로 추가된 첨부파일 저장
      const newFiles = req.files || [];
      for (const f of newFiles) {
        const utf8Original = Buffer.from(f.originalname, "latin1").toString("utf8");
        await db.execute(
          `INSERT INTO downloads_files
             (item_id, file_path, original_name, file_size)
           VALUES (?, ?, ?, ?)`,
          [id, `/uploads/downloads/${f.filename}`, utf8Original, f.size ?? 0]
        );
      }

      res.json({ message: "자료 수정 완료" });
    } catch (err) {
      console.error("📌 자료 수정 오류:", err);
      res.status(500).json({ message: "자료 수정 오류" });
    }
  }
);

/* =========================================================
   📌 자료 삭제
   DELETE /api/downloads/delete/:id
   - 본문 + 첨부파일 + 실제 파일까지 모두 삭제
========================================================= */
router.delete("/delete/:id", verifyToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "잘못된 ID" });

    // 1) 첨부파일 경로 조회
    const [files] = await db.execute(
      `SELECT file_path FROM downloads_files WHERE item_id = ?`,
      [id]
    );

    // 2) 디스크에서 삭제
    for (const f of files) {
      const diskPath = toDiskPath(f.file_path);
      if (diskPath && fs.existsSync(diskPath)) {
        try {
          fs.unlinkSync(diskPath);
        } catch (e) {
          console.warn("파일 삭제 실패:", e.message);
        }
      }
    }

    // 3) DB에서 첨부파일 / 본문 삭제
    await db.execute(`DELETE FROM downloads_files WHERE item_id = ?`, [id]);
    await db.execute(`DELETE FROM downloads_items WHERE id = ?`, [id]);

    res.json({ message: "자료 삭제 완료" });
  } catch (err) {
    console.error("📌 자료 삭제 오류:", err);
    res.status(500).json({ message: "자료 삭제 오류" });
  }
});

// ============================================================
// 📥 파일 다운로드 (download_count 증가 포함)
//    GET /api/downloads/get-file?id=파일ID
// ============================================================
router.get("/get-file", async (req, res) => {
  try {
    const fileId = Number(req.query.id);
    if (!fileId) return res.status(400).json({ message: "invalid file id" });

    // 1) 파일 정보 조회
    const [[file]] = await db.execute(
      `SELECT id, file_path, original_name, download_count
         FROM downloads_files
        WHERE id=?`,
      [fileId]
    );

    if (!file) {
      return res.status(404).json({ message: "file not found" });
    }

    // 2) 디스크 경로 변환
    const diskPath = toDiskPath(file.file_path);
    if (!diskPath || !fs.existsSync(diskPath)) {
      return res.status(404).json({ message: "file not found on disk" });
    }

    // 3) 다운로드 카운트 증가
    await db.execute(
      `UPDATE downloads_files 
          SET download_count = download_count + 1
        WHERE id=?`,
      [fileId]
    );

    // 4) 정확한 파일명으로 다운로드
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(file.original_name)}`
    );

    // 5) 파일 전송
    return res.download(diskPath);

  } catch (err) {
    console.error("📌 download error:", err);
    res.status(500).json({ message: "download error" });
  }
});


export default router;
