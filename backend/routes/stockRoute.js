// stockRoutes.js

const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const upload = require('../middlewares/multer'); 
const mongoose = require('mongoose');

// Middleware de validation ObjectId : vérifie si l'ID est un identifiant MongoDB valide.
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  
  if (id && !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "ID invalide",
      error: `L'ID "${id}" n'est pas un identifiant valide`
    });
  }
  next();
};

// =================================================================
// 🚀 ROUTES STATIQUES (doivent être placées avant /:id)
// =================================================================

// Compte le nombre total de stocks
router.get('/count', stockController.countStocks);
// Alternative de comptage sous le groupe /stats
router.get('/stats/count', stockController.countStocks); 
// Récupère d'autres statistiques
router.get('/stats/statistiques', stockController.getStats);
// Effectue une recherche
router.get('/search', stockController.searchStocks);

// =================================================================
// 📦 ROUTES SANS PARAMÈTRES (Collection)
// =================================================================

// GET / : Récupère tous les stocks
router.get('/', stockController.getStocks);

// POST / : Crée un nouveau stock. Utilise Multer pour gérer l'upload d'une seule image nommée 'photo'.
router.post('/', 
  upload.single('photo'), 
  stockController.createStock
);

// =================================================================
// 🎯 ROUTES AVEC PARAMÈTRES (Ressource individuelle)
// =================================================================

// Middleware validateObjectId est appliqué en premier pour toutes les routes avec :id

// GET /:id : Récupère un stock par son ID
router.get('/:id', 
  validateObjectId, 
  stockController.getStockById
);

// PUT /:id : Met à jour un stock. Utilise Multer si l'utilisateur souhaite changer le fichier 'photo'.
router.put('/:id', 
  validateObjectId, 
  upload.single('photo'), 
  stockController.updateStock
);

// DELETE /:id : Supprime un stock par son ID
router.delete('/:id', 
  validateObjectId, 
  stockController.deleteStock
);

module.exports = router;