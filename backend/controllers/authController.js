// controllers/AuthController.js
const User = require('../models/UserModel');
const bcrypt = require('bcryptjs');
const { createSecretToken } = require('../util/SecretToken');

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    // Vérifier les champs obligatoires
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }
    // Vérifier existence de l'utilisateur
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Utilisateur déjà existant." });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hash });
    const token = createSecretToken(user._id);
    return res.status(201).json({ user, token });
  } catch (error) {
    console.error("Erreur register:", error); // log pour debug
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Vérifier les champs obligatoires
    if (!email || !password) {
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Identifiants incorrects." });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Identifiants incorrects." });
    }
    const token = createSecretToken(user._id);
    return res.status(200).json({ user, token });
  } catch (error) {
    console.error("Erreur login:", error); // log pour debug
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
