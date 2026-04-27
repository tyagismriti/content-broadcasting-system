const pool = require('../config/db');

const ContentModel = {
  async create({ title, description, subject, file_path, file_url, file_type, file_size, uploaded_by, start_time, end_time, rotation_duration }) {
    const result = await pool.query(
      `INSERT INTO content
         (title, description, subject, file_path, file_url, file_type, file_size, uploaded_by, start_time, end_time, rotation_duration)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [title, description || null, subject, file_path, file_url, file_type, file_size, uploaded_by, start_time || null, end_time || null, rotation_duration || 5]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM content WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByTeacher(teacher_id) {
    const result = await pool.query(
      'SELECT * FROM content WHERE uploaded_by = $1 ORDER BY created_at DESC',
      [teacher_id]
    );
    return result.rows;
  },

  async findAll({ status, subject, teacher_id } = {}) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (status) { conditions.push(`c.status = $${idx++}`); params.push(status); }
    if (subject) { conditions.push(`c.subject = $${idx++}`); params.push(subject.trim().toLowerCase()); }
    if (teacher_id) { conditions.push(`c.uploaded_by = $${idx++}`); params.push(teacher_id); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const result = await pool.query(
      `SELECT c.*, u.name AS teacher_name
       FROM content c
       JOIN users u ON u.id = c.uploaded_by
       ${where}
       ORDER BY c.created_at DESC`,
      params
    );
    return result.rows;
  },

  async updateStatus(id, { status, rejection_reason, approved_by, approved_at }) {
    const result = await pool.query(
      `UPDATE content
       SET status = $1, rejection_reason = $2, approved_by = $3, approved_at = $4
       WHERE id = $5
       RETURNING *`,
      [status, rejection_reason || null, approved_by || null, approved_at || null, id]
    );
    return result.rows[0];
  },

  // Returns approved content for a teacher that is within active time window
  async findApprovedActiveByTeacher(teacher_id) {
    const result = await pool.query(
      `SELECT * FROM content
       WHERE uploaded_by = $1
         AND status = 'approved'
         AND start_time IS NOT NULL
         AND end_time IS NOT NULL
         AND NOW() BETWEEN start_time AND end_time
       ORDER BY subject, created_at ASC`,
      [teacher_id]
    );
    return result.rows;
  },
};

module.exports = ContentModel;
