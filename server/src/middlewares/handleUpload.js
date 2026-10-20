const upload = require('./getImage');
module.exports =
  (field, multiple = false) =>
  (req, res, next) => {
    const middleware = multiple
      ? upload.array(field, 10)
      : upload.single(field);
    middleware(req, res, (error) => {
      if (error)
        return res
          .status(400)
          .json({
            code: 'INVALID_UPLOAD',
            message: 'JPG/PNG/WebP, at most 10 files of 10 MB each',
          });
      return next();
    });
  };
