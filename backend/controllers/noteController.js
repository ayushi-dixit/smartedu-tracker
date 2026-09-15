const Note = require('../models/Note');
const { successResponse, asyncHandler, ApiError } = require('../utils/helpers');
const { canAccessStudent } = require('./studentController');
const Student = require('../models/Student');

/**
 * Notes are strictly separated by author + role:
 *  - A STUDENT only ever sees/creates their own personal notes (studentId=null).
 *  - A FACULTY member only ever sees/creates their OWN notes about students
 *    they're assigned to. A student never sees faculty notes about them.
 *  - ADMIN can read (not write) faculty notes about a given student, for oversight.
 */
const listNotes = asyncHandler(async (req, res) => {
  const { studentId } = req.query;

  let query;
  if (req.user.role === 'STUDENT') {
    query = { authorId: req.user._id, authorRole: 'STUDENT' };
  } else if (req.user.role === 'FACULTY') {
    query = { authorId: req.user._id, authorRole: 'FACULTY' };
    if (studentId) query.studentId = studentId;
  } else if (req.user.role === 'ADMIN') {
    if (!studentId) throw new ApiError(422, 'studentId is required for admin note oversight.');
    query = { authorRole: 'FACULTY', studentId };
  }

  const notes = await Note.find(query).sort({ pinned: -1, updatedAt: -1 });
  return successResponse(res, 200, 'Notes retrieved', { notes, count: notes.length });
});

const createNote = asyncHandler(async (req, res) => {
  const { title, content, studentId, pinned } = req.body;
  if (!content || !content.trim()) throw new ApiError(422, 'content is required.');

  if (req.user.role === 'STUDENT') {
    const note = await Note.create({ authorId: req.user._id, authorRole: 'STUDENT', studentId: null, title: title || '', content, pinned: !!pinned });
    return successResponse(res, 201, 'Note created', { note });
  }

  if (req.user.role === 'FACULTY') {
    if (!studentId) throw new ApiError(422, 'studentId is required for a faculty note.');
    const student = await Student.findById(studentId);
    if (!student) throw new ApiError(404, 'Student not found.');
    if (!canAccessStudent(req, student)) throw new ApiError(403, 'Forbidden. Not your assigned student.');

    const note = await Note.create({ authorId: req.user._id, authorRole: 'FACULTY', studentId, title: title || '', content, pinned: !!pinned });
    return successResponse(res, 201, 'Note created', { note });
  }

  throw new ApiError(403, 'Admins cannot author notes.');
});

const updateNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) throw new ApiError(404, 'Note not found.');
  if (!note.authorId.equals(req.user._id)) throw new ApiError(403, 'Forbidden. You can only edit your own notes.');

  const { title, content, pinned } = req.body;
  if (title !== undefined) note.title = title;
  if (content !== undefined) note.content = content;
  if (pinned !== undefined) note.pinned = pinned;

  await note.save();
  return successResponse(res, 200, 'Note updated', { note });
});

const deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) throw new ApiError(404, 'Note not found.');
  if (!note.authorId.equals(req.user._id)) throw new ApiError(403, 'Forbidden. You can only delete your own notes.');

  await note.deleteOne();
  return successResponse(res, 200, 'Note deleted', { id: req.params.id });
});

module.exports = { listNotes, createNote, updateNote, deleteNote };
