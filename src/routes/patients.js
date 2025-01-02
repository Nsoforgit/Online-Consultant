const express = require('express');
const { pool } = require('../database');
const router = express.Router();

// Get patient profile
router.get('/profile', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [patients] = await connection.execute(`
      SELECT p.*, u.email 
      FROM patients p 
      JOIN users u ON p.user_id = u.id 
      WHERE u.id = ?
    `, [req.session.userId]);
    
    if (!patients[0]) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json(patients[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Update patient profile
router.put('/profile', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { 
      firstName, 
      lastName, 
      phone, 
      dateOfBirth,
      gender,
      emergencyContact,
      address, 
      medicalHistory 
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }
    
    const [result] = await connection.execute(`
      UPDATE patients 
      SET first_name = ?, 
          last_name = ?, 
          phone = ?, 
          date_of_birth = ?,
          gender = ?,
          emergency_contact = ?,
          address = ?, 
          medical_history = ?
      WHERE user_id = ?
    `, [
      firstName, 
      lastName, 
      phone, 
      dateOfBirth,
      gender,
      emergencyContact,
      address, 
      medicalHistory, 
      req.session.userId
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  } finally {
    connection.release();
  }
});

// Delete patient account
router.delete('/account', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Delete appointments first
    await connection.execute(
      'DELETE FROM appointments WHERE patient_id IN (SELECT id FROM patients WHERE user_id = ?)',
      [req.session.userId]
    );

    // Delete patient profile
    await connection.execute(
      'DELETE FROM patients WHERE user_id = ?',
      [req.session.userId]
    );

    // Delete user account
    await connection.execute(
      'DELETE FROM users WHERE id = ?',
      [req.session.userId]
    );

    await connection.commit();
    req.session.destroy();
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: 'Failed to delete account' });
  } finally {
    connection.release();
  }
});

module.exports = router;