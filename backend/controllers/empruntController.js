const Emprunt = require("../models/EmpruntModel");
const Stock = require("../models/StockModel");

// Créer un nouvel emprunt avec diminution du stock
exports.createEmprunt = async (req, res) => {
  try {
    const { matricule, prenoms, dateEmprunt, niveau, parcours, heureSortie, materiel } = req.body;
    
    // Validation des champs obligatoires
    if (!matricule || !dateEmprunt ) {
      return res.status(400).json({ success: false, message: "Tous les champs sont obligatoires" });
    }

    // Vérifier si le matériel existe
    const stockMateriel = await Stock.findById(materiel);
    if (!stockMateriel) {
      return res.status(404).json({ success: false, message: "Matériel non trouvé" });
    }

    // Vérifier si le stock est suffisant
    if (stockMateriel.stock <= 0) {
      return res.status(400).json({ success: false, message: "Stock insuffisant pour ce matériel" });
    }

    // Diminuer le stock
    stockMateriel.stock -= 1;
    await stockMateriel.save();

    // Créer l'emprunt
    const emprunt = await Emprunt.create({ 
      matricule, 
      prenoms, 
      dateEmprunt, 
      niveau, 
      parcours, 
      heureSortie, 
      materiel 
    });
    
    const empruntPeuple = await Emprunt.findById(emprunt._id).populate("materiel");
    
    res.status(201).json({ 
      success: true, 
      message: "Emprunt créé avec succès", 
      data: empruntPeuple 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la création de l'emprunt", 
      error: err.message 
    });
  }
};

// Lister tous les emprunts
exports.getEmprunts = async (req, res) => {
  try {
    const emprunts = await Emprunt.find()
      .populate("materiel")
      .sort({ dateEmprunt: -1, createdAt: -1 });
    
    res.json({ 
      success: true, 
      count: emprunts.length, 
      data: emprunts 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors du chargement des emprunts", 
      error: err.message 
    });
  }
};

// Récupérer un emprunt par ID
exports.getEmpruntById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "ID emprunt requis" });
    }
    
    const emprunt = await Emprunt.findById(id).populate("materiel");
    if (!emprunt) {
      return res.status(404).json({ success: false, message: "Emprunt non trouvé" });
    }
    
    res.json({ success: true, data: emprunt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la récupération de l'emprunt", 
      error: err.message 
    });
  }
};

// Mettre à jour un emprunt
exports.updateEmprunt = async (req, res) => {
  try {
    const { id } = req.params;
    const { matricule, prenoms, dateEmprunt, dateRetour, niveau, parcours, heureSortie, heureEntree, materiel } = req.body;
    
    if (!id) {
      return res.status(400).json({ success: false, message: "ID emprunt requis" });
    }

    const existingEmprunt = await Emprunt.findById(id);
    if (!existingEmprunt) {
      return res.status(404).json({ success: false, message: "Emprunt non trouvé" });
    }

    // Si le matériel change, gérer le stock
    if (materiel && materiel !== existingEmprunt.materiel.toString()) {
      // Réincrémenter l'ancien stock
      const ancienMateriel = await Stock.findById(existingEmprunt.materiel);
      if (ancienMateriel) {
        ancienMateriel.stock += 1;
        await ancienMateriel.save();
      }

      // Diminuer le nouveau stock
      const nouveauMateriel = await Stock.findById(materiel);
      if (!nouveauMateriel) {
        return res.status(404).json({ success: false, message: "Nouveau matériel non trouvé" });
      }
      if (nouveauMateriel.stock <= 0) {
        return res.status(400).json({ success: false, message: "Stock insuffisant pour le nouveau matériel" });
      }
      nouveauMateriel.stock -= 1;
      await nouveauMateriel.save();
    }

    const updatedEmprunt = await Emprunt.findByIdAndUpdate(
      id,
      { 
        matricule, 
        prenoms, 
        dateEmprunt, 
        dateRetour, 
        niveau, 
        parcours, 
        heureSortie, 
        heureEntree, 
        materiel 
      },
      { new: true, runValidators: true }
    ).populate("materiel");

    res.json({ 
      success: true, 
      message: "Emprunt modifié avec succès", 
      data: updatedEmprunt 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la modification de l'emprunt", 
      error: err.message 
    });
  }
};

// Marquer rendu avec réincrémentation du stock
// Marquer rendu avec réincrémentation du stock
exports.marquerRendu = async (req, res) => {
  try {
    const { id } = req.params;
    const { heureEntree } = req.body;
    
    if (!id || !heureEntree) {
      return res.status(400).json({ success: false, message: "ID et heure d'entrée requis" });
    }

    const emprunt = await Emprunt.findById(id);
    if (!emprunt) {
      return res.status(404).json({ success: false, message: "Emprunt non trouvé" });
    }
    
    if (emprunt.heureEntree) {
      return res.status(400).json({ success: false, message: "Déjà rendu" });
    }

    // Réincrémenter le stock
    const materiel = await Stock.findById(emprunt.materiel);
    if (materiel) {
      materiel.stock += 1;
      await materiel.save();
    }

    // Mettre à jour l'emprunt avec l'heure d'entrée et la date de retour
    const dateRetour = new Date(); // Date actuelle pour le retour
    
    const updatedEmprunt = await Emprunt.findByIdAndUpdate(
      id,
      {
        heureEntree: heureEntree,
        dateRetour: dateRetour // Ajouter explicitement la date de retour
      },
      { new: true, runValidators: true } // Retourner le document mis à jour
    ).populate("materiel");

    res.json({ 
      success: true, 
      message: "Matériel marqué comme rendu et stock réapprovisionné", 
      data: updatedEmprunt 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors du marquage comme rendu", 
      error: err.message 
    });
  }
};
// Supprimer emprunt avec réincrémentation du stock
exports.deleteEmprunt = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "ID emprunt requis" });
    }

    const emprunt = await Emprunt.findById(id);
    if (!emprunt) {
      return res.status(404).json({ success: false, message: "Emprunt non trouvé" });
    }

    // Si l'emprunt n'a pas été rendu, réincrémenter le stock
    if (!emprunt.heureEntree) {
      const materiel = await Stock.findById(emprunt.materiel);
      if (materiel) {
        materiel.stock += 1;
        await materiel.save();
      }
    }

    await Emprunt.findByIdAndDelete(id);

    res.json({ 
      success: true, 
      message: "Emprunt supprimé avec succès" 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la suppression", 
      error: err.message 
    });
  }
};

// Compter tous les emprunts
exports.countEmprunts = async (req, res) => {
  try {
    const count = await Emprunt.countDocuments();
    res.json({ success: true, count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors du comptage", 
      error: err.message 
    });
  }
};

// Statistiques des emprunts
exports.getStats = async (req, res) => {
  try {
    const totalEmprunts = await Emprunt.countDocuments();
    const empruntsEnCours = await Emprunt.countDocuments({ heureEntree: { $exists: false } });
    const empruntsRendus = await Emprunt.countDocuments({ heureEntree: { $exists: true } });
    
    res.json({
      success: true,
      data: {
        totalEmprunts,
        empruntsEnCours,
        empruntsRendus
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la récupération des statistiques", 
      error: err.message 
    });
  }
};