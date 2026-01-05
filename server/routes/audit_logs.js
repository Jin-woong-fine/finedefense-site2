import express from "express";
import db from "../config/db.js";
import { verifyToken, allowRoles } from "../middleware/auth.js";

const router = express.Router();

const safeParse = (value) => {
  if (!value) return null;

  // 이미 object면 그대로 사용
  if (typeof value === "object") return value;

  // string이면 JSON 시도
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null; // ❗ 여기서 죽지 않게 막는 게 핵심
    }
  }

  return null;
};


router.get(
  "/logs",
  verifyToken,
  allowRoles("admin", "superadmin"),
  async (req, res) => {
    try {
      const { search = "", action = "" } = req.query;

      let sql = `
        SELECT
          a.id,
          a.content_type,
          a.content_id,
          a.action,
          a.before_data,
          a.after_data,
          a.ip_address AS ip,
          a.created_at,
          a.actor_name
        FROM content_audit_logs a
        WHERE 1=1
      `;
      const params = [];

      if (action) {
        sql += ` AND a.action = ?`;
        params.push(action);
      }

      if (search) {
        sql += ` AND (
          a.actor_name LIKE ?
          OR a.content_type LIKE ?
        )`;
        params.push(`%${search}%`, `%${search}%`);
      }

      sql += ` ORDER BY a.id DESC LIMIT 500`;

      const [rows] = await db.execute(sql, params);

        const result = rows.map(r => ({
        ...r,
        before_data: safeParse(r.before_data),
        after_data: safeParse(r.after_data)
        }));


      res.json(result);

    } catch (err) {
      console.error("[audit_logs] error:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

export default router;
