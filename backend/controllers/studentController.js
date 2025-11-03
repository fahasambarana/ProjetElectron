// controllers/StudentController.js
const Student = require('../models/StudentModel');
const jwt = require('jsonwebtoken');

/**
 * @desc Get all students
 * @route GET /api/students
 * @access Public
 */
exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (err) {
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
    const student = await Student.create(req.body);
    res.status(201).json({
      success: true,
      data: student
    });
  } catch (err) {
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
    const student = await Student.findOneAndUpdate(
      { Matricule: req.params.matricule },
      req.body,
      { new: true, runValidators: true }
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
    const student = await Student.findOneAndDelete({ Matricule: req.params.matricule });

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// =============================================================================
// AUTHENTIFICATION METHODS - NOUVELLES FONCTIONNALITÉS
// =============================================================================

/**
 * @desc Authenticate student with matricule
 * @route POST /api/students/auth/login
 * @access Public
 */
exports.studentLogin = async (req, res) => {
  try {
    const { matricule } = req.body;

    // Validation du matricule
    if (!matricule) {
      return res.status(400).json({
        success: false,
        error: 'Le matricule est requis'
      });
    }

    // Formatage et validation du matricule
    const formattedMatricule = matricule.trim();
    const matriculeRegex = /^\d{5}-\d{2}-\d{2}$/;
    
    if (!matriculeRegex.test(formattedMatricule)) {
      return res.status(400).json({
        success: false,
        error: 'Format de matricule invalide. Utilisez le format: 00000-00-00'
      });
    }

    // Recherche de l'étudiant
    const student = await Student.findOne({ 
      Matricule: formattedMatricule 
    });

    if (!student) {
      return res.status(401).json({
        success: false,
        error: 'Matricule non reconnu'
      });
    }

    // Génération du token JWT
    const token = jwt.sign(
      {
        id: student._id,
        matricule: student.Matricule,
        nom: student.Nom_et_Prenoms,
        niveau: student.Niveau,
        type: 'student'
      },
      process.env.JWT_SECRET || 'votre_cle_secrete_fallback',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      message: 'Authentification réussie',
      token,
      data: {
        id: student._id,
        matricule: student.Matricule,
        nom: student.Nom_et_Prenoms,
        niveau: student.Niveau,
        parcours: student.Parcours,
        telephone: student.Telephone
      }
    });

  } catch (err) {
    console.error('Erreur authentification étudiante:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de l\'authentification' 
    });
  }
};

/**
 * @desc Get current student profile (protected route)
 * @route GET /api/students/auth/me
 * @access Private (Student)
 */
exports.getStudentProfile = async (req, res) => {
  try {
    // req.userId est défini par le middleware d'authentification
    const student = await Student.findById(req.userId).select('-createdAt -updatedAt -__v');

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Étudiant non trouvé'
      });
    }

    // Vérifier que l'utilisateur est bien un étudiant
    if (req.userType !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: student._id,
        matricule: student.Matricule,
        nom: student.Nom_et_Prenoms,
        niveau: student.Niveau,
        parcours: student.Parcours,
        telephone: student.Telephone
      }
    });

  } catch (err) {
    console.error('Erreur récupération profil étudiant:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur' 
    });
  }
};

/**
 * @desc Verify student token
 * @route GET /api/students/auth/verify
 * @access Public
 */
exports.verifyStudentToken = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        valid: false,
        error: 'Token manquant' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_cle_secrete_fallback');
    
    // Vérifier que le token est bien pour un étudiant
    if (decoded.type !== 'student') {
      return res.status(401).json({
        success: false,
        valid: false,
        error: 'Token invalide pour les étudiants'
      });
    }

    res.status(200).json({
      success: true,
      valid: true,
      data: {
        id: decoded.id,
        matricule: decoded.matricule,
        nom: decoded.nom,
        niveau: decoded.niveau
      }
    });

  } catch (err) {
    res.status(401).json({
      success: false,
      valid: false,
      error: 'Token invalide'
    });
  }
};