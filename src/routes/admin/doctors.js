const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../../database');
const DoctorScheduleModel = require('../../models/doctorSchedule');
const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.session.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

// Get all doctors (including inactive)
router.get('/', isAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [doctors] = await connection.execute(`
      SELECT d.*, u.email,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', ds.id,
            'day', ds.day_of_week,
            'start', ds.start_time,
            'end', ds.end_time
          )
        )
        FROM doctor_schedules ds 
        WHERE ds.doctor_id = d.id
        ) as schedules
      FROM doctors d
      JOIN users u ON d.user_id = u.id
    `);
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  } finally {
    connection.release();
  }
});

// Add new doctor with schedule
router.post('/', isAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      firstName, lastName, email, specialization,
      qualification, experience, fee, schedules
    } = req.body;

    await connection.beginTransaction();

    // Create user account
    const password = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [userResult] = await connection.execute(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      [email, hashedPassword, 'doctor']
    );

    // Create doctor profile
    const [doctorResult] = await connection.execute(`
      INSERT INTO doctors (
        user_id, first_name, last_name, specialization,
        qualification, experience_years, consultation_fee, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, true)
    `, [
      userResult.insertId, firstName, lastName, specialization,
      qualification, experience, fee
    ]);

    // Create schedules
    if (schedules && schedules.length > 0) {
      for (const schedule of schedules) {
        await DoctorScheduleModel.create({
          doctorId: doctorResult.insertId,
          ...schedule
        });
      }
    }

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

// Update doctor status
router.put('/:id/status', isAdmin, async (req, res) => {
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

// Delete doctor (soft delete by deactivating)
router.delete('/:id', isAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute(
      'UPDATE doctors SET active = false WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    res.json({ message: 'Doctor deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating doctor:', error);
    res.status(500).json({ error: 'Failed to deactivate doctor' });
  } finally {
    connection.release();
  }
});

module.exports = router;