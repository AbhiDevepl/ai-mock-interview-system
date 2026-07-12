import multer from "multer";
import { v4 as uuidv4 } from "uuid";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public")
  },
  filename: function (req, file, cb) {
    const filename = uuidv4() + "-" + file.originalname;
    cb(null, filename)
  }
})

export const upload = multer({
  storage,
  limits: {
    fileSize: 5*1024*1024
  }, // 5MB limit
})