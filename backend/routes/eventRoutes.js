const express = require("express");
const {
  createEvent,
  getEvents,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");

const router = express.Router();

router.post("/", createEvent);       // ➕ Ajouter
router.get("/", getEvents);          // 📌 Lister
router.put("/:id", updateEvent);     // ✏️ Modifier
router.delete("/:id", deleteEvent);  // 🗑 Supprimer

module.exports = router;
