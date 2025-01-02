const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { initializeDatabase } = require('./database');
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const adminRoutes = require('./routes/admin');
const adminDoctorRoutes = require('./routes/admin/doctors');
const { authMiddleware } = require('./middleware/auth');
const cors = require('cors');
const { resolve } = require('path');

const app = express();
const port = 3010;

// Initialize database
initializeDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Serve static files
app.use(express.static('static'));
app.use(express.static('pages'));

// API Routes
app.use('/auth', authRoutes);
app.use('/patients', authMiddleware, patientRoutes);
app.use('/doctors', authMiddleware, doctorRoutes);
app.use('/appointments', authMiddleware, appointmentRoutes);
app.use('/admin/doctors', authMiddleware, adminDoctorRoutes); // Move this before the general admin routes
app.use('/admin', authMiddleware, adminRoutes);

// Handle SPA routing
app.get('*', (req, res) => {
  res.sendFile(resolve(__dirname, '../pages/index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});