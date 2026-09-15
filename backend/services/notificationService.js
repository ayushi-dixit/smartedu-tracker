const Notification = require('../models/Notification');
const UserPreference = require('../models/UserPreference');

/**
 * Fire-and-forget notification creation, like auditService — never throws
 * into the caller. Respects the recipient's notification preferences where
 * a relevant category exists (defaults to "on" if no preference is saved).
 */
async function notifyUser({ userId, type, title, message, relatedStudentId = null }) {
  if (!userId) return null;

  try {
    const pref = await UserPreference.findOne({ userId }).lean();
    if (pref) {
      const category =
        type === 'RISK_LEVEL_CHANGED' || type === 'STUDENT_HIGH_RISK_ALERT'
          ? 'riskChanges'
          : type === 'INTERVENTION_CREATED' || type === 'INTERVENTION_UPDATED'
            ? 'interventions'
            : type === 'FOLLOW_UP_DUE'
              ? 'followUps'
              : null;
      if (category && pref.notifications && pref.notifications[category] === false) {
        return null; // recipient opted out of this category
      }
    }

    return await Notification.create({ userId, type, title, message, relatedStudentId });
  } catch (err) {
    console.error('[notification] failed to create notification:', err.message);
    return null;
  }
}

module.exports = { notifyUser };
