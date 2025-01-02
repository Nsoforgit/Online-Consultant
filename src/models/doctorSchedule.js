const { pool } = require('../database');

class DoctorScheduleModel {
  static async create(scheduleData) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(`
        INSERT INTO doctor_schedules (
          doctor_id, day_of_week, start_time, 
          end_time, break_start, break_end, max_patients
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        scheduleData.doctorId,
        scheduleData.dayOfWeek,
        scheduleData.startTime,
        scheduleData.endTime,
        scheduleData.breakStart,
        scheduleData.breakEnd,
        scheduleData.maxPatients
      ]);
      return result.insertId;
    } finally {
      connection.release();
    }
  }

  static async getByDoctorId(doctorId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM doctor_schedules WHERE doctor_id = ?',
        [doctorId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  static async update(scheduleId, scheduleData) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(`
        UPDATE doctor_schedules 
        SET start_time = ?, end_time = ?, 
            break_start = ?, break_end = ?, 
            max_patients = ?
        WHERE id = ?
      `, [
        scheduleData.startTime,
        scheduleData.endTime,
        scheduleData.breakStart,
        scheduleData.breakEnd,
        scheduleData.maxPatients,
        scheduleId
      ]);
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  static async delete(scheduleId) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        'DELETE FROM doctor_schedules WHERE id = ?',
        [scheduleId]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }
}

module.exports = DoctorScheduleModel;