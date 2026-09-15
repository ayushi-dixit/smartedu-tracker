const mongoose = require('mongoose');

const interventionSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
    riskAssessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'RiskAssessment', required: true },
    interventionType: {
      type: String,
      enum: [
        'ATTENDANCE_COUNSELLING',
        'ACADEMIC_COUNSELLING',
        'DOUBT_SESSION',
        'ASSIGNMENT_REMINDER',
        'STUDY_SUPPORT',
        'FACULTY_FOLLOW_UP',
        'OTHER',
      ],
      required: true,
    },
    reason: { type: String, required: true },
    actionTaken: { type: String, default: '' },
    status: { type: String, enum: ['PENDING', 'COMPLETED', 'NOT_COMPLETED'], default: 'PENDING' },
    interventionDate: { type: Date, required: true, default: Date.now },
    followUpDate: { type: Date, default: null },
    followUpNotes: { type: String, default: '' },
    outcome: {
      type: String,
      enum: ['IMPROVED', 'STABLE', 'WORSENED', 'PENDING_REVIEW'],
      default: 'PENDING_REVIEW',
    },
    previousRiskScore: { type: Number, required: true },
    newRiskScore: { type: Number, default: null },
  },
  { timestamps: true }
);

interventionSchema.index({ studentId: 1, createdAt: -1 });

module.exports = mongoose.model('Intervention', interventionSchema);
