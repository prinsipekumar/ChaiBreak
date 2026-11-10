import fs from "fs";
import path from "path";
import multer from "multer";
import { NextFunction, Request, Response } from "express";

// Backend/uploads  (this file lives in Backend/src/middlewares)
export const UPLOAD_ROOT = path.join(__dirname, "..", "..", "uploads");
const ITEM_PHOTO_DIR = path.join(UPLOAD_ROOT, "items");
fs.mkdirSync(ITEM_PHOTO_DIR, { recursive: true });

const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME = ["image/jpeg", "image/png"];
const ALLOWED_EXT = [".jpg", ".jpeg", ".png"];

class UploadError extends Error {}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, ITEM_PHOTO_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `item-${req.params.id}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: MAX_PHOTO_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIME.includes(file.mimetype) || !ALLOWED_EXT.includes(ext)) {
      cb(new UploadError("Only JPG or PNG images are allowed."));
      return;
    }
    cb(null, true);
  },
});

// Wraps multer so its errors come back in the app's { success, message } shape.
export const uploadItemPhoto = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  upload.single("photo")(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      res
        .status(400)
        .json({ success: false, message: "Photo must be 2 MB or smaller." });
      return;
    }

    if (err instanceof UploadError) {
      res.status(400).json({ success: false, message: err.message });
      return;
    }

    if (err instanceof multer.MulterError) {
      res.status(400).json({
        success: false,
        message: "Upload failed. Send one JPG or PNG in the 'photo' field.",
      });
      return;
    }

    console.error("Upload error:", err);
    res.status(500).json({ success: false, message: "Upload failed." });
  });
};  