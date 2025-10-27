const mongoose = require('mongoose');

// ----------------------------------------------------------------------
// 1. Define the Schema
// ----------------------------------------------------------------------

const studentSchema = new mongoose.Schema({
  // N° (Number/Order) - Stored as a string because it's a simple label,
  // but could be a Number if strict ordering/calculations were needed.
  N_Order: {
    type: String,
    required: true,
    trim: true
  },
  
  // Matricule (ID/Matriculation Number) - Key identifier, typically a string.
  Matricule: {
    type: String,
    required: true,
    unique: true, // Assuming Matricule is a unique identifier
    trim: true
  },
  
  // Nom et Prénoms (Last and First Names)
  Nom_et_Prenoms: {
    type: String,
    required: true,
    trim: true
  },
  
  // Téléphone (Phone Number) - Stored as a string to handle various formats
  // (e.g., numbers with spaces, missing or partial numbers).
  Telephone: {
    type: String,
    default: null, // Allow null/missing values as seen in the data
    trim: true
  },
  
  // Optional field to track the academic level (Niveau)
  Niveau: {
    type: String,
    enum: ['L2', 'M1', 'M2', 'L1', 'L3'], // Example possible values
    default: 'L2'
  },
  
  // Optional field to track the specific course/track (Parcours)
  Parcours: {
    type: String,
    trim: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields automatically
});

// ----------------------------------------------------------------------
// 2. Create the Model
// ----------------------------------------------------------------------

const Student = mongoose.model('Student', studentSchema);

// ----------------------------------------------------------------------
// 3. Export the Model
// ----------------------------------------------------------------------

module.exports = Student;