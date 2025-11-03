// middlewares/AuthMiddleware.js
const jwt = require("jsonwebtoken");

// Middleware pour les utilisateurs normaux
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Token manquant" });

  const token = authHeader.split(" ")[1]; // Bearer XXX
  if (!token) return res.status(401).json({ message: "Token manquant" });

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_KEY || process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
}

// Middleware spécifique pour les étudiants
function studentAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Token manquant" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token manquant" });

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_KEY || process.env.JWT_SECRET);
    
    // Vérifier que c'est bien un token étudiant
    if (decoded.type !== 'student') {
      return res.status(403).json({ message: "Accès réservé aux étudiants" });
    }
    
    req.userId = decoded.id;
    req.userType = decoded.type;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
}

module.exports = { authMiddleware, studentAuthMiddleware };