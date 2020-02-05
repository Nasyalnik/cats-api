const multer = require('multer');
const {pathSaveFile} = require('./configs.js');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pathSaveFile);
  },
  filename: (req, file, cb) => {
    switch (file.mimetype) {
      case 'image/png': cb(null, `image-${Date.now()}.png`); break;
      case 'image/jpeg': cb(null, `image-${Date.now()}.jpg`); break;
      default: cb('Error: File upload only supports jpeg/png filetypes');
    }
  },
});
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = {
  upload,
};
