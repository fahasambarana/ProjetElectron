const Student = require('../models/StudentModel'); // Import the Student Mongoose model

/**
 * @desc Get all students
 * @route GET /api/students
 * @access Public
 */
exports.getStudents = async (req, res) => {
  try {
    // Find all students in the database
    const students = await Student.find();
    
    // Respond with success and the list of students
    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (err) {
    // Handle errors (e.g., database connection issues)
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

/**
 * @desc Create a new student
 * @route POST /api/students
 * @access Public
 */
exports.createStudent = async (req, res) => {
  try {
    // Create a new student document using the request body
    const student = await Student.create(req.body);

    // Respond with success and the created student data
    res.status(201).json({
      success: true,
      data: student
    });
  } catch (err) {
    // Handle validation or duplicate key errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages });
    }
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

/**
 * @desc Get a single student by Matricule
 * @route GET /api/students/:matricule
 * @access Public
 */
exports.getStudentByMatricule = async (req, res) => {
  try {
    // Find a student by the Matricule provided in the URL parameters
    const student = await Student.findOne({ Matricule: req.params.matricule });

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

/**
 * @desc Update a student by Matricule
 * @route PUT /api/students/:matricule
 * @access Public
 */
exports.updateStudent = async (req, res) => {
  try {
    // Find and update the student, returning the new document
    const student = await Student.findOneAndUpdate(
      { Matricule: req.params.matricule },
      req.body,
      { new: true, runValidators: true } // Return the updated document and run Mongoose validators
    );

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

/**
 * @desc Delete a student by Matricule
 * @route DELETE /api/students/:matricule
 * @access Public
 */
exports.deleteStudent = async (req, res) => {
  try {
    // Find and delete the student
    const student = await Student.findOneAndDelete({ Matricule: req.params.matricule });

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    res.status(200).json({
      success: true,
      data: {} // Respond with empty data for a successful deletion
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};