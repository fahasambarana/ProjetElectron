const Emprunt = require("../models/EmpruntModel");
const Stock = require("../models/StockModel");

// ------------------------
// Créer un nouvel emprunt
// ------------------------
// EmpruntController.js
exports.createEmprunt = async (req, res) => {
  try {
    const emprunt = await Emprunt.create(req.body);
    // Recharger et peupler le matériel
    const empruntPeuple = await Emprunt.findById(emprunt._id).populate("materiel");
    res.status(201).json(empruntPeuple);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ------------------------
// Lister tous les emprunts
// ------------------------
exports.getEmprunts = async (req, res) => {
  try {
    const emprunts = await Emprunt.find().populate("materiel");
    res.json(emprunts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------------
// Récupérer un emprunt par ID
// ------------------------
exports.getEmpruntById = async (req, res) => {
  try {
    const emprunt = await Emprunt.findById(req.params.id).populate("materiel");
    if (!emprunt) {
      return res.status(404).json({ message: "Emprunt non trouvé" });
    }
    res.json(emprunt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------------
// Mettre à jour l'heure d'entrée (retour matériel)
// ------------------------
exports.updateHeureEntree = async (req, res) => {
  try {
    const { id } = req.params;
    const { heureEntree } = req.body;

    const emprunt = await Emprunt.findById(id);
    if (!emprunt) {
      return res.status(404).json({ message: "Emprunt non trouvé" });
    }

    if (emprunt.heureEntree) {
      return res.status(400).json({ message: "Ce matériel a déjà été rendu" });
    }

    emprunt.heureEntree = heureEntree;
    await emprunt.save();

    const stock = await Stock.findById(emprunt.materiel);
    if (stock) {
      stock.stock += 1;
      await stock.save();
    }

    // Recharger avec population
    const empruntPeuple = await Emprunt.findById(emprunt._id).populate("materiel");
    res.json(empruntPeuple);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------------
// Supprimer un emprunt
// ------------------------
// DELETE /api/emprunts/:id
exports.deleteEmprunt = async (req, res) => {
  try {
    const emprunt = await Emprunt.findByIdAndDelete(req.params.id);

    if (!emprunt) {
      return res.status(404).json({ message: "Emprunt introuvable" });
    }

    res.json({ message: "Emprunt supprimé avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la suppression" });
  }
};
exports.rendu = async (req, res) => {
  try {
    const emprunt = await Emprunt.findById(req.params.id);
    if (!emprunt) return res.status(404).json({ message: "Emprunt non trouvé" });

    emprunt.heureEntree = req.body.heureEntree;
    await emprunt.save();

    // Recharger avec population
    const empruntPeuple = await Emprunt.findById(emprunt._id).populate("materiel");
    res.json(empruntPeuple);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
