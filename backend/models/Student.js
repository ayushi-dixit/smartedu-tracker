const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    studentId: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    course: { type: String, required: true, default: 'MCA' },
    semester: { type: Number, required: true, min: 1, max: 8 },
    section: { type: String, default: '' },
    enrollmentYear: { type: Number },
    previousSemesterAverage: { type: Number, min: 0, max: 100, default: null },
    facultyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' }],
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);
