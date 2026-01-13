import express from "express";
import db from "../config/db.js";
import { verifyToken, allowRoles } from "../middleware/auth.js";

const router = express.Router();

function safeParse(v) {
  if (!v) return null;
  if (typeof v === "object") return v;

  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}



/* ✅ 절대 죽지 않는 JSON 파서 */
const safeParse = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
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
        sql += `
          AND (
            a.actor_name LIKE ?
            OR a.content_type LIKE ?
          )
        `;
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
