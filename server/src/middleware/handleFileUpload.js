const multer = require('multer');
const {BadRequestError} = require('../config/errors');

const upload = multer({
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new BadRequestError("Only image files are allowed"), false);
        }
        cb(null, true);
    }
}).single("chessboard");

const handleMulterUpload = (req, res, next) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return next(new BadRequestError("File is too large. Maximum size is 2MB"));
            }
            return next(new BadRequestError(err.message));
        } else if (err) {
            return next(err);
        }

        next();
    });
};

module.exports = handleMulterUpload;