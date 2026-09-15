const UserPreference = require('../models/UserPreference');
const { successResponse, asyncHandler } = require('../utils/helpers');

const DEFAULTS = { theme: 'system', density: 'comfortable', notifications: { riskChanges: true, interventions: true, followUps: true } };

const getPreferences = asyncHandler(async (req, res) => {
  let pref = await UserPreference.findOne({ userId: req.user._id });
  if (!pref) {
    pref = await UserPreference.create({ userId: req.user._id, ...DEFAULTS });
  }
  return successResponse(res, 200, 'Preferences retrieved', { preferences: pref });
});

const updatePreferences = asyncHandler(async (req, res) => {
  const { theme, density, notifications } = req.body;

  let pref = await UserPreference.findOne({ userId: req.user._id });
  if (!pref) pref = new UserPreference({ userId: req.user._id, ...DEFAULTS });

  if (theme !== undefined) pref.theme = theme;
  if (density !== undefined) pref.density = density;
  if (notifications !== undefined) {
    pref.notifications = { ...pref.notifications.toObject?.() || pref.notifications, ...notifications };
  }

  await pref.save();
  return successResponse(res, 200, 'Preferences updated', { preferences: pref });
});

const resetPreferences = asyncHandler(async (req, res) => {
  const pref = await UserPreference.findOneAndUpdate(
    { userId: req.user._id },
    { $set: DEFAULTS },
    { new: true, upsert: true }
  );
  return successResponse(res, 200, 'Preferences reset to defaults', { preferences: pref });
});

module.exports = { getPreferences, updatePreferences, resetPreferences };
