// server/models/Student.js
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  N_Order: {
    type: String,
    required: true,
    trim: true
  },
  
  Matricule: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^\d{5}-\d{2}-\d{2}$/, 'Le matricule doit être au format 00000-00-00']
  },
  
  Nom_et_Prenoms: {
    type: String,
    required: true,
    trim: true
  },
  
  Telephone: {
    type: String,
    default: null,
    trim: true
  },
  
  Niveau: {
    type: String,
    enum: ['L2', 'M1', 'M2', 'L1', 'L3'],
    default: 'L2'
  },
  
  Parcours: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);