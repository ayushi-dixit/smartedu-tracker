const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    totalClasses: { type: Number, required: true, min: 1 },
    attendedClasses: { type: Number, required: true, min: 0 },
    attendancePercentage: { type: Number, required: true, min: 0, max: 100 },
    recordDate: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

attendanceSchema.index({ studentId: 1, subjectId: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
