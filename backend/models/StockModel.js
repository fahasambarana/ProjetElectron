const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["PC", "Projecteur", "Switch", "Adaptateur", "Routeur", "Autre"],
    },
    stock: { type: Number, required: true, min: 0 },
    threshold: { type: Number, required: true, min: 0 },

    specifications: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: new Map(), 
    },

    photo: {
      type: String, // URL de la photo
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Stock", stockSchema);
