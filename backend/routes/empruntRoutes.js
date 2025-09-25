const express = require("express");
const router = express.Router();
const empruntController = require("../controllers/empruntController");

// Créer un nouvel emprunt
router.post("/", empruntController.createEmprunt);

// Lister tous les emprunts
router.get("/", empruntController.getEmprunts);

router.put("/rendu/:id", empruntController.rendu);

// Récupérer un emprunt par ID
router.get("/:id", empruntController.getEmpruntById);

// Mettre à jour l'heure d'entrée (retour matériel)
router.put("/:id/retour", empruntController.updateHeureEntree);

// Supprimer un emprunt
router.delete("/:id", empruntController.deleteEmprunt);

module.exports = router;
