const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const {
  uploadContent,
  getMyContent,
  getAllContent,
  getPendingContent,
  approveContent,
  rejectContent,
} = require('../controllers/content.controller');
const { getLiveContent } = require('../controllers/broadcast.controller');

// Public route — no auth required
router.get('/live/:teacherId', getLiveContent);

// Teacher routes
router.post('/upload', authenticate, authorize('teacher'), upload.single('file'), uploadContent);
router.get('/my', authenticate, authorize('teacher'), getMyContent);

// Principal routes
router.get('/all', authenticate, authorize('principal'), getAllContent);
router.get('/pending', authenticate, authorize('principal'), getPendingContent);
router.patch('/:id/approve', authenticate, authorize('principal'), approveContent);
router.patch('/:id/reject', authenticate, authorize('principal'), rejectContent);

module.exports = router;
