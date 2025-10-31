// routes/StudentRoute.js
const express = require('express');
const router = express.Router();

// Import all controller functions
const {
  getStudents,
  createStudent,
  getStudentByMatricule,
  updateStudent,
  deleteStudent,
  studentLogin,
  getStudentProfile,
  verifyStudentToken
} = require('../controllers/studentController');

const { studentAuthMiddleware } = require('../middlewares/AuthMiddleware');

// ===== ROUTES D'AUTHENTIFICATION =====
router.post('/auth/login', studentLogin);
router.get('/auth/verify', verifyStudentToken);
router.get('/auth/me', studentAuthMiddleware, getStudentProfile);

// ===== ROUTES CRUD =====
// Route for fetching all students (GET) and creating a new student (POST)
router
  .route('/')
  .get(getStudents) // GET /api/students
  .post(createStudent); // POST /api/students

// Routes for specific student actions, using Matricule as the identifier
router
  .route('/:matricule')
  .get(getStudentByMatricule) // GET /api/students/000-000-00
  .put(updateStudent) // PUT /api/students/000-000-00
  .delete(deleteStudent); // DELETE /api/students/000-000-00

module.exports = router;