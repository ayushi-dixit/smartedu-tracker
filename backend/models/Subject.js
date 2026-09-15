const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    subjectCode: { type: String, required: true, unique: true, trim: true },
    subjectName: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    credits: { type: Number, required: true, min: 1, max: 10 },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', default: null },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', subjectSchema);
