const mongoose = require('mongoose');

const userPreferenceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    density: { type: String, enum: ['comfortable', 'compact'], default: 'comfortable' },
    notifications: {
      riskChanges: { type: Boolean, default: true },
      interventions: { type: Boolean, default: true },
      followUps: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserPreference', userPreferenceSchema);
