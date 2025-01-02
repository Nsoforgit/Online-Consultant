const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../database');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    
    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await connection.beginTransaction();
    
    // Insert user
    const [userResult] = await connection.execute(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      [email, hashedPassword, 'patient']
    );
    
    // Insert patient details
    await connection.execute(
      'INSERT INTO patients (user_id, first_name, last_name, phone) VALUES (?, ?, ?, ?)',
      [userResult.insertId, firstName, lastName, phone]
    );
    
    await connection.commit();
    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    await connection.rollback();
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  } finally {
    connection.release();
  }
});

// Login
router.post('/login', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { email, password } = req.body;
    
    // Get user with patient or doctor details
    const [users] = await connection.execute(`
      SELECT u.*, 
        COALESCE(p.first_name, d.first_name) as first_name,
        COALESCE(p.last_name, d.last_name) as last_name
      FROM users u
      LEFT JOIN patients p ON u.id = p.user_id
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE u.email = ?
    `, [email]);
    
    const user = users[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Set session data
    req.session.userId = user.id;
    req.session.role = user.role;
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: `${user.first_name} ${user.last_name}`
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  } finally {
    connection.release();
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;