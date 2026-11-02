import multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(
      Object.assign(new Error('Use JPG, PNG or WebP'), { status: 400 }),
    );
  },
});
export = upload;
