const mongoose = require("mongoose");
const Emprunt = require("../models/EmpruntModel");
const Stock = require("../models/StockModel");
const AlerteService = require("../services/alertServices");

// Créer un nouvel emprunt avec diminution du stock - CORRIGÉ
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
      materiel, // ID du matériel
    } = req.body;

    // Validation des champs obligatoires
    if (!matricule || !prenoms || !dateEmprunt || !materiel) {
      return res.status(400).json({
        success: false,
        message:
          "Matricule, prénoms, date d'emprunt et matériel sont obligatoires",
      });
    }

    // Vérifier si le matériel existe et stock suffisant
    const stockMateriel = await Stock.findById(materiel);
    if (!stockMateriel) {
      return res.status(404).json({
        success: false,
        message: "Matériel non trouvé",
      });
    }

    // Vérifier si le stock est suffisant
    if (stockMateriel.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: "Stock insuffisant pour ce matériel",
      });
    }

    // Diminuer le stock de manière atomique (CORRECTION)
    // Utilisation de findByIdAndUpdate et $inc pour éviter l'erreur de validation 'type'
    const stockMaterielMisAJour = await Stock.findByIdAndUpdate(
      materiel,
      { $inc: { stock: -1 } }, // Décrémente le stock de 1
      { new: true }
    );

    if (!stockMaterielMisAJour) {
        // Redondance pour gérer un cas limite (si le doc Stock a disparu entre le find et l'update)
        return res.status(404).json({
          success: false,
          message: "Erreur critique : Matériel non trouvé lors de la mise à jour du stock",
        });
    }

    // Créer l'emprunt
    const emprunt = await Emprunt.create({
      matricule,
      prenoms,
      dateEmprunt,
      dateRetour,
      niveau,
      parcours,
      heureSortie:
        heureSortie || new Date().toTimeString().split(" ")[0].substring(0, 5),
      materiel,
    });

    const empruntPeuple = await Emprunt.findById(emprunt._id).populate(
      "materiel"
    );

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
        message: "ID emprunt requis",
      });
    }

    // 🔥 VALIDATION ObjectId AVANT la recherche
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID emprunt invalide",
        error: `L'ID "${id}" n'est pas un format valide`,
      });
    }

    const emprunt = await Emprunt.findById(id).populate("materiel");
    if (!emprunt) {
      return res.status(404).json({
        success: false,
        message: "Emprunt non trouvé",
      });
    }

    res.json({
      success: true,
      data: emprunt,
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
        message: "ID emprunt requis",
      });
    }

    // Validation ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID emprunt invalide",
      });
    }

    const existingEmprunt = await Emprunt.findById(id);
    if (!existingEmprunt) {
      return res.status(404).json({
        success: false,
        message: "Emprunt non trouvé",
      });
    }

    // Si le matériel change, gérer le stock
    if (materiel && materiel !== existingEmprunt.materiel.toString()) {
      // Réincrémenter l'ancien stock seulement si l'emprunt n'était pas rendu
      if (!existingEmprunt.heureEntree) {
            // Utilisation de findByIdAndUpdate et $inc pour l'ancien matériel
        const ancienMateriel = await Stock.findByIdAndUpdate(
            existingEmprunt.materiel,
            { $inc: { stock: 1 } },
            { new: true }
        );
        if (ancienMateriel) {
          console.log("✅ Ancien stock réincrémenté");
        }
      }

      // Diminuer le nouveau stock seulement si l'emprunt n'est pas rendu
      if (!heureEntree) {
        const nouveauMateriel = await Stock.findById(materiel);
        if (!nouveauMateriel) {
          return res.status(404).json({
            success: false,
            message: "Nouveau matériel non trouvé",
          });
        }
        if (nouveauMateriel.stock <= 0) {
          return res.status(400).json({
            success: false,
            message: "Stock insuffisant pour le nouveau matériel",
          });
        }
        
        // Utilisation de findByIdAndUpdate et $inc pour le nouveau matériel
        const nouveauMaterielMisAJour = await Stock.findByIdAndUpdate(
            materiel,
            { $inc: { stock: -1 } },
            { new: true }
        );
        if (!nouveauMaterielMisAJour) {
             return res.status(500).json({
                success: false,
                message: "Erreur lors de la décrémentation du nouveau stock",
            });
        }
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

    const updatedEmprunt = await Emprunt.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("materiel");

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

// Marquer rendu avec réincrémentation du stock - CORRIGÉ
exports.marquerCommeRendu = async (req, res) => {
  try {
    const { id } = req.params;
    const { heureEntree, dateRetourEffective } = req.body;

    console.log("🔄 Marquer comme rendu - Début");
    console.log("ID:", id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID emprunt requis",
      });
    }

    // Validation ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID emprunt invalide",
      });
    }

    const emprunt = await Emprunt.findById(id);
    if (!emprunt) {
      return res.status(404).json({
        success: false,
        message: "Emprunt non trouvé",
      });
    }

    if (emprunt.heureEntree) {
      return res.status(400).json({
        success: false,
        message: "Cet emprunt a déjà été marqué comme rendu",
      });
    }

    // Réincrémenter le stock de manière atomique (CORRECTION)
    const materielMisAJour = await Stock.findByIdAndUpdate(
      emprunt.materiel,
      { $inc: { stock: 1 } }, // Incrémente le stock de 1
      { new: true } // Retourne le document mis à jour
    );

    if (materielMisAJour) {
      console.log("✅ Stock réincrémenté pour le matériel:", materielMisAJour.name);
    } else {
      console.warn("⚠️ Matériel non trouvé lors de la réincrémentation du stock:", emprunt.materiel);
    }
    
    // Préparer les données de mise à jour de l'emprunt
    const updateData = {
      heureEntree:
        heureEntree || new Date().toTimeString().split(" ")[0].substring(0, 5),
      dateRetourEffective: dateRetourEffective
        ? new Date(dateRetourEffective)
        : new Date(),
    };

    console.log("📝 Données de mise à jour de l'emprunt:", updateData);

    const empruntRendu = await Emprunt.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("materiel");

    console.log("✅ Emprunt mis à jour avec succès");

    // Résoudre l'alerte si elle existe
    try {
      await AlerteService.resoudreAlerte(id);
      console.log("✅ Alerte résolue si existante");
    } catch (alerteError) {
      console.warn(
        "⚠️ Aucune alerte à résoudre ou erreur:",
        alerteError.message
      );
    }

    res.json({
      success: true,
      message: "Matériel marqué comme rendu avec succès",
      data: empruntRendu,
    });
  } catch (error) {
    console.error("❌ Erreur marquer comme rendu:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du marquage comme rendu",
      error: error.message,
    });
  }
};

