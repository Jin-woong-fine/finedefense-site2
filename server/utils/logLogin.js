import db from "../config/db.js";

export async function logLogin({
  user_id = null,
  username,
  ip,
  ua,
  status,
  fail_reason = null,
  is_admin = 0,
  ip_class,
  country_code,
  country
}) {
  try {
    await db.query(`
      INSERT INTO login_logs
      (user_id, username, ip, ua, status, fail_reason, is_admin, ip_class, country_code, country)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user_id,
      username,
      ip,
      ua,
      status,
      fail_reason,
      is_admin,
      ip_class,
      country_code,
      country
    ]);
  } catch (err) {
    console.error("Login log error:", err);
  }
}
