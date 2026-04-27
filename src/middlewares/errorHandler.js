const multer = require('multer');

function errorHandler(err, req, res, _next) {
  // Multer-specific errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large. Maximum size is 10MB' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }

  // File type rejection from fileFilter
  if (err.message && err.message.includes('Only JPG')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  const status = err.status || 500;
  const message = status < 500 ? err.message : 'Internal server error';

  if (status === 500) console.error(err);

  res.status(status).json({ success: false, message });
}

module.exports = errorHandler;
