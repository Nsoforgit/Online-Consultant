const express = require('express');
const { pool } = require('../database');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.session.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

// Get all patients
router.get('/patients', isAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const search = req.query.search || '';
    const [patients] = await connection.execute(`
      SELECT p.*, u.email 
      FROM patients p 
      JOIN users u ON p.user_id = u.id
      WHERE p.first_name LIKE ? OR p.last_name LIKE ? OR u.email LIKE ?
    `, [`%${search}%`, `%${search}%`, `%${search}%`]);
    
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  } finally {
    connection.release();
  }
});

// Add new doctor
router.post('/doctors', isAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      firstName, lastName, email, specialization,
      qualification, experience, fee
    } = req.body;

    await connection.beginTransaction();

    // Create user account for doctor
    const password = Math.random().toString(36).slice(-8); // Generate random password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [userResult] = await connection.execute(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      [email, hashedPassword, 'doctor']
    );

    // Create doctor profile
    await connection.execute(`
      INSERT INTO doctors (
        user_id, first_name, last_name, specialization,
        qualification, experience_years, consultation_fee
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      userResult.insertId, firstName, lastName, specialization,
      qualification, experience, fee
    ]);

    await connection.commit();
    
    res.status(201).json({ 
      message: 'Doctor added successfully',
      temporaryPassword: password
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error adding doctor:', error);
    res.status(500).json({ error: 'Failed to add doctor' });
  } finally {
    connection.release();
  }
});

// Update doctor status (active/inactive)
router.put('/doctors/:id/status', isAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { status } = req.body;
    const [result] = await connection.execute(
      'UPDATE doctors SET active = ? WHERE id = ?',
      [status === 'active', req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    res.json({ message: 'Doctor status updated successfully' });
  } catch (error) {
    console.error('Error updating doctor status:', error);
    res.status(500).json({ error: 'Failed to update doctor status' });
  } finally {
    connection.release();
  }
});

module.exports = router;