const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    assignmentTitle: { type: String, required: true, trim: true },
    maxScore: { type: Number, required: true, min: 1 },
    obtainedScore: { type: Number, min: 0, default: null },
    status: {
      type: String,
      enum: ['SUBMITTED_ON_TIME', 'SUBMITTED_LATE', 'NOT_SUBMITTED'],
      required: true,
      default: 'NOT_SUBMITTED',
    },
    dueDate: { type: Date, required: true },
    submissionDate: { type: Date, default: null },
  },
  { timestamps: true }
);

assignmentSchema.index({ studentId: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
