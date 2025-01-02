# Medical Appointment System

A comprehensive web-based medical appointment management system built with Node.js, Express, and MySQL.

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm (comes with Node.js)

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd medical-appointment-system
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   - Create a MySQL database:
     ```sql
     CREATE DATABASE aproko_db;
     ```
   - Update database configuration in `src/database.js` with your credentials:
     ```javascript
     {
       host: 'localhost',
       user: 'your_username',
       password: 'your_password',
       database: 'aproko_db'
     }
     ```

4. **Initialize Database**
   ```bash
   node src/scripts/seedData.js
   ```
   This will create all necessary tables and seed initial data including:
   - Admin account: admin@example.com / password123
   - Doctor account: dr.smith@example.com / password123
   - Patient account: john.doe@example.com / password123

5. **Environment Variables**
   Create a `.env` file in the root directory:
   ```
   PORT=3010
   SESSION_SECRET=your_session_secret
   ```

6. **Start the Server**
   - Development mode:
     ```bash
     npm run dev
     ```
   - Production mode:
     ```bash
     npm start
     ```

7. **Access the Application**
   - Open `http://localhost:3010` in your browser
   - Use the seeded accounts to test different user roles

## Project Structure

```
medical-appointment-system/
├── src/
│   ├── index.js           # Application entry point
│   ├── database.js        # Database configuration
│   ├── models/           # Database models
│   │   ├── appointment.js
│   │   ├── doctor.js
│   │   ├── patient.js
│   │   └── doctorSchedule.js
│   └── routes/           # API routes
│       ├── admin/
│       │   └── doctors.js
│       ├── auth.js
│       ├── appointments.js
│       ├── doctors.js
│       └── patients.js
├── pages/               # Frontend pages
│   └── index.html      # Main SPA template
├── static/             # Static assets
│   └── js/
│       └── app.js     # Frontend JavaScript
└── package.json
```

## API Documentation

### Authentication
- `POST /auth/register` - Register new patient
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Patients
- `GET /patients/profile` - Get patient profile
- `PUT /patients/profile` - Update patient profile
- `DELETE /patients/account` - Delete patient account

### Doctors
- `GET /doctors` - List all active doctors
- `GET /doctors/:id` - Get doctor details
- `PUT /doctors/profile` - Update doctor profile
- `GET /doctors/:id/availability/:date` - Check doctor availability

### Appointments
- `GET /appointments` - List user's appointments
- `POST /appointments` - Book new appointment
- `PUT /appointments/:id/cancel` - Cancel appointment

### Admin
- `GET /admin/doctors` - List all doctors
- `POST /admin/doctors` - Add new doctor
- `PUT /admin/doctors/:id/status` - Update doctor status
- `GET /admin/patients` - List all patients

## Security Features

- Password hashing using bcryptjs
- Session-based authentication
- CORS protection
- Input validation and sanitization
- SQL injection prevention using prepared statements

## Troubleshooting

Common issues and solutions:

1. **Database Connection Error**
   - Verify MySQL is running
   - Check database credentials
   - Ensure database exists

2. **Port Already in Use**
   - Change PORT in .env file
   - Kill process using the port

3. **Session Issues**
   - Clear browser cookies
   - Verify SESSION_SECRET is set

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.