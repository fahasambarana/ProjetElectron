const express = require('express');
const router = express.Router();
const empruntController = require('../controllers/empruntController');

// GET /api/emprunts - Lister tous les emprunts
router.get('/', empruntController.getEmprunts);

// GET /api/emprunts/:id - Récupérer un emprunt par ID
router.get('/:id', empruntController.getEmpruntById);

// POST /api/emprunts - Créer un nouvel emprunt
router.post('/', empruntController.createEmprunt);

// PUT /api/emprunts/:id - Modifier complètement un emprunt
router.put('/:id', empruntController.updateEmprunt);

// PUT /api/emprunts/rendu/:id - Marquer comme rendu (heure d'entrée seulement)
router.put('/rendu/:id', empruntController.marquerRendu);

// DELETE /api/emprunts/:id - Supprimer un emprunt
router.delete('/:id', empruntController.deleteEmprunt);

module.exports = router;