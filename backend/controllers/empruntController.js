const mongoose = require('mongoose');
const Emprunt = require("../models/EmpruntModel");
const Stock = require("../models/StockModel");
const AlerteService = require("../services/alertServices");

// Créer un nouvel emprunt avec diminution du stock
exports.createEmprunt = async (req, res) => {
  try {
    const {
      matricule,
      prenoms,
      dateEmprunt,
      dateRetour,
      niveau,
      parcours,
      heureSortie,
      materiel,
    } = req.body;

    // Validation des champs obligatoires
    if (!matricule || !prenoms || !dateEmprunt || !materiel) {
      return res.status(400).json({ 
        success: false, 
        message: "Matricule, prénoms, date d'emprunt et matériel sont obligatoires" 
      });
    }

    // Vérifier si le matériel existe
    const stockMateriel = await Stock.findById(materiel);
    if (!stockMateriel) {
      return res.status(404).json({ 
        success: false, 
        message: "Matériel non trouvé" 
      });
    }

    // Vérifier si le stock est suffisant
    if (stockMateriel.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: "Stock insuffisant pour ce matériel",
      });
    }

    // Diminuer le stock
    stockMateriel.stock -= 1;
    await stockMateriel.save();

    // Créer l'emprunt
    const emprunt = await Emprunt.create({
      matricule,
      prenoms,
      dateEmprunt,
      dateRetour,
      niveau,
      parcours,
      heureSortie: heureSortie || new Date().toTimeString().split(' ')[0].substring(0, 5),
      materiel,
    });

    const empruntPeuple = await Emprunt.findById(emprunt._id).populate("materiel");

    res.status(201).json({
      success: true,
      message: "Emprunt créé avec succès",
      data: empruntPeuple,
    });
  } catch (err) {
    console.error("Erreur création emprunt:", err);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'emprunt",
      error: err.message,
    });
  }
};

// Lister tous les emprunts
exports.getEmprunts = async (req, res) => {
  try {
    const emprunts = await Emprunt.find()
      .populate("materiel")
      .sort({ createdAt: -1, dateEmprunt: -1 });

    res.json({
      success: true,
      count: emprunts.length,
      data: emprunts,
    });
  } catch (err) {
    console.error("Erreur récupération emprunts:", err);
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des emprunts",
      error: err.message,
    });
  }
};

// Récupérer un emprunt par ID - AVEC VALIDATION ObjectId
exports.getEmpruntById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log("🔍 Recherche emprunt avec ID:", id);

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: "ID emprunt requis" 
      });
    }

    // 🔥 VALIDATION ObjectId AVANT la recherche
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "ID emprunt invalide",
        error: `L'ID "${id}" n'est pas un format valide`
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
    console.error("❌ Erreur récupération emprunt:", err);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'emprunt",
      error: err.message,
    });
  }
};

// Mettre à jour un emprunt - CORRIGÉE
exports.updateEmprunt = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      matricule,
      prenoms,
      dateEmprunt,
      dateRetour,
      dateRetourEffective, // 🔥 ACCEPTER dateRetourEffective
      niveau,
      parcours,
      heureSortie,
      heureEntree,
      materiel,
    } = req.body;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: "ID emprunt requis" 
      });
    }

    // Validation ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "ID emprunt invalide" 
      });
    }

    const existingEmprunt = await Emprunt.findById(id);
    if (!existingEmprunt) {
      return res.status(404).json({ 
        success: false, 
        message: "Emprunt non trouvé" 
      });
    }

    // Si le matériel change, gérer le stock
    if (materiel && materiel !== existingEmprunt.materiel.toString()) {
      // Réincrémenter l'ancien stock seulement si l'emprunt n'était pas rendu
      if (!existingEmprunt.heureEntree) {
        const ancienMateriel = await Stock.findById(existingEmprunt.materiel);
        if (ancienMateriel) {
          ancienMateriel.stock += 1;
          await ancienMateriel.save();
        }
      }

      // Diminuer le nouveau stock seulement si l'emprunt n'est pas rendu
      if (!heureEntree) {
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
            message: "Stock insuffisant pour le nouveau matériel",
          });
        }
        nouveauMateriel.stock -= 1;
        await nouveauMateriel.save();
      }
    }

    // 🔥 CORRECTION: Préparer les données de mise à jour
    const updateData = {
      matricule,
      prenoms,
      dateEmprunt,
      dateRetour,
      niveau,
      parcours,
      heureSortie,
      heureEntree,
      materiel,
    };

    // 🔥 CORRECTION: Gestion avancée de dateRetourEffective
    if (dateRetourEffective) {
      // Si dateRetourEffective est fournie, l'utiliser
      updateData.dateRetourEffective = new Date(dateRetourEffective);
    } else if (heureEntree && !existingEmprunt.heureEntree) {
      // Si heureEntree est définie mais pas dateRetourEffective, utiliser la date actuelle
      updateData.dateRetourEffective = new Date();
    } else if (!heureEntree && existingEmprunt.heureEntree) {
      // Si on retire heureEntree, retirer aussi dateRetourEffective
      updateData.dateRetourEffective = undefined;
    }
    // Si heureEntree existe déjà et dateRetourEffective n'est pas fournie, laisser la valeur existante

    const updatedEmprunt = await Emprunt.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("materiel");

    res.json({
      success: true,
      message: "Emprunt modifié avec succès",
      data: updatedEmprunt,
    });
  } catch (err) {
    console.error("Erreur modification emprunt:", err);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la modification de l'emprunt",
      error: err.message,
    });
  }
};

