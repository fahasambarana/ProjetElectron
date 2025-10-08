const Emprunt = require("../models/EmpruntModel");
const Stock = require("../models/StockModel");

// ------------------------
// Créer un nouvel emprunt
// ------------------------
exports.createEmprunt = async (req, res) => {
  try {
    const { matricule, prenoms, date, niveau, parcours, heureSortie, materiel } = req.body;

    // Validation des champs requis
    if (!matricule || !prenoms || !date || !niveau || !parcours || !heureSortie || !materiel) {
      return res.status(400).json({ 
        success: false,
        message: "Tous les champs sont obligatoires" 
      });
    }

    // Vérifier si le matériel existe et a du stock
    const stockMateriel = await Stock.findById(materiel);
    if (!stockMateriel) {
      return res.status(404).json({ 
        success: false,
        message: "Matériel non trouvé" 
      });
    }

    if (stockMateriel.stock <= 0) {
      return res.status(400).json({ 
        success: false,
        message: "Stock insuffisant pour ce matériel" 
      });
    }

    // Créer l'emprunt
    const emprunt = await Emprunt.create({
      matricule,
      prenoms,
      date,
      niveau,
      parcours,
      heureSortie,
      materiel
    });

    // Décrémenter le stock
    stockMateriel.stock -= 1;
    await stockMateriel.save();

    // Recharger avec population
    const empruntPeuple = await Emprunt.findById(emprunt._id).populate("materiel");
    
    res.status(201).json({
      success: true,
      message: "Emprunt créé avec succès",
      data: empruntPeuple
    });

  } catch (err) {
    console.error("Erreur création emprunt:", err);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la création de l'emprunt",
      error: err.message 
    });
  }
};

// ------------------------
// Lister tous les emprunts
// ------------------------
exports.getEmprunts = async (req, res) => {
  try {
    const emprunts = await Emprunt.find()
      .populate("materiel")
      .sort({ date: -1, createdAt: -1 }); // Tri par date décroissante

    res.json({
      success: true,
      count: emprunts.length,
      data: emprunts
    });

  } catch (err) {
    console.error("Erreur récupération emprunts:", err);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors du chargement des emprunts",
      error: err.message 
    });
  }
};

// ------------------------
// Récupérer un emprunt par ID
// ------------------------
exports.getEmpruntById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: "ID emprunt requis" 
      });
    }

    const emprunt = await Emprunt.findById(id).populate("materiel");
    
    if (!emprunt) {
      return res.status(404).json({ 
        success: false,
        message: "Emprunt non trouvé" 
      });
    }

    res.json({
      success: true,
      data: emprunt
    });

  } catch (err) {
    console.error("Erreur récupération emprunt:", err);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la récupération de l'emprunt",
      error: err.message 
    });
  }
};

// ------------------------
// Mettre à jour un emprunt (COMPLET)
// ------------------------
exports.updateEmprunt = async (req, res) => {
  try {
    const { id } = req.params;
    const { matricule, prenoms, date, niveau, parcours, heureSortie, heureEntree, materiel } = req.body;

    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: "ID emprunt requis" 
      });
    }

    // Vérifier si l'emprunt existe
    const existingEmprunt = await Emprunt.findById(id);
    if (!existingEmprunt) {
      return res.status(404).json({ 
        success: false,
        message: "Emprunt non trouvé" 
      });
    }

    // Gestion des stocks si le matériel change
    if (materiel && existingEmprunt.materiel.toString() !== materiel) {
      const ancienMaterielId = existingEmprunt.materiel;
      const nouveauMateriel = await Stock.findById(materiel);

      if (!nouveauMateriel) {
        return res.status(404).json({ 
          success: false,
          message: "Nouveau matériel non trouvé" 
        });
      }

      if (nouveauMateriel.stock <= 0) {
        return res.status(400).json({ 
          success: false,
          message: "Stock insuffisant pour le nouveau matériel" 
        });
      }

      // Réincrémenter l'ancien stock
      await Stock.findByIdAndUpdate(ancienMaterielId, { $inc: { stock: 1 } });
      
      // Décrémenter le nouveau stock
      await Stock.findByIdAndUpdate(materiel, { $inc: { stock: -1 } });
    }

    // Mettre à jour l'emprunt
    const updatedEmprunt = await Emprunt.findByIdAndUpdate(
      id,
      {
        matricule,
        prenoms,
        date,
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
    console.error("Erreur modification emprunt:", err);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la modification de l'emprunt",
      error: err.message 
    });
  }
};

// ------------------------
// Marquer comme rendu (heure d'entrée seulement)
// ------------------------
exports.marquerRendu = async (req, res) => {
  try {
    const { id } = req.params;
    const { heureEntree } = req.body;

    if (!id || !heureEntree) {
      return res.status(400).json({ 
        success: false,
        message: "ID emprunt et heure d'entrée requis" 
      });
    }

    const emprunt = await Emprunt.findById(id);
    if (!emprunt) {
      return res.status(404).json({ 
        success: false,
        message: "Emprunt non trouvé" 
      });
    }

    if (emprunt.heureEntree) {
      return res.status(400).json({ 
        success: false,
        message: "Ce matériel a déjà été rendu" 
      });
    }

    // Mettre à jour l'heure d'entrée
    emprunt.heureEntree = heureEntree;
    await emprunt.save();

    // Réincrémenter le stock
    await Stock.findByIdAndUpdate(emprunt.materiel, { $inc: { stock: 1 } });

    // Recharger avec population
    const empruntPeuple = await Emprunt.findById(emprunt._id).populate("materiel");
    
    res.json({
      success: true,
      message: "Matériel marqué comme rendu avec succès",
      data: empruntPeuple
    });

  } catch (err) {
    console.error("Erreur marquer rendu:", err);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors du marquage comme rendu",
      error: err.message 
    });
  }
};

// ------------------------
// Supprimer un emprunt
// ------------------------
exports.deleteEmprunt = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: "ID emprunt requis" 
      });
    }

    const emprunt = await Emprunt.findById(id);
    if (!emprunt) {
      return res.status(404).json({ 
        success: false,
        message: "Emprunt non trouvé" 
      });
    }

    // Si l'emprunt n'a pas été rendu, réincrémenter le stock
    if (!emprunt.heureEntree) {
      await Stock.findByIdAndUpdate(emprunt.materiel, { $inc: { stock: 1 } });
    }

    await Emprunt.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Emprunt supprimé avec succès"
    });

  } catch (err) {
    console.error("Erreur suppression emprunt:", err);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la suppression de l'emprunt",
      error: err.message 
    });
  }
};