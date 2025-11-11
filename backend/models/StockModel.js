const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Le nom du matériel est obligatoire"],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  stock: {
    type: Number,
    required: [true, "Le stock est obligatoire"],
    min: [0, "Le stock ne peut pas être négatif"]
  },
  category: {
    type: String,
    trim: true
  },
  disponible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour optimiser les recherches
stockSchema.index({ name: 1 });
stockSchema.index({ category: 1 });
stockSchema.index({ disponible: 1 });

module.exports = mongoose.model('Stock', stockSchema);