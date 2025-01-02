// App state
let currentUser = null;

// Router
const routes = {
  '/': () => currentUser ? showDashboard() : showLogin(),
  '/login': () => showLogin(),
  '/register': () => showRegister(),
  '/dashboard': () => showDashboard(),
  '/book-appointment': () => showBookAppointment(),
  '/profile': () => showProfile(),
  '/admin': () => showAdminDashboard(),
  '/admin/add-doctor': () => showAddDoctor()
};

// Navigation
function updateNav() {
  const navLinks = document.getElementById('navLinks');
  navLinks.innerHTML = '';

  if (currentUser) {
    if (currentUser.role === 'admin') {
      navLinks.innerHTML = `
        <a href="/admin">Admin Dashboard</a>
        <a href="#" onclick="logout(); return false;">Logout</a>
      `;
    } else {
      navLinks.innerHTML = `
        <a href="/dashboard">Dashboard</a>
        <a href="#" onclick="logout(); return false;">Logout</a>
      `;
    }
  } else {
    navLinks.innerHTML = `
      <a href="/login">Login</a>
      <a href="/register">Register</a>
    `;
  }
}

// Template handling
function loadTemplate(templateId) {
  const template = document.getElementById(templateId);
  const clone = template.content.cloneNode(true);
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.appendChild(clone);
}

// Auth functions
async function login(email, password) {
  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Login failed');
    }

    const data = await response.json();
    currentUser = data.user;
    updateNav();
    navigateTo(currentUser.role === 'admin' ? '/admin' : '/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    alert(error.message || 'Login failed. Please try again.');
  }
}

async function register(userData) {
  try {
    const response = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
      credentials: 'include'
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Registration failed');
    }

    alert('Registration successful! Please login.');
    navigateTo('/login');
  } catch (error) {
    console.error('Registration error:', error);
    alert(error.message || 'Registration failed. Please try again.');
  }
}

async function logout() {
  try {
    await fetch('/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    currentUser = null;
    updateNav();
    navigateTo('/login');
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Profile functions
async function showProfile() {
  if (!currentUser) return navigateTo('/login');
  
  loadTemplate('profile-template');
  try {
    const response = await fetch(
      currentUser.role === 'doctor' ? '/doctors/profile' : '/patients/profile',
      { credentials: 'include' }
    );
    
    if (!response.ok) throw new Error('Failed to fetch profile');
    
    const profile = await response.json();
    
    // Populate form with existing data
    const form = document.getElementById('profileForm');
    form.firstName.value = profile.first_name || '';
    form.lastName.value = profile.last_name || '';
    
    // Only show patient-specific fields for patients
    const patientOnlyFields = document.querySelectorAll('.patient-only');
    patientOnlyFields.forEach(field => {
      field.style.display = currentUser.role === 'patient' ? 'block' : 'none';
    });
    
    // Show doctor-specific fields for doctors
    const doctorOnlyFields = document.querySelectorAll('.doctor-only');
    doctorOnlyFields.forEach(field => {
      field.style.display = currentUser.role === 'doctor' ? 'block' : 'none';
    });
    
    if (currentUser.role === 'patient') {
      form.dateOfBirth.value = profile.date_of_birth ? profile.date_of_birth.split('T')[0] : '';
      if (profile.gender) {
        form.querySelector(`input[name="gender"][value="${profile.gender}"]`).checked = true;
      }
      form.emergencyContact.value = profile.emergency_contact || '';
      form.address.value = profile.address || '';
      form.medicalHistory.value = profile.medical_history || '';
    } else if (currentUser.role === 'doctor') {
      form.specialization.value = profile.specialization || '';
      form.qualification.value = profile.qualification || '';
      form.experience.value = profile.experience_years || '';
    }
    
    form.phone.value = profile.phone || '';
    
    form.onsubmit = async (e) => {
      e.preventDefault();
      const formData = {
        firstName: form.firstName.value.trim(),
        lastName: form.lastName.value.trim(),
        phone: form.phone.value.trim()
      };
      
      if (currentUser.role === 'patient') {
        Object.assign(formData, {
          dateOfBirth: form.dateOfBirth.value || null,
          gender: form.querySelector('input[name="gender"]:checked')?.value || null,
          emergencyContact: form.emergencyContact.value.trim(),
          address: form.address.value.trim(),
          medicalHistory: form.medicalHistory.value.trim()
        });
      } else if (currentUser.role === 'doctor') {
        Object.assign(formData, {
          specialization: form.specialization.value.trim(),
          qualification: form.qualification.value.trim(),
          experience: parseInt(form.experience.value) || 0
        });
      }
      
      await updateProfile(formData);
    };
  } catch (error) {
    console.error('Error fetching profile:', error);
    alert('Failed to load profile. Please try again.');
  }
}

async function updateProfile(profileData) {
  try {
    const response = await fetch(
      currentUser.role === 'doctor' ? '/doctors/profile' : '/patients/profile',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
        credentials: 'include'
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to update profile');
    }

    alert('Profile updated successfully!');
    navigateTo('/dashboard');
  } catch (error) {
    console.error('Profile update error:', error);
    alert(error.message || 'Failed to update profile. Please try again.');
  }
}

async function deleteAccount() {
  if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch('/patients/account', {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete account');
    }

    alert('Account deleted successfully.');
    currentUser = null;
    navigateTo('/login');
  } catch (error) {
    console.error('Account deletion error:', error);
    alert(error.message || 'Failed to delete account. Please try again.');
  }
}


// Admin functions
async function showAdminDashboard() {
  if (!currentUser || currentUser.role !== 'admin') {
    return navigateTo('/login');
  }

  loadTemplate('admin-dashboard-template');
  await Promise.all([
    loadDoctorsList(),
    loadPatientsList()
  ]);

  // Set up search functionality
  const patientSearch = document.getElementById('patientSearch');
  patientSearch.addEventListener('input', debounce(loadPatientsList, 300));
}

async function loadDoctorsList() {
  try {
    const response = await fetch('/admin/doctors', {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch doctors');
    
    const doctors = await response.json();
    const doctorsList = document.getElementById('doctorsList');
    
    doctorsList.innerHTML = doctors.map(doctor => `
      <div class="card doctor-list-item">
        <div class="doctor-info">
          <h3>Dr. ${doctor.first_name} ${doctor.last_name}</h3>
          <p>${doctor.specialization}</p>
          <p>Experience: ${doctor.experience_years} years</p>
        </div>
        <div class="doctor-actions">
          <button class="btn btn-danger" onclick="toggleDoctorStatus(${doctor.id}, '${doctor.active ? 'inactive' : 'active'}')">
            ${doctor.active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading doctors:', error);
  }
}

async function loadPatientsList(search = '') {
  try {
    const response = await fetch(`/admin/patients?search=${encodeURIComponent(search)}`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch patients');
    
    const patients = await response.json();
    const patientsList = document.getElementById('patientsList');
    
    patientsList.innerHTML = patients.map(patient => `
      <div class="card patient-list-item">
        <h3>${patient.first_name} ${patient.last_name}</h3>
        <p>Email: ${patient.email}</p>
        <p>Phone: ${patient.phone}</p>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading patients:', error);
  }
}

function showAddDoctor() {
  if (!currentUser || currentUser.role !== 'admin') {
    return navigateTo('/login');
  }

  loadTemplate('add-doctor-template');
  const form = document.getElementById('addDoctorForm');
  form.onsubmit = (e) => {
    e.preventDefault();
    addDoctor({
      firstName: form.firstName.value,
      lastName: form.lastName.value,
      email: form.email.value,
      specialization: form.specialization.value,
      qualification: form.qualification.value,
      experience: parseInt(form.experience.value),
      fee: parseFloat(form.fee.value)
    });
  };
}

async function addDoctor(doctorData) {
  try {
    const response = await fetch('/admin/doctors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctorData),
      credentials: 'include'
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to add doctor');
    }

    const data = await response.json();
    alert(`Doctor added successfully! Temporary password: ${data.temporaryPassword}`);
    navigateTo('/admin');
  } catch (error) {
    console.error('Error adding doctor:', error);
    alert(error.message || 'Failed to add doctor. Please try again.');
  }
}

async function toggleDoctorStatus(doctorId, newStatus) {
  try {
    const response = await fetch(`/admin/doctors/${doctorId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
      credentials: 'include'
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to update doctor status');
    }

    loadDoctorsList();
  } catch (error) {
    console.error('Error updating doctor status:', error);
    alert(error.message || 'Failed to update doctor status. Please try again.');
  }
}

// Appointment functions
async function bookAppointment(doctorId) {
  const date = prompt('Enter appointment date (YYYY-MM-DD):');
  const time = prompt('Enter appointment time (HH:MM):');
  const reason = prompt('Enter reason for appointment:');
  const notes = prompt('Enter a note for the doctor');
  if (!date || !time || !reason || !notes) {
    alert('All fields are required');
    return;
  }

  try {
    const response = await fetch('/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctorId,
        appointmentDate: date,
        appointmentTime: time,
        reason: reason,
        notes: notes || ''
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to book appointment');
    }

    alert('Appointment booked successfully!');
    navigateTo('/dashboard');
  } catch (error) {
    console.error('Booking error:', error);
    alert(error.message || 'Failed to book appointment. Please try again.');
  }
}

async function cancelAppointment(appointmentId) {
  if (!confirm('Are you sure you want to cancel this appointment?')) {
    return;
  }

  try {
    const response = await fetch(`/appointments/${appointmentId}/cancel`, {
      method: 'PUT',
      credentials: 'include'
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to cancel appointment');
    }

    alert('Appointment cancelled successfully!');
    showDashboard();
  } catch (error) {
    console.error('Cancellation error:', error);
    alert(error.message || 'Failed to cancel appointment. Please try again.');
  }
}

// View handlers
function showLogin() {
  loadTemplate('login-template');
  const form = document.getElementById('loginForm');
  form.onsubmit = (e) => {
    e.preventDefault();
    const email = form.email.value;
    const password = form.password.value;
    login(email, password);
  };
}

function showRegister() {
  loadTemplate('register-template');
  const form = document.getElementById('registerForm');
  form.onsubmit = (e) => {
    e.preventDefault();
    const userData = {
      firstName: form.firstName.value,
      lastName: form.lastName.value,
      email: form.email.value,
      password: form.password.value,
      phone: form.phone.value
    };
    register(userData);
  };
}

// Update showDashboard function to handle doctor role
async function showDashboard() {
  if (!currentUser) return navigateTo('/login');
  
  if (currentUser.role === 'doctor') {
    loadTemplate('doctor-dashboard-template');
    document.getElementById('doctorName').textContent = currentUser.name;
    await loadDoctorAppointments();
  } else if (currentUser.role === 'admin') {
    showAdminDashboard();
  } else {
    loadTemplate('patient-dashboard-template');
    document.getElementById('patientName').textContent = currentUser.name;
    try {
      const response = await fetch('/appointments', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch appointments');
      const appointments = await response.json();
      renderAppointments(appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  }
}

// Add function to load doctor's appointments
async function loadDoctorAppointments() {
  try {
    const response = await fetch('/doctors/appointments', {
      credentials: 'include'
    });
    
    if (!response.ok) throw new Error('Failed to fetch appointments');
    
    const appointments = await response.json();
    const tbody = document.getElementById('doctorAppointmentsList');


     if (!appointments.length) {
    tbody.innerHTML = '<tr><td colspan="6">No appointments found</td></tr>';
    return;
    }
    tbody.innerHTML = appointments.map(appointment => `
      <tr>
        <td data-label="Patient Name">${appointment.patient_first_name} ${appointment.patient_last_name}</td>
        <td data-label="Date">${new Date(appointment.appointment_date).toLocaleDateString()}</td>
        <td data-label="Time">${appointment.appointment_time}</td>
        <td data-label="Status"><span class="status-badge status-${appointment.status.toLowerCase()}">${appointment.status}</span></td>
        <td data-label="Reason">${appointment.reason}</td>
        <td data-label="Notes">${appointment.notes || '-'}</td>
      </tr>
    `).join('');
    
    // Add CSS for status badges
    const style = document.createElement('style');
    style.textContent = `
      .status-badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.875rem;
        font-weight: 500;
      }
      .scheduled { background: #e3f2fd; color: #1976d2; }
      .confirmed { background: #e8f5e9; color: #2e7d32; }
      .completed { background: #f5f5f5; color: #616161; }
      .cancelled { background: #ffebee; color: #c62828; }
      .no_show { background: #fff3e0; color: #ef6c00; }
    `;
    document.head.appendChild(style);
  } catch (error) {
    console.error('Error loading doctor appointments:', error);
    document.getElementById('doctorAppointmentsList').innerHTML = `
      <tr>
        <td colspan="5" style="padding: 12px; text-align: center; color: var(--danger-color);">
          Failed to load appointments. Please try again later.
        </td>
      </tr>
    `;
  }
}

async function showBookAppointment() {
  if (!currentUser) return navigateTo('/login');
  
  loadTemplate('book-appointment-template');
  try {
    const response = await fetch('/doctors', {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch doctors');
    const doctors = await response.json();
    renderDoctors(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
  }
}

// Rendering functions
// Update the renderAppointments function to show notes
function renderAppointments(appointments) {
  const list = document.getElementById('appointmentsList');
  if (!appointments.length) {
    list.innerHTML = '<p>No upcoming appointments</p>';
    return;
  }
  
  list.innerHTML = appointments.map(appointment => `
    <div class="card appointment-card">
      <div>
        <h3>Dr. ${appointment.doctor_first_name} ${appointment.doctor_last_name}</h3>
        <p>${appointment.specialization}</p>
        <p>${new Date(appointment.appointment_date).toLocaleDateString()} at ${appointment.appointment_time}</p>
        <p><strong>Reason:</strong> ${appointment.reason}</p>
        ${appointment.notes ? `<p><strong>Notes:</strong> ${appointment.notes}</p>` : ''}
      </div>
      <button class="btn btn-danger" onclick="cancelAppointment(${appointment.id})">Cancel</button>
    </div>
  `).join('');
}

function renderDoctors(doctors) {
  const grid = document.querySelector('.doctor-grid');
  const template = document.getElementById('doctor-card-template');
  
  grid.innerHTML = '';
  doctors.forEach(doctor => {
    const card = template.content.cloneNode(true);
    card.querySelector('h3').textContent = `Dr. ${doctor.first_name} ${doctor.last_name}`;
    card.querySelector('.text-secondary').textContent = doctor.specialization;
    card.querySelector('.qualification').textContent = doctor.qualification;
    card.querySelector('.experience').textContent = doctor.experience_years;
    card.querySelector('.fee').textContent = doctor.consultation_fee;
    card.querySelector('button').onclick = () => bookAppointment(doctor.id);
    grid.appendChild(card);
  });
}

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Navigation
function navigateTo(path) {
  history.pushState(null, null, path);
  router();
}

function router() {
  const path = window.location.pathname;
  const route = routes[path] || routes['/'];
  route();
}

// Event listeners
window.addEventListener('popstate', router);
window.addEventListener('DOMContentLoaded', () => {
  updateNav();
  router();
});