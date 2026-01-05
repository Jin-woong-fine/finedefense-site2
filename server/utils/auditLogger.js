import db from "../config/db.js";

const CONTENT_TYPE = Object.freeze({
  NOTICE: "NOTICE",
  NEWS: "NEWS",
  PRODUCT: "PRODUCT",
  GALLERY: "GALLERY",
  DOWNLOAD: "DOWNLOAD",
  CATALOG: "CATALOG",
  CERTIFICATE: "CERTIFICATE"
});

const ACTION = Object.freeze({
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE"
});

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
    `INSERT INTO content_audit_logs
     (content_type, content_id, action,
      actor_id, actor_name,
      before_data, after_data,
      ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      contentType,
      contentId,
      action,
      actor.id,
      actor.name,
      before ? JSON.stringify(before) : null,
      after ? JSON.stringify(after) : null,
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
