const AuditLog = require('../models/AuditLog');

/** Fire-and-forget audit trail write. Never throws into the caller. */
async function logAction({ userId = null, action, targetType = '', targetId = null, metadata = {} }) {
  try {
    await AuditLog.create({ userId, action, targetType, targetId, metadata });
  } catch (err) {
    console.error('[audit] failed to write audit log:', err.message);
  }
}

module.exports = { logAction };
