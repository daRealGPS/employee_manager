const pool = require("../db");

const auditLog = async ({
  req,
  action,
  targetType,
  targetId = null,
  success = false,
  statusCode = 500,
  metadata = {},
  actorUserId = null,
  actorRole = null,
}) => {
  if (!req || !action) {
    console.error("auditLog called with missing parameters");
    return;
  }

  const requestId = req.requestId;
  const resolvedActorUserId = actorUserId ?? req.user?.userId ?? null;
  const resolvedActorRole = actorRole ?? req.user?.role ?? null;
  const ip = req.ip;
  const userAgent = req.headers["user-agent"] || null;

  let metadataJson = null;
  try {
    if (metadata && typeof metadata === "object") {
      const s = JSON.stringify(metadata);
      metadataJson = s.length <= 10_000 ? s : JSON.stringify({ error: "metadata_too_large" });
    }
  } catch {
    metadataJson = JSON.stringify({ error: "metadata_stringify_failed" });
  }

  try {
    await pool.query(
      `
      INSERT INTO audit_logs
        (request_id, actor_user_id, actor_role, action, target_type, target_id,
        success, status_code, ip, user_agent, metadata_json)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      `,
      [
        requestId,
        resolvedActorUserId,
        resolvedActorRole,
        action,
        targetType ?? null,
        targetId ?? null,
        success,
        statusCode,
        ip,
        userAgent,
        metadataJson,
      ]
    );
  } catch (err) {
    console.error("Failed to insert audit log:", err);
  }
};

module.exports = { auditLog };
