const mongoose = require('mongoose');

/**
 * Two kinds of notes, kept strictly separate per access rules:
 *  - STUDENT notes: personal/private notes, authorRole=STUDENT, studentId=null.
 *  - FACULTY notes: notes about a specific student, authorRole=FACULTY,
 *    studentId set. Never visible to the student the note is about —
 *    only to the authoring faculty member and admins (see noteController).
 */
const noteSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorRole: { type: String, enum: ['STUDENT', 'FACULTY'], required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
    title: { type: String, default: '' },
    content: { type: String, required: true },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

noteSchema.index({ authorId: 1, createdAt: -1 });
noteSchema.index({ studentId: 1 });

module.exports = mongoose.model('Note', noteSchema);
