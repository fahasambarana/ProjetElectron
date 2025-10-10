const Emprunt = require("../models/EmpruntModel");
const Stock = require("../models/StockModel");

// Créer un nouvel emprunt (sans modification stock)
exports.createEmprunt = async (req, res) => {
  try {
    const { matricule, prenoms, date, niveau, parcours, heureSortie, materiel } = req.body;
    if (!matricule || !prenoms || !date || !niveau || !parcours || !heureSortie || !materiel) {
      return res.status(400).json({ success: false, message: "Tous les champs sont obligatoires" });
    }
    const stockMateriel = await Stock.findById(materiel);
    if (!stockMateriel) {
      return res.status(404).json({ success: false, message: "Matériel non trouvé" });
    }
    // Pas de modification du stock ici
    const emprunt = await Emprunt.create({ matricule, prenoms, date, niveau, parcours, heureSortie, materiel });
    const empruntPeuple = await Emprunt.findById(emprunt._id).populate("materiel");
    res.status(201).json({ success: true, message: "Emprunt créé avec succès", data: empruntPeuple });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur lors de la création de l'emprunt", error: err.message });
  }
};

// Lister tous les emprunts
exports.getEmprunts = async (req, res) => {
  try {
    const emprunts = await Emprunt.find().populate("materiel").sort({ date: -1, createdAt: -1 });
    res.json({ success: true, count: emprunts.length, data: emprunts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur lors du chargement des emprunts", error: err.message });
  }
};

// Récupérer un emprunt par ID
exports.getEmpruntById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "ID emprunt requis" });
    const emprunt = await Emprunt.findById(id).populate("materiel");
    if (!emprunt) return res.status(404).json({ success: false, message: "Emprunt non trouvé" });
    res.json({ success: true, data: emprunt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur lors de la récupération de l'emprunt", error: err.message });
  }
};

// Mettre à jour un emprunt sans modifier le stock
exports.updateEmprunt = async (req, res) => {
  try {
    const { id } = req.params;
    const { matricule, prenoms, date, niveau, parcours, heureSortie, heureEntree, materiel } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "ID emprunt requis" });

    const existingEmprunt = await Emprunt.findById(id);
    if (!existingEmprunt) return res.status(404).json({ success: false, message: "Emprunt non trouvé" });

    // Pas de gestion du stock ici

    const updatedEmprunt = await Emprunt.findByIdAndUpdate(
      id,
      { matricule, prenoms, date, niveau, parcours, heureSortie, heureEntree, materiel },
      { new: true, runValidators: true }
    ).populate("materiel");

    res.json({ success: true, message: "Emprunt modifié avec succès", data: updatedEmprunt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur lors de la modification de l'emprunt", error: err.message });
  }
};

// Marquer rendu sans réincrémenter le stock
exports.marquerRendu = async (req, res) => {
  try {
    const { id } = req.params;
    const { heureEntree } = req.body;
    if (!id || !heureEntree) return res.status(400).json({ success: false, message: "ID et heure d'entrée requis" });

    const emprunt = await Emprunt.findById(id);
    if (!emprunt) return res.status(404).json({ success: false, message: "Emprunt non trouvé" });
    if (emprunt.heureEntree) return res.status(400).json({ success: false, message: "Déjà rendu" });

    emprunt.heureEntree = heureEntree;
    await emprunt.save();

    // Pas de modification du stock ici

    const empruntPeuple = await Emprunt.findById(emprunt._id).populate("materiel");
    res.json({ success: true, message: "Matériel marqué comme rendu", data: empruntPeuple });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur lors du marquage comme rendu", error: err.message });
  }
};

// Supprimer emprunt sans modifier le stock
exports.deleteEmprunt = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "ID emprunt requis" });

    const emprunt = await Emprunt.findById(id);
    if (!emprunt) return res.status(404).json({ success: false, message: "Emprunt non trouvé" });

    // Pas de modification stock

    await Emprunt.findByIdAndDelete(id);

    res.json({ success: true, message: "Emprunt supprimé avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur lors de la suppression", error: err.message });
  }
};

// Compter tous les emprunts
exports.countEmprunts = async (req, res) => {
  try {
    const count = await Emprunt.countDocuments();
    res.json({ success: true, count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur lors du comptage", error: err.message });
  }
};
