const express = require('express');
const { pool } = require('../database');
const router = express.Router();

// Get user's appointments
router.get('/', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [patients] = await connection.execute(
      'SELECT id FROM patients WHERE user_id = ?',
      [req.session.userId]
    );

    if (!patients.length) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const [appointments] = await connection.execute(`
      SELECT 
        a.*,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        d.specialization
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.patient_id = ? AND a.status != 'cancelled'
      ORDER BY a.appointment_date, a.appointment_time
    `, [patients[0].id]);
    
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  } finally {
    connection.release();
  }
});

// Book appointment
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { doctorId, appointmentDate, appointmentTime, reason, notes } = req.body;
    
    const [patients] = await connection.execute(
      'SELECT id FROM patients WHERE user_id = ?',
      [req.session.userId]
    );

    if (!patients.length) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    await connection.execute(`
      INSERT INTO appointments (
        patient_id, doctor_id, appointment_date, 
        appointment_time, status, reason, notes
      ) VALUES (?, ?, ?, ?, 'scheduled', ?, ?)
    `, [patients[0].id, doctorId, appointmentDate, appointmentTime, reason, notes]);
    
    res.status(201).json({ message: 'Appointment booked successfully' });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ error: 'Failed to book appointment' });
  } finally {
    connection.release();
  }
});

// Cancel appointment
router.put('/:id/cancel', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [patients] = await connection.execute(
      'SELECT id FROM patients WHERE user_id = ?',
      [req.session.userId]
    );

    if (!patients.length) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const [result] = await connection.execute(`
      UPDATE appointments 
      SET status = 'cancelled' 
      WHERE id = ? AND patient_id = ? AND status = 'scheduled'
    `, [req.params.id, patients[0].id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Appointment not found or already cancelled' });
    }
    
    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  } finally {
    connection.release();
  }
});

module.exports = router;