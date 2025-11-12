// models/Equipment.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const equipmentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["Ordinateur", "Projecteur", "Imprimante", "Routeur", "Autre"],
      default: "Autre",
    },
    brand: { type: String, trim: true },
    model: { type: String, trim: true },
    serialNumber: { type: String, unique: true, sparse: true, trim: true },
    specifications: {
      type: Map,
      of: String,
      default: {},
    },
    location: { type: String, trim: true },
    status: {
      type: String,
      enum: ["Disponible", "En utilisation", "En panne", "En maintenance"],
      default: "Disponible",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Equipment", equipmentSchema);
