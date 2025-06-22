const multer = require('multer');

const uploadCloud = () => {
  const storage = multer.diskStorage({});

  const multerUpload = multer({ storage });

  return multerUpload;
};

module.exports = { uploadCloud };
