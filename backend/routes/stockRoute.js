const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const mongoose = require('mongoose');

// Middleware de validation ObjectId
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

// ✅ ROUTES STATIQUES EN PREMIER
router.get('/count', stockController.countStocks);
router.get('/stats/count', stockController.countStocks);
router.get('/stats/statistiques', stockController.getStats);
router.get('/search', stockController.searchStocks);

// ✅ ROUTES SANS PARAMÈTRES
router.get('/', stockController.getStocks);
router.post('/', stockController.createStock);

// ✅ ROUTES AVEC PARAMÈTRES GÉNÉRIQUES
router.get('/:id', validateObjectId, stockController.getStockById);
router.put('/:id', validateObjectId, stockController.updateStock);
router.delete('/:id', validateObjectId, stockController.deleteStock);

module.exports = router;