const mongoose = require('mongoose');

const riskAssessmentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    attendancePercentage: { type: Number, required: true },
    attendanceRisk: { type: Number, required: true },
    academicAverage: { type: Number, required: true },
    academicRisk: { type: Number, required: true },
    assignmentCompletionPercentage: { type: Number, required: true },
    assignmentRisk: { type: Number, required: true },
    trendDelta: { type: Number, required: true },
    trendStatus: {
      type: String,
      enum: ['DECLINING', 'IMPROVING', 'STABLE', 'INSUFFICIENT_DATA'],
      required: true,
    },
    trendRisk: { type: Number, required: true },
    totalRiskScore: { type: Number, required: true },
    riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true },
    calculationVersion: { type: String, required: true, default: '1.0' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

riskAssessmentSchema.index({ studentId: 1, createdAt: -1 });

module.exports = mongoose.model('RiskAssessment', riskAssessmentSchema);
