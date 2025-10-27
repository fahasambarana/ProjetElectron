const mongoose = require("mongoose");

const empruntSchema = new mongoose.Schema(
  {
    matricule: { type: String, required: true },
    prenoms: { type: String, required: true },
    date: { type: Date, required: true },
    niveau: { type: String, required: true },
    parcours: { type: String, required: true },
    heureSortie: { type: String, required: true },
    heureEntree: { type: String }, // peut être vide au début
    materiel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stock",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Emprunt", empruntSchema);
