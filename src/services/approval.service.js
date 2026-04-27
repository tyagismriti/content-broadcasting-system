const ContentModel = require('../models/content.model');

const ApprovalService = {
  async approve(content_id, principal_id) {
    const content = await ContentModel.findById(content_id);
    if (!content) {
      const err = new Error('Content not found');
      err.status = 404;
      throw err;
    }
    if (content.status === 'approved') {
      const err = new Error('Content is already approved');
      err.status = 409;
      throw err;
    }

    return ContentModel.updateStatus(content_id, {
      status: 'approved',
      approved_by: principal_id,
      approved_at: new Date(),
      rejection_reason: null,
    });
  },

  async reject(content_id, principal_id, rejection_reason) {
    const content = await ContentModel.findById(content_id);
    if (!content) {
      const err = new Error('Content not found');
      err.status = 404;
      throw err;
    }
    if (content.status === 'rejected') {
      const err = new Error('Content is already rejected');
      err.status = 409;
      throw err;
    }

    return ContentModel.updateStatus(content_id, {
      status: 'rejected',
      approved_by: principal_id,
      approved_at: new Date(),
      rejection_reason,
    });
  },
};

module.exports = ApprovalService;
