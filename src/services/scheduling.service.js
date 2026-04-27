const pool = require('../config/db');

const SchedulingService = {
  /**
   * Returns the currently active content items for a given teacher.
   * Uses a single JOIN query instead of N+1 per-subject queries.
   * Groups by subject, applies rotation logic independently per subject.
   */
  async getLiveContent(teacher_id) {
    // Single query: fetch all approved+active schedules for this teacher
    const { rows } = await pool.query(
      `SELECT
         c.id, c.title, c.description, c.subject, c.file_url, c.file_type,
         c.rotation_duration, c.start_time, c.end_time,
         cs.rotation_order, cs.duration AS slot_duration
       FROM content c
       JOIN content_schedules cs ON cs.content_id = c.id
       WHERE c.uploaded_by = $1
         AND c.status = 'approved'
         AND c.start_time IS NOT NULL
         AND c.end_time IS NOT NULL
         AND NOW() BETWEEN c.start_time AND c.end_time
       ORDER BY c.subject, cs.rotation_order ASC`,
      [teacher_id]
    );

    if (!rows.length) return [];

    // Group by subject
    const bySubject = {};
    for (const row of rows) {
      if (!bySubject[row.subject]) bySubject[row.subject] = [];
      bySubject[row.subject].push(row);
    }

    const result = [];
    const now = Date.now();

    for (const schedules of Object.values(bySubject)) {
      const totalCycleMs = schedules.reduce((sum, s) => sum + s.slot_duration * 60 * 1000, 0);
      if (totalCycleMs === 0) continue;

      const earliestStartMs = Math.min(
        ...schedules.map(s => new Date(s.start_time).getTime())
      );

      const elapsed = (now - earliestStartMs) % totalCycleMs;

      let cursor = 0;
      for (const item of schedules) {
        const durationMs = item.slot_duration * 60 * 1000;
        if (elapsed >= cursor && elapsed < cursor + durationMs) {
          result.push({
            id: item.id,
            title: item.title,
            subject: item.subject,
            description: item.description,
            file_url: item.file_url,
            file_type: item.file_type,
            rotation_duration: item.rotation_duration,
            start_time: item.start_time,
            end_time: item.end_time,
          });
          break;
        }
        cursor += durationMs;
      }
    }

    return result;
  },

  async getLiveContentBySubject(teacher_id, subject) {
    const all = await this.getLiveContent(teacher_id);
    if (!subject) return all;
    return all.filter(item => item.subject === subject.trim().toLowerCase());
  },
};

module.exports = SchedulingService;
