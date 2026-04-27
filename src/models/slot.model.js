const pool = require('../config/db');

const SlotModel = {
  async findOrCreateBySubject(subject) {
    let result = await pool.query(
      'SELECT * FROM content_slots WHERE subject = $1',
      [subject]
    );
    if (result.rows.length) return result.rows[0];

    result = await pool.query(
      'INSERT INTO content_slots (subject) VALUES ($1) RETURNING *',
      [subject]
    );
    return result.rows[0];
  },

  async createSchedule({ content_id, slot_id, rotation_order, duration }) {
    const result = await pool.query(
      `INSERT INTO content_schedules (content_id, slot_id, rotation_order, duration)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (content_id, slot_id) DO UPDATE
         SET rotation_order = EXCLUDED.rotation_order,
             duration = EXCLUDED.duration
       RETURNING *`,
      [content_id, slot_id, rotation_order, duration]
    );
    return result.rows[0];
  },

  async getNextRotationOrder(slot_id) {
    const result = await pool.query(
      'SELECT COALESCE(MAX(rotation_order), -1) + 1 AS next_order FROM content_schedules WHERE slot_id = $1',
      [slot_id]
    );
    return result.rows[0].next_order;
  },

  // Get all schedules for a slot (used in rotation logic)
  async getSchedulesBySlot(slot_id) {
    const result = await pool.query(
      `SELECT cs.*, c.title, c.file_url, c.subject, c.start_time, c.end_time, c.status
       FROM content_schedules cs
       JOIN content c ON c.id = cs.content_id
       WHERE cs.slot_id = $1
       ORDER BY cs.rotation_order ASC`,
      [slot_id]
    );
    return result.rows;
  },
};

module.exports = SlotModel;
