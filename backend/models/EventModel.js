const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    parcours: { type: String, required: true },
    niveau: { type: String, required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    groupe: { type: String, default: "" }, // optionnel
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
