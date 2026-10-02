const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");

const ALLOWED_MIME_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = ALLOWED_MIME_TYPES[file.mimetype] || "";
    cb(null, `${req.user.sub}-${crypto.randomUUID()}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES[file.mimetype]) {
    cb(new Error("Only JPEG, PNG, or WEBP images are allowed"));
    return;
  }
  cb(null, true);
}

const uploadPhoto = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const AppError = require("../utils/AppError");

function uploadPhotoSingle(req, res, next) {
  uploadPhoto.single("photo")(req, res, (err) => {
    if (err) {
      return next(new AppError(err.message, 400, "VALIDATION_ERROR"));
    }
    next();
  });
}

module.exports = { uploadPhoto, uploadPhotoSingle, UPLOAD_DIR };