// Marquer rendu avec réincrémentation du stock
exports.marquerCommeRendu = async (req, res) => {
  try {
    const { id } = req.params;
    const { heureEntree, dateRetourEffective } = req.body;

    console.log("🔄 Marquer comme rendu - Début");
    console.log("ID:", id);

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: "ID emprunt requis" 
      });
    }

    // Validation ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "ID emprunt invalide" 
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
        message: "Cet emprunt a déjà été marqué comme rendu" 
      });
    }

    // Réincrémenter le stock
    const materiel = await Stock.findById(emprunt.materiel);
    if (materiel) {
      materiel.stock += 1;
      await materiel.save();
      console.log("✅ Stock réincrémenté pour le matériel:", materiel.name);
    }

    // Préparer les données de mise à jour
    const updateData = {
      heureEntree: heureEntree || new Date().toTimeString().split(' ')[0].substring(0, 5),
      dateRetourEffective: dateRetourEffective ? new Date(dateRetourEffective) : new Date()
    };

    console.log("📝 Données de mise à jour:", updateData);

    const empruntRendu = await Emprunt.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("materiel");

    console.log("✅ Emprunt mis à jour avec succès");

    // Résoudre l'alerte si elle existe
    try {
      await AlerteService.resoudreAlerte(id);
      console.log("✅ Alerte résolue si existante");
    } catch (alerteError) {
      console.warn("⚠️ Aucune alerte à résoudre ou erreur:", alerteError.message);
    }

    res.json({
      success: true,
      message: 'Matériel marqué comme rendu avec succès',
      data: empruntRendu
    });

  } catch (error) {
    console.error("❌ Erreur marquer comme rendu:", error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage comme rendu',
      error: error.message
    });
  }
};

// Supprimer emprunt avec réincrémentation du stock
exports.deleteEmprunt = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: "ID emprunt requis" 
      });
    }

    // Validation ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "ID emprunt invalide" 
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
      const materiel = await Stock.findById(emprunt.materiel);
      if (materiel) {
        materiel.stock += 1;
        await materiel.save();
        console.log("✅ Stock réincrémenté lors de la suppression");
      }
    }

    await Emprunt.findByIdAndDelete(id);

    // Résoudre les alertes liées à cet emprunt
    try {
      await AlerteService.resoudreAlerte(id);
    } catch (alerteError) {
      console.warn("⚠️ Erreur résolution alerte:", alerteError.message);
    }

    res.json({
      success: true,
      message: "Emprunt supprimé avec succès",
    });
  } catch (err) {
    console.error("Erreur suppression emprunt:", err);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression",
      error: err.message,
    });
  }
};

// Compter tous les emprunts
exports.countEmprunts = async (req, res) => {
  try {
    const total = await Emprunt.countDocuments();
    const enCours = await Emprunt.countDocuments({ heureEntree: { $exists: false } });
    const rendus = await Emprunt.countDocuments({ heureEntree: { $exists: true } });

    res.json({ 
      success: true, 
      data: {
        total,
        enCours,
        rendus
      }
    });
  } catch (err) {
    console.error("Erreur comptage emprunts:", err);
    res.status(500).json({
      success: false,
      message: "Erreur lors du comptage",
      error: err.message,
    });
  }
};

// Statistiques des emprunts
exports.getStats = async (req, res) => {
  try {
    const totalEmprunts = await Emprunt.countDocuments();
    const empruntsEnCours = await Emprunt.countDocuments({
      heureEntree: { $exists: false },
    });
    const empruntsRendus = await Emprunt.countDocuments({
      heureEntree: { $exists: true },
    });

    // Statistiques par matériel
    const statsMateriel = await Emprunt.aggregate([
      {
        $lookup: {
          from: "stocks",
          localField: "materiel",
          foreignField: "_id",
          as: "materielInfo"
        }
      },
      {
        $unwind: "$materielInfo"
      },
      {
        $group: {
          _id: "$materiel",
          nomMateriel: { $first: "$materielInfo.name" },
          total: { $sum: 1 },
          enCours: {
            $sum: { $cond: [{ $eq: ["$heureEntree", null] }, 1, 0] }
          },
          rendus: {
            $sum: { $cond: [{ $ne: ["$heureEntree", null] }, 1, 0] }
          }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalEmprunts,
        empruntsEnCours,
        empruntsRendus,
        statsMateriel
      },
    });
  } catch (err) {
    console.error("Erreur statistiques emprunts:", err);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: err.message,
    });
  }
};

// Recherche avancée d'emprunts
exports.searchEmprunts = async (req, res) => {
  try {
    const { search, statut, dateDebut, dateFin } = req.query;
    
    let query = {};

    // Filtre par statut
    if (statut === 'rendu') {
      query.heureEntree = { $exists: true };
    } else if (statut === 'non-rendu') {
      query.heureEntree = { $exists: false };
    }

    // Filtre par date
    if (dateDebut || dateFin) {
      query.dateEmprunt = {};
      if (dateDebut) query.dateEmprunt.$gte = new Date(dateDebut);
      if (dateFin) query.dateEmprunt.$lte = new Date(dateFin);
    }

    // Recherche texte
    if (search) {
      query.$or = [
        { matricule: { $regex: search, $options: 'i' } },
        { prenoms: { $regex: search, $options: 'i' } },
      ];
    }

    const emprunts = await Emprunt.find(query)
      .populate("materiel")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: emprunts.length,
      data: emprunts,
    });
  } catch (err) {
    console.error("Erreur recherche emprunts:", err);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la recherche des emprunts",
      error: err.message,
    });
  }
};