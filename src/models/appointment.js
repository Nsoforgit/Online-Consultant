const { pool } = require('../database');

class AppointmentModel {
  static async create(appointmentData) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(`
        INSERT INTO appointments (
          patient_id, doctor_id, appointment_date, 
          appointment_time, reason, notes
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        appointmentData.patientId,
        appointmentData.doctorId,
        appointmentData.date,
        appointmentData.time,
        appointmentData.reason,
        appointmentData.notes
      ]);
      return result.insertId;
    } finally {
      connection.release();
    }
  }

  static async getUpcoming(patientId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(`
        SELECT a.*, 
          d.first_name as doctor_first_name, 
          d.last_name as doctor_last_name,
          d.specialization
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        WHERE a.patient_id = ? 
        AND a.appointment_date >= CURDATE()
        AND a.status NOT IN ('completed', 'cancelled', 'no_show')
        ORDER BY a.appointment_date, a.appointment_time
      `, [patientId]);
      return rows;
    } finally {
      connection.release();
    }
  }

  static async updateStatus(id, status, notes = null) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(`
        UPDATE appointments 
        SET status = ?, notes = COALESCE(?, notes)
        WHERE id = ?
      `, [status, notes, id]);
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }
}

module.exports = AppointmentModel;