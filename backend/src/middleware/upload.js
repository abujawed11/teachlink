const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const sharp = require("sharp");

const AppError = require("../utils/AppError");

// Overridable so automated tests don't write into the real uploads folder.
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "..", "..", "uploads");

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
// Profile photos are shown small; nothing needs more than this, and it keeps files light.
const MAX_PHOTO_DIMENSION = 800;
// Rejects "decompression bombs": tiny files that expand to enormous images in memory.
const MAX_INPUT_PIXELS = 40_000_000;
const ALLOWED_FORMATS = ["jpeg", "png", "webp"];

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Held in memory (5 MB max) so the image can be validated and re-encoded before anything
// is written to disk.
const uploadPhoto = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new Error("Only JPEG, PNG, or WEBP images are allowed"));
      return;
    }
    cb(null, true);
  },
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
});

// Never trusts the client's Content-Type: sharp must be able to decode the actual bytes as one
// of the allowed formats. The image is then re-encoded as WebP, which drops all metadata —
// phone photos routinely carry the GPS location of where they were taken.
async function processPhoto(req, res, next) {
  if (!req.file) return next();

  try {
    const image = sharp(req.file.buffer, { limitInputPixels: MAX_INPUT_PIXELS });
    const { format } = await image.metadata();
    if (!ALLOWED_FORMATS.includes(format)) {
      throw new Error(`Unsupported image format: ${format}`);
    }

    const filename = `${req.user.sub}-${crypto.randomUUID()}.webp`;
    await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
    await image
      .rotate() // apply the EXIF orientation first, since it is about to be removed
      .resize({
        width: MAX_PHOTO_DIMENSION,
        height: MAX_PHOTO_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toFile(path.join(UPLOAD_DIR, filename));

    req.file.filename = filename;
    req.file.buffer = undefined;
    next();
  } catch {
    next(new AppError("That file isn't a valid JPEG, PNG or WEBP image", 400, "VALIDATION_ERROR"));
  }
}

function describeUploadError(err) {
  if (err.code === "LIMIT_FILE_SIZE") return "Photo must be 5 MB or smaller";
  if (err.code === "LIMIT_UNEXPECTED_FILE") return 'Upload a single file in the "photo" field';
  return err.message;
}

function uploadPhotoSingle(req, res, next) {
  uploadPhoto.single("photo")(req, res, (err) => {
    if (err) {
      return next(new AppError(describeUploadError(err), 400, "VALIDATION_ERROR"));
    }
    processPhoto(req, res, next);
  });
}

module.exports = { uploadPhoto, uploadPhotoSingle, UPLOAD_DIR };
