import express from "express";
import db from "../config/db.js";
import { verifyToken, allowRoles } from "../middleware/auth.js";

const router = express.Router();

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
        before_data: r.before_data ? JSON.parse(r.before_data) : null,
        after_data: r.after_data ? JSON.parse(r.after_data) : null
      }));

      res.json(result);

    } catch (err) {
      console.error("[audit_logs] error:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

export default router;
