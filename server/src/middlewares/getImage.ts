import multer = require('multer');
import AppError = require('../utils/appError');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(
      new AppError(400, 'INVALID_UPLOAD', 'Use JPG, PNG or WebP'),
    );
  },
});
export = upload;
