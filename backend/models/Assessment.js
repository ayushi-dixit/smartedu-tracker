const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    assessmentType: {
      type: String,
      enum: ['INTERNAL_1', 'INTERNAL_2', 'INTERNAL_3', 'QUIZ', 'MID_TERM', 'PRACTICAL'],
      required: true,
    },
    marksObtained: { type: Number, required: true, min: 0 },
    maxMarks: { type: Number, required: true, min: 1 },
    assessmentDate: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

assessmentSchema.index({ studentId: 1, assessmentDate: 1 });

module.exports = mongoose.model('Assessment', assessmentSchema);
