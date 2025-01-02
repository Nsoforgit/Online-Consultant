# Medical Appointment System

A comprehensive web-based medical appointment management system built with Node.js, Express, and MySQL.

## Features

### For Patients
- 👤 User registration and authentication
- 📅 Book appointments with available doctors
- 📋 View and manage upcoming appointments
- ⚕️ Access medical history and personal information
- 🔄 Update profile information
- ❌ Cancel appointments

### For Doctors
- 👨‍⚕️ Manage availability and schedule
- 📊 View upcoming appointments
- 🏥 Update professional information
- 📝 Access patient medical records

### For Administrators
- 👥 Manage doctors and patients
- ➕ Add new doctors to the system
- 📊 Monitor appointment statistics
- 🔄 Activate/deactivate doctor accounts
- 🔍 Search and filter patient records

## Technical Stack

- **Backend**: Node.js with Express
- **Database**: MySQL
- **Authentication**: Session-based with bcrypt password hashing
- **Frontend**: Vanilla JavaScript with HTML templates
- **Styling**: Custom CSS with responsive design

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

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Configuration**
   - Create a MySQL database
   - Update database credentials in `src/database.js`

3. **Initialize Database**
   ```bash
   node src/scripts/seedData.js
   ```

4. **Start the Server**
   ```bash
   npm run dev
   ```

5. **Access the Application**
   - Open `http://localhost:3010` in your browser
   - Default admin credentials:
     - Email: admin@example.com
     - Password: password123

## API Endpoints

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

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.