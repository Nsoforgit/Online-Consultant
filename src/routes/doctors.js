const express = require('express');
const { pool } = require('../database');
const DoctorScheduleModel = require('../models/doctorSchedule');
const router = express.Router();

// Middleware to check if user is a doctor
const isDoctor = (req, res, next) => {
  if (req.session.role !== 'doctor') {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

// Add this new route to get doctor's appointments
router.get('/appointments', isDoctor, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [doctors] = await connection.execute(
      'SELECT id FROM doctors WHERE user_id = ?',
      [req.session.userId]
    );

    if (!doctors[0]) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const [appointments] = await connection.execute(`
      SELECT 
        a.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.phone as patient_phone
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.doctor_id = ?
      ORDER BY 
        CASE 
          WHEN a.appointment_date > CURDATE() THEN 1
          WHEN a.appointment_date = CURDATE() THEN 2
          ELSE 3
        END,
        a.appointment_date ASC,
        a.appointment_time ASC
    `, [doctors[0].id]);
    
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  } finally {
    connection.release();
  }
});

// Get doctor profile
router.get('/profile', isDoctor, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [doctors] = await connection.execute(`
      SELECT d.*, u.email 
      FROM doctors d 
      JOIN users u ON d.user_id = u.id 
      WHERE u.id = ?
    `, [req.session.userId]);
    
    if (!doctors[0]) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    res.json(doctors[0]);
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  } finally {
    connection.release();
  }
});

// Get all active doctors
router.get('/', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [doctors] = await connection.execute(`
      SELECT d.*, 
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'day', ds.day_of_week,
            'start', ds.start_time,
            'end', ds.end_time
          )
        )
        FROM doctor_schedules ds 
        WHERE ds.doctor_id = d.id
        ) as schedules
      FROM doctors d
      WHERE d.active = true
    `);
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Get doctor by ID with schedules
router.get('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [doctors] = await connection.execute(`
      SELECT d.*, 
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', ds.id,
            'day', ds.day_of_week,
            'start', ds.start_time,
            'end', ds.end_time,
            'breakStart', ds.break_start,
            'breakEnd', ds.break_end,
            'maxPatients', ds.max_patients
          )
        )
        FROM doctor_schedules ds 
        WHERE ds.doctor_id = d.id
        ) as schedules
      FROM doctors d
      WHERE d.id = ?
    `, [req.params.id]);
    
    if (!doctors[0]) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    res.json(doctors[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Update doctor profile (doctor only)
router.put('/profile', isDoctor, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      firstName,
      lastName,
      phone,
      specialization,
      qualification,
      experience
    } = req.body;

    const [result] = await connection.execute(`
      UPDATE doctors 
      SET first_name = ?,
          last_name = ?,
          phone = ?,
          specialization = ?,
          qualification = ?,
          experience_years = ?
      WHERE user_id = ?
    `, [
      firstName,
      lastName,
      phone,
      specialization,
      qualification,
      experience,
      req.session.userId
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  } finally {
    connection.release();
  }
});

// Update doctor schedule (doctor only)
router.put('/schedule/:id', isDoctor, async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const updated = await DoctorScheduleModel.update(scheduleId, req.body);
    
    if (!updated) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    res.json({ message: 'Schedule updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get doctor's availability for a specific date
router.get('/:id/availability/:date', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id, date } = req.params;
    
    // Get doctor's schedule for the day
    const [schedules] = await connection.execute(`
      SELECT * FROM doctor_schedules 
      WHERE doctor_id = ? AND day_of_week = LOWER(DATE_FORMAT(?, '%W'))
    `, [id, date]);

    if (!schedules[0]) {
      return res.json({ available: false, message: 'No schedule for this day' });
    }

    // Get booked appointments
    const [appointments] = await connection.execute(`
      SELECT appointment_time 
      FROM appointments 
      WHERE doctor_id = ? AND appointment_date = ? 
      AND status NOT IN ('cancelled', 'no_show')
    `, [id, date]);

    const schedule = schedules[0];
    const bookedTimes = appointments.map(apt => apt.appointment_time);
    
    // Generate available time slots
    const availableSlots = generateTimeSlots(schedule, bookedTimes);
    
    res.json({
      available: true,
      schedule: {
        start: schedule.start_time,
        end: schedule.end_time,
        breakStart: schedule.break_start,
        breakEnd: schedule.break_end
      },
      availableSlots
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Helper function to generate available time slots
function generateTimeSlots(schedule, bookedTimes) {
  const slots = [];
  let currentTime = new Date(`2000-01-01T${schedule.start_time}`);
  const endTime = new Date(`2000-01-01T${schedule.end_time}`);
  const breakStart = new Date(`2000-01-01T${schedule.break_start}`);
  const breakEnd = new Date(`2000-01-01T${schedule.break_end}`);
  
  while (currentTime < endTime) {
    const timeString = currentTime.toTimeString().slice(0, 5);
    
    // Skip break time
    if (currentTime >= breakStart && currentTime < breakEnd) {
      currentTime = new Date(breakEnd);
      continue;
    }
    
    // Check if slot is available
    if (!bookedTimes.includes(timeString)) {
      slots.push(timeString);
    }
    
    // Add 30 minutes
    currentTime = new Date(currentTime.getTime() + 30 * 60000);
  }
  
  return slots;
}



module.exports = router;