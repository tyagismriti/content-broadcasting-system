const ContentModel = require('../models/content.model');
const SlotModel = require('../models/slot.model');
const path = require('path');

const ContentService = {
  async upload({ title, description, subject, file, uploaded_by, start_time, end_time, rotation_duration }) {
    if (!file) {
      const err = new Error('File is required');
      err.status = 400;
      throw err;
    }

    const file_url = `/uploads/${file.filename}`;
    const file_path = file.path;
    const file_type = path.extname(file.originalname).replace('.', '').toLowerCase();
    const file_size = file.size;

    const content = await ContentModel.create({
      title,
      description,
      subject: subject.trim().toLowerCase(),
      file_path,
      file_url,
      file_type,
      file_size,
      uploaded_by,
      start_time: start_time || null,
      end_time: end_time || null,
      rotation_duration: rotation_duration ? parseInt(rotation_duration) : 5,
    });

    // Register in slot/schedule tables for rotation
    const slot = await SlotModel.findOrCreateBySubject(subject.toLowerCase());
    const rotation_order = await SlotModel.getNextRotationOrder(slot.id);
    await SlotModel.createSchedule({
      content_id: content.id,
      slot_id: slot.id,
      rotation_order,
      duration: content.rotation_duration,
    });

    return content;
  },

  async getMyContent(teacher_id) {
    return ContentModel.findByTeacher(teacher_id);
  },

  async getAllContent(filters = {}) {
    return ContentModel.findAll(filters);
  },
};

module.exports = ContentService;
