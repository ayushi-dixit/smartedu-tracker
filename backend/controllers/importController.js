const { successResponse, asyncHandler, ApiError } = require('../utils/helpers');
const { importStudentsCsv } = require('../services/csvService');
const { logAction } = require('../services/auditService');

/** Faculty/admin only. multer (uploadCsv) puts the file on req.file. */
const importStudents = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(422, 'No CSV file uploaded. Use the "file" field.');

  const summary = await importStudentsCsv({ csvBuffer: req.file.buffer, facultyDoc: req.profile || null });

  await logAction({
    userId: req.user._id,
    action: 'CSV_IMPORTED',
    targetType: 'Student',
    metadata: { totalRows: summary.totalRows, successful: summary.successful, failed: summary.failed },
  });

  return successResponse(res, 200, 'CSV import processed', summary);
});

module.exports = { importStudents };
