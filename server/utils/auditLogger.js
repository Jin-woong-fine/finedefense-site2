const db = require("../db");

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
  if (!contentType || !contentId || !action || !actor) {
    throw new Error("audit log missing required field");
  }

  await db.query(
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

module.exports = {
  CONTENT_TYPE,
  ACTION,
  log
};
