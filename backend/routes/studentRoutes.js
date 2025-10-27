const express = require('express');
const router = express.Router();

// Import all controller functions
const {
  getStudents,
  createStudent,
  getStudentByMatricule,
  updateStudent,
  deleteStudent
} = require('../controllers/studentController');

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