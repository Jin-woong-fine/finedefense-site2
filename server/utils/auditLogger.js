// server/utils/auditLogger.js
import db from "../config/db.js";

const CONTENT_TYPE = Object.freeze({
  NOTICE: "NOTICE",
  NEWS: "NEWS",
  PRODUCT: "PRODUCT",
  GALLERY: "GALLERY",
  DOWNLOAD: "DOWNLOAD",
  CATALOG: "CATALOG",
  CERTIFICATE: "CERTIFICATE",
  RECRUIT: "RECRUIT"
});

const ACTION = Object.freeze({
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE"
});

/* ============================================================
   📌 SAFE JSON CONVERTER
============================================================ */
function safeJson(data) {
  if (data === undefined || data === null) return null;
  if (typeof data === "string") return data;

  try {
    return JSON.stringify(data);
  } catch {
    return JSON.stringify({ error: "JSON_SERIALIZE_FAILED" });
  }
}

/* ============================================================
   📌 AUDIT LOG
============================================================ */
async function log({
  contentType,
  contentId,
  action,
  actor,
  before = null,
  after = null,
  req
}) {
  await db.execute(
    `
    INSERT INTO content_audit_logs
      (content_type, content_id, action,
       actor_id, actor_name,
       before_data, after_data,
       ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      contentType,
      contentId,
      action,
      actor?.id || null,
      actor?.name || null,
      safeJson(before),
      safeJson(after),
      req?.ip || null,
      req?.headers?.["user-agent"] || null
    ]
  );
}

export default {
  CONTENT_TYPE,
  ACTION,
  log
};