// Supprimer emprunt avec réincrémentation du stock - CORRIGÉ
exports.deleteEmprunt = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID emprunt requis",
      });
    }

    // Validation ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID emprunt invalide",
      });
    }

    const emprunt = await Emprunt.findById(id);
    if (!emprunt) {
      return res.status(404).json({
        success: false,
        message: "Emprunt non trouvé",
      });
    }

    // Si l'emprunt n'a pas été rendu, réincrémenter le stock de manière atomique
    if (!emprunt.heureEntree) {
        const materielMisAJour = await Stock.findByIdAndUpdate(
            emprunt.materiel,
            { $inc: { stock: 1 } },
            { new: true }
        );
        if (materielMisAJour) {
          console.log("✅ Stock réincrémenté lors de la suppression");
        } else {
            console.warn("⚠️ Matériel non trouvé lors de la réincrémentation du stock à la suppression:", emprunt.materiel);
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

// Compter tous les emprunts - UNE SEULE FOIS
exports.countEmprunts = async (req, res) => {
  try {
    const count = await Emprunt.countDocuments();

    res.status(200).json({
      success: true,
      count: count,
      message: `Nombre total d'emprunts récupéré avec succès`
    });
  } catch (error) {
    console.error('Erreur comptage emprunts:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors du comptage des emprunts",
      error: error.message
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
          as: "materielInfo",
        },
      },
      {
        $unwind: "$materielInfo",
      },
      {
        $group: {
          _id: "$materiel",
          nomMateriel: { $first: "$materielInfo.name" },
          total: { $sum: 1 },
          enCours: {
            $sum: { $cond: [{ $eq: ["$heureEntree", null] }, 1, 0] },
          },
          rendus: {
            $sum: { $cond: [{ $ne: ["$heureEntree", null] }, 1, 0] },
          },
        },
      },
      {
        $sort: { total: -1 },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalEmprunts,
        empruntsEnCours,
        empruntsRendus,
        statsMateriel,
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
    const { search } = req.query;
    
    if (!search) {
      return res.status(400).json({
        success: false,
        message: "Terme de recherche requis"
      });
    }

    const emprunts = await Emprunt.find({
      $or: [
        { matricule: { $regex: search, $options: 'i' } },
        { prenoms: { $regex: search, $options: 'i' } },
        { niveau: { $regex: search, $options: 'i' } },
        { parcours: { $regex: search, $options: 'i' } }
      ]
    }).populate("materiel").sort({ createdAt: -1 });

    res.json({
      success: true,
      count: emprunts.length,
      data: emprunts,
    });
  } catch (error) {
    console.error("Erreur recherche emprunts:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la recherche des emprunts",
      error: error.message
    });
  }
};

// Compter les emprunts en retard - CORRIGÉ
exports.countEmpruntsEnRetard = async (req, res) => {
  try {
    const aujourdHui = new Date();
    
    // CORRECTION: Utiliser les champs existants de votre modèle
    const count = await Emprunt.countDocuments({
      dateRetour: { $lt: aujourdHui }, // dateRetour au lieu de dateRetourPrevue
      heureEntree: { $exists: false } // pas encore rendu
    });

    res.status(200).json({
      success: true,
      count: count,
      message: `Nombre d'emprunts en retard récupéré avec succès`
    });
  } catch (error) {
    console.error('Erreur comptage emprunts en retard:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors du comptage des emprunts en retard",
      error: error.message
    });
  }
};