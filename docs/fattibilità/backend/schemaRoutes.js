const express = require('express');
const multer = require('multer');
const { uploadSchema, searchSchemas } = require('../controllers/schemaController');

const router = express.Router();
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.post('/upload', upload.single('file'), uploadSchema);
router.get('/search', searchSchemas);

module.exports = router;