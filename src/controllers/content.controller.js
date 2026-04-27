const ContentService = require('../services/content.service');
const ApprovalService = require('../services/approval.service');

async function uploadContent(req, res, next) {
  try {
    const { title, description, subject, start_time, end_time, rotation_duration } = req.body;

    if (!title || !title.trim() || !subject || !subject.trim()) {
      return res.status(400).json({ success: false, message: 'title and subject are required' });
    }
    if (rotation_duration !== undefined && (isNaN(rotation_duration) || Number(rotation_duration) < 1)) {
      return res.status(400).json({ success: false, message: 'rotation_duration must be a positive number' });
    }

    const content = await ContentService.upload({
      title: title.trim(),
      description,
      subject: subject.trim(),
      file: req.file,
      uploaded_by: req.user.id,
      start_time,
      end_time,
      rotation_duration,
    });

    res.status(201).json({ success: true, message: 'Content uploaded and pending approval', data: content });
  } catch (err) {
    next(err);
  }
}

async function getMyContent(req, res, next) {
  try {
    const content = await ContentService.getMyContent(req.user.id);
    res.json({ success: true, data: content });
  } catch (err) {
    next(err);
  }
}

async function getAllContent(req, res, next) {
  try {
    const { status, subject, teacher_id } = req.query;
    const content = await ContentService.getAllContent({ status, subject, teacher_id });
    res.json({ success: true, data: content });
  } catch (err) {
    next(err);
  }
}

async function getPendingContent(_req, res, next) {
  try {
    const content = await ContentService.getAllContent({ status: 'pending' });
    res.json({ success: true, data: content });
  } catch (err) {
    next(err);
  }
}

async function approveContent(req, res, next) {
  try {
    const { id } = req.params;
    const content = await ApprovalService.approve(id, req.user.id);
    res.json({ success: true, message: 'Content approved', data: content });
  } catch (err) {
    next(err);
  }
}

async function rejectContent(req, res, next) {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason || !rejection_reason.trim()) {
      return res.status(400).json({ success: false, message: 'rejection_reason is required' });
    }

    const content = await ApprovalService.reject(id, req.user.id, rejection_reason);
    res.json({ success: true, message: 'Content rejected', data: content });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadContent, getMyContent, getAllContent, getPendingContent, approveContent, rejectContent };
