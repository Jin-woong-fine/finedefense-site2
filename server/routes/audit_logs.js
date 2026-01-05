// server/routes/audit_logs.js
import express from "express";
import db from "../config/db.js";
import { verifyToken, allowRoles } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/audit/logs
 * query:
 *  - search (optional)
 *  - action (optional)
 */
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

      // ✅ action 필터
      if (action) {
        sql += ` AND a.action = ?`;
        params.push(action);
      }

      // ✅ search 필터 (actor_name / content_type)
      if (search) {
        sql += `
          AND (
            a.actor_name LIKE ?
            OR a.content_type LIKE ?
          )
        `;
        params.push(`%${search}%`, `%${search}%`);
      }

      // ✅ 정렬은 항상 마지막
      sql += `
        ORDER BY a.id DESC
        LIMIT 500
      `;

      const [rows] = await db.execute(sql, params);

      // JSON 파싱
      const result = rows.map(r => ({
        ...r,
        before_data: r.before_data ? JSON.parse(r.before_data) : null,
        after_data: r.after_data ? JSON.parse(r.after_data) : null
      }));

      res.json(result);

    } catch (err) {
      console.error("[audit_logs] error:", err);
      res.status(500).json({ message: "audit logs error" });
    }
  }
);

export default router;
