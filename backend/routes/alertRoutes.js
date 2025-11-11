const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

// Vérifier les retards
router.get('/verifier-retards', alertController.verifierRetards);

// Récupérer les alertes actives
router.get('/alertes-actives', alertController.getAlertesActives);

module.exports = router;