// routes/AuthRoute.js
const express = require('express');
const User = require('../models/UserModel')
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { authMiddleware } = require("../middlewares/AuthMiddleware"); // Changement ici

router.post('/register', register);
router.post('/login', login);
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

module.exports = router;