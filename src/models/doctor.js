const { pool } = require('../database');

class DoctorModel {
  static async create(userData, doctorData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [userResult] = await connection.execute(
        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
        [userData.email, userData.password, 'doctor']
      );

      const [doctorResult] = await connection.execute(
        `INSERT INTO doctors (
          user_id, first_name, last_name, specialization, 
          phone, qualification, experience_years, consultation_fee
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userResult.insertId,
          doctorData.firstName,
          doctorData.lastName,
          doctorData.specialization,
          doctorData.phone,
          doctorData.qualification,
          doctorData.experienceYears,
          doctorData.consultationFee
        ]
      );

      await connection.commit();
      return doctorResult.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getAvailableSlots(doctorId, date) {
    const connection = await pool.getConnection();
    try {
      const [schedule] = await connection.execute(`
        SELECT * FROM doctor_schedules 
        WHERE doctor_id = ? AND day_of_week = LOWER(DATE_FORMAT(?, '%W'))
      `, [doctorId, date]);

      if (!schedule[0]) {
        return [];
      }

      const [bookedSlots] = await connection.execute(`
        SELECT appointment_time 
        FROM appointments 
        WHERE doctor_id = ? AND appointment_date = ? 
        AND status NOT IN ('cancelled', 'no_show')
      `, [doctorId, date]);

      // Generate available time slots based on schedule and booked appointments
      return this.generateTimeSlots(schedule[0], bookedSlots);
    } finally {
      connection.release();
    }
  }

  static generateTimeSlots(schedule, bookedSlots) {
    // Implementation of time slot generation logic
    // This would return an array of available time slots
    // considering the schedule and booked appointments
    return [];
  }
}

module.exports = DoctorModel;