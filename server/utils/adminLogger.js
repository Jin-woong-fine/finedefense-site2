import db from "../config/db.js";
import requestIp from "request-ip";

export async function logAdminAction(req, action, detail="") {
  try {
    const ip = requestIp.getClientIp(req);
    const ua = req.headers["user-agent"] || "";
    const admin = req.user;  // verifyToken 후 저장됨

    if (!admin) return;

    await db.query(
      `INSERT INTO admin_logs (admin_id, action, detail, ip, ua)
       VALUES (?, ?, ?, ?, ?)`,
      [admin.id, action, detail, ip, ua]
    );

  } catch (err) {
    console.error("Admin log error:", err);
  }
}
