const { pool } = require('../database');

class PatientModel {
  static async create(userData, patientData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [userResult] = await connection.execute(
        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
        [userData.email, userData.password, 'patient']
      );

      const [patientResult] = await connection.execute(
        `INSERT INTO patients (
          user_id, first_name, last_name, phone, 
          date_of_birth, gender, address, medical_history, 
          emergency_contact
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userResult.insertId,
          patientData.firstName,
          patientData.lastName,
          patientData.phone,
          patientData.dateOfBirth,
          patientData.gender,
          patientData.address,
          patientData.medicalHistory,
          patientData.emergencyContact
        ]
      );

      await connection.commit();
      return patientResult.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(`
        SELECT p.*, u.email 
        FROM patients p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.id = ?
      `, [id]);
      return rows[0];
    } finally {
      connection.release();
    }
  }

  static async update(id, data) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(`
        UPDATE patients 
        SET first_name = ?, last_name = ?, phone = ?, 
            date_of_birth = ?, gender = ?, address = ?, 
            medical_history = ?, emergency_contact = ?
        WHERE id = ?
      `, [
        data.firstName,
        data.lastName,
        data.phone,
        data.dateOfBirth,
        data.gender,
        data.address,
        data.medicalHistory,
        data.emergencyContact,
        id
      ]);
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }
}

module.exports = PatientModel;