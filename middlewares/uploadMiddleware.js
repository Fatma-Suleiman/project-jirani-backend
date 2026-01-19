const multer = require('multer');
const path = require('path');

// Configure disk storage: files go into /uploads, named with a timestamp + original extension
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    //In folder  /backend/uploads
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});

// Create the multer instance
const upload = multer({ storage });

module.exports = upload;
