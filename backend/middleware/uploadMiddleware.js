const multer = require('multer');

const storage = multer.memoryStorage();

function csvFileFilter(req, file, cb) {
  const isCsv = file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv');
  if (!isCsv) {
    return cb(new Error('Only .csv files are allowed.'));
  }
  return cb(null, true);
}

const uploadCsv = multer({
  storage,
  fileFilter: csvFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = { uploadCsv };
