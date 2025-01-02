const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Nsofor123456.',
  database: 'aproko_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initializeDatabase() {
  const connection = await pool.getConnection();
  try {
    // Users table with enhanced fields
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'doctor', 'patient') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL
      )
    `);

    // Patients table with additional fields
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS patients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(50),
        date_of_birth DATE,
        gender ENUM('male', 'female', 'other'),
        address TEXT,
        medical_history TEXT,
        emergency_contact VARCHAR(255),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Doctors table with enhanced fields and active status
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS doctors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        specialization VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        qualification TEXT,
        experience_years INT,
        consultation_fee DECIMAL(10,2),
        active BOOLEAN DEFAULT true,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Add active column if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE doctors 
        ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true
      `);
    } catch (error) {
      // Column might already exist, continue
    }

    // Doctor schedule table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS doctor_schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doctor_id INT NOT NULL,
        day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
        start_time TIME,
        end_time TIME,
        break_start TIME,
        break_end TIME,
        max_patients INT,
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
      )
    `);

    // Appointments table with enhanced fields
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        doctor_id INT NOT NULL,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        status ENUM('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
        reason TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
      )
    `);

   // Create indexes for better performance
    // Check if the index exists before creating it
    const [existingIndexes] = await connection.query(`
      SELECT COUNT(*) AS count 
      FROM information_schema.statistics 
      WHERE table_schema = 'aproko_db' AND table_name = 'users' AND index_name = 'idx_user_email'
    `);

    if (existingIndexes[0].count === 0) {
      await connection.execute('CREATE INDEX idx_user_email ON users(email)');
    }

    // Check if the index exists before creating it
    const [existingDoctorIndex] = await connection.query(`
      SELECT COUNT(*) AS count 
      FROM information_schema.statistics 
      WHERE table_schema = 'aproko_db' AND table_name = 'doctors' AND index_name = 'idx_doctor_specialization'
    `);

    if (existingDoctorIndex[0].count === 0) {
      await connection.execute('CREATE INDEX idx_doctor_specialization ON doctors(specialization)');
    }

    const [existingAppointmentIndex] = await connection.query(`
      SELECT COUNT(*) AS count 
      FROM information_schema.statistics 
      WHERE table_schema = 'aproko_db' AND table_name = 'appointments' AND index_name = 'idx_appointment_date'
    `);

    if (existingAppointmentIndex[0].count === 0) {
      await connection.execute('CREATE INDEX idx_appointment_date ON appointments(appointment_date)');
    }

  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  initializeDatabase
};