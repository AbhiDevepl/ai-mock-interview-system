import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

const uploadDir = "public";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Extract base filename to prevent path traversal vulnerability (e.g. ../../traversal.pdf)
    const safeOriginalName = path.basename(file.originalname);
    const filename = uuidv4() + "-" + safeOriginalName;
    cb(null, filename)
  }
})

export const upload = multer({
  storage,
  limits: {
    fileSize: 5*1024*1024
  }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Only accept PDF files
    if (
      file.mimetype === "application/pdf" &&
      file.originalname.toLowerCase().endsWith(".pdf")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
})
