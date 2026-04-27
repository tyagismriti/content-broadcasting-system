const SchedulingService = require('../services/scheduling.service');
const UserModel = require('../models/user.model');

async function getLiveContent(req, res, next) {
  try {
    const { teacherId } = req.params;
    const { subject } = req.query;

    // Validate teacher exists and is actually a teacher
    const teacher = await UserModel.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.json({ success: true, message: 'No content available', data: [] });
    }

    const content = await SchedulingService.getLiveContentBySubject(teacherId, subject);

    if (!content.length) {
      return res.json({ success: true, message: 'No content available', data: [] });
    }

    res.json({ success: true, data: content });
  } catch (err) {
    next(err);
  }
}

module.exports = { getLiveContent };
