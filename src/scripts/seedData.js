const bcrypt = require('bcryptjs');
const { pool } = require('../database');

async function seedData() {
  const connection = await pool.getConnection();
  try {
    // Clear existing data
    await connection.execute('DELETE FROM appointments');
    await connection.execute('DELETE FROM doctor_schedules');
    await connection.execute('DELETE FROM doctors');
    await connection.execute('DELETE FROM patients');
    await connection.execute('DELETE FROM users');

    // Create test password
    const password = await bcrypt.hash('password123', 10);

    // Create users
    const [adminUser] = await connection.execute(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      ['admin@example.com', password, 'admin']
    );

    const [doctorUser1] = await connection.execute(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      ['dr.smith@example.com', password, 'doctor']
    );

    const [doctorUser2] = await connection.execute(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      ['dr.jones@example.com', password, 'doctor']
    );

    const [patientUser1] = await connection.execute(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      ['john.doe@example.com', password, 'patient']
    );

    const [patientUser2] = await connection.execute(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      ['jane.doe@example.com', password, 'patient']
    );

    // Create doctors
    const [doctor1] = await connection.execute(
      `INSERT INTO doctors (
        user_id, first_name, last_name, specialization, 
        phone, qualification, experience_years, consultation_fee
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doctorUser1.insertId,
        'John',
        'Smith',
        'Cardiologist',
        '555-0101',
        'MD, FACC',
        15,
        150.00
      ]
    );

    const [doctor2] = await connection.execute(
      `INSERT INTO doctors (
        user_id, first_name, last_name, specialization, 
        phone, qualification, experience_years, consultation_fee
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doctorUser2.insertId,
        'Sarah',
        'Jones',
        'Dermatologist',
        '555-0102',
        'MD, FAAD',
        10,
        130.00
      ]
    );

    // Create patients
    const [patient1] = await connection.execute(
      `INSERT INTO patients (
        user_id, first_name, last_name, phone, 
        date_of_birth, gender, address, medical_history, 
        emergency_contact
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patientUser1.insertId,
        'John',
        'Doe',
        '555-0201',
        '1985-05-15',
        'male',
        '123 Main St, City',
        'No major health issues',
        'Jane Doe (Wife) - 555-0202'
      ]
    );

    const [patient2] = await connection.execute(
      `INSERT INTO patients (
        user_id, first_name, last_name, phone, 
        date_of_birth, gender, address, medical_history, 
        emergency_contact
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patientUser2.insertId,
        'Jane',
        'Doe',
        '555-0202',
        '1988-08-20',
        'female',
        '123 Main St, City',
        'Allergic to penicillin',
        'John Doe (Husband) - 555-0201'
      ]
    );

    // Create doctor schedules
    await connection.execute(
      `INSERT INTO doctor_schedules (
        doctor_id, day_of_week, start_time, 
        end_time, break_start, break_end, max_patients
      ) VALUES 
      (?, 'monday', '09:00', '17:00', '12:00', '13:00', 8),
      (?, 'tuesday', '09:00', '17:00', '12:00', '13:00', 8),
      (?, 'wednesday', '09:00', '17:00', '12:00', '13:00', 8),
      (?, 'thursday', '09:00', '17:00', '12:00', '13:00', 8),
      (?, 'friday', '09:00', '15:00', '12:00', '13:00', 6)`,
      [doctor1.insertId, doctor1.insertId, doctor1.insertId, doctor1.insertId, doctor1.insertId]
    );

    await connection.execute(
      `INSERT INTO doctor_schedules (
        doctor_id, day_of_week, start_time, 
        end_time, break_start, break_end, max_patients
      ) VALUES 
      (?, 'monday', '10:00', '18:00', '13:00', '14:00', 8),
      (?, 'tuesday', '10:00', '18:00', '13:00', '14:00', 8),
      (?, 'wednesday', '10:00', '18:00', '13:00', '14:00', 8),
      (?, 'thursday', '10:00', '18:00', '13:00', '14:00', 8),
      (?, 'friday', '10:00', '16:00', '13:00', '14:00', 6)`,
      [doctor2.insertId, doctor2.insertId, doctor2.insertId, doctor2.insertId, doctor2.insertId]
    );

    // Create appointments
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    await connection.execute(
      `INSERT INTO appointments (
        patient_id, doctor_id, appointment_date, 
        appointment_time, status, reason, notes
      ) VALUES 
      (?, ?, ?, '10:00', 'scheduled', 'Regular checkup', NULL),
      (?, ?, ?, '14:00', 'scheduled', 'Follow-up visit', NULL)`,
      [
        patient1.insertId, doctor1.insertId, tomorrow.toISOString().split('T')[0],
        patient2.insertId, doctor2.insertId, nextWeek.toISOString().split('T')[0]
      ]
    );

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    connection.release();
  }
}

seedData().catch(console.error);