const express = require('express');
const router = express.Router();
const empruntController = require('../controllers/empruntController');
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

// ✅ ROUTES STATIQUES EN PREMIER (TRÈS IMPORTANT)
router.get('/count', empruntController.countEmprunts);
router.get('/stats/count', empruntController.countEmprunts);
router.get('/stats/statistiques', empruntController.getStats);
router.get('/search', empruntController.searchEmprunts);

// ✅ ROUTES SANS PARAMÈTRES
router.get('/', empruntController.getEmprunts);
router.post('/', empruntController.createEmprunt);

// ✅ ROUTES AVEC PARAMÈTRES SPÉCIFIQUES
router.put('/rendu/:id', validateObjectId, empruntController.marquerCommeRendu);

// ✅ ROUTES AVEC PARAMÈTRES GÉNÉRIQUES (EN DERNIER)
router.get('/:id', validateObjectId, empruntController.getEmpruntById);
router.put('/:id', validateObjectId, empruntController.updateEmprunt);
router.delete('/:id', validateObjectId, empruntController.deleteEmprunt);

module.exports = router;