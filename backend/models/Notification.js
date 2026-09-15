const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'RISK_LEVEL_CHANGED',
        'STUDENT_HIGH_RISK_ALERT',
        'INTERVENTION_CREATED',
        'INTERVENTION_UPDATED',
        'FOLLOW_UP_DUE',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedStudentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
