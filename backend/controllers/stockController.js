const mongoose = require("mongoose");
const Stock = require("../models/StockModel");
const fs = require("fs");
const path = require("path");

// Compter tous les stocks
exports.countStocks = async (req, res) => {
  try {
    console.log("🔢 Début comptage stocks");
    
    const count = await Stock.countDocuments();
    
    console.log(`✅ Nombre de stocks trouvés: ${count}`);
    
    res.status(200).json({
      success: true,
      count: count,
      message: `Nombre total de stocks récupéré avec succès`
    });
  } catch (error) {
    console.error('❌ Erreur comptage stocks:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors du comptage des stocks",
      error: error.message
    });
  }
};

// Obtenir tous les stocks
exports.getStocks = async (req, res) => {
  try {
    const stocks = await Stock.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: stocks.length,
      data: stocks,
    });
  } catch (err) {
    console.error("Erreur récupération stocks:", err);
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des stocks",
      error: err.message,
    });
  }
};

// ✅ CORRECTION : Créer un nouveau stock avec le nouveau modèle
exports.createStock = async (req, res) => {
  try {
    console.log("📥 Données reçues:", req.body);
    console.log("📸 Fichier reçu:", req.file);

    // ✅ CORRECTION : Extraire les champs du nouveau modèle
    const { 
      name, 
      type, 
      stock, 
      threshold, 
      specifications = "{}" 
    } = req.body;

    // Validation des champs obligatoires
    if (!name || !type || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: "Nom, type et stock sont obligatoires",
      });
    }

    // ✅ CORRECTION : Gérer les spécifications
    let specs = {};
    try {
      specs = specifications ? JSON.parse(specifications) : {};
    } catch (parseError) {
      console.warn("Erreur parsing specifications:", parseError);
      specs = {};
    }

    const photo = req.file ? req.file.path : null;

    const nouveauStock = await Stock.create({
      name,
      type,
      stock: Number(stock),
      threshold: Number(threshold) || 0,
      specifications: specs,
      photo
    });

    res.status(201).json({
      success: true,
      message: "Stock créé avec succès",
      data: nouveauStock,
    });
  } catch (err) {
    console.error("Erreur création stock:", err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Données de validation invalides",
        errors: err.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du stock",
      error: err.message,
    });
  }
};

// Récupérer un stock par ID
exports.getStockById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID stock requis",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID stock invalide",
      });
    }

    const stock = await Stock.findById(id);
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock non trouvé",
      });
    }

    res.json({
      success: true,
      data: stock,
    });
  } catch (err) {
    console.error("Erreur récupération stock:", err);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du stock",
      error: err.message,
    });
  }
};

// ✅ CORRECTION : Mettre à jour un stock avec le nouveau modèle
exports.updateStock = async (req, res) => {
  try {
    console.log("📥 Mise à jour stock - Body:", req.body);
    console.log("📥 Mise à jour stock - File:", req.file);
    console.log("📥 Mise à jour stock - Params:", req.params);

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID stock requis",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID stock invalide",
      });
    }

    const existingStock = await Stock.findById(id);
    if (!existingStock) {
      return res.status(404).json({
        success: false,
        message: "Stock non trouvé",
      });
    }

    // ✅ CORRECTION : Extraire avec valeurs par défaut
    const { 
      name = existingStock.name, 
      type = existingStock.type, 
      stock = existingStock.stock, 
      threshold = existingStock.threshold, 
      specifications = JSON.stringify(existingStock.specifications)
    } = req.body || {};

    // ✅ CORRECTION : Gérer les spécifications
    let specs = existingStock.specifications;
    try {
      if (specifications && specifications !== "{}") {
        specs = JSON.parse(specifications);
      }
    } catch (parseError) {
      console.warn("Erreur parsing specifications:", parseError);
      // Garder les anciennes spécifications en cas d'erreur
    }

    // ✅ CORRECTION : Si une nouvelle image est uploadée → supprimer l'ancienne
    if (req.file && existingStock.photo) {
      // Supprimer l'ancienne photo du système de fichiers
      const oldPhotoPath = path.join(__dirname, '..', existingStock.photo);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    const updateData = {
      name,
      type,
      stock: Number(stock),
      threshold: Number(threshold),
      specifications: specs,
      ...(req.file && { photo: req.file.path }) // Mettre à jour la photo seulement si nouvelle
    };

    const updatedStock = await Stock.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Stock modifié avec succès",
      data: updatedStock,
    });
  } catch (err) {
    console.error("❌ Erreur modification stock:", err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Données de validation invalides",
        errors: err.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Erreur lors de la modification du stock",
      error: err.message,
    });
  }
};

// Supprimer un stock
exports.deleteStock = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID stock requis",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID stock invalide",
      });
    }

    const stock = await Stock.findById(id);
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock non trouvé",
      });
    }

    // ✅ CORRECTION : Supprimer aussi la photo du système de fichiers
    if (stock.photo) {
      const photoPath = path.join(__dirname, '..', stock.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await Stock.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Stock supprimé avec succès",
    });
  } catch (err) {
    console.error("Erreur suppression stock:", err);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression",
      error: err.message,
    });
  }
};

// Recherche de stocks
exports.searchStocks = async (req, res) => {
  try {
    const { search } = req.query;
    
    if (!search) {
      return res.status(400).json({
        success: false,
        message: "Terme de recherche requis"
      });
    }

    const stocks = await Stock.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: stocks.length,
      data: stocks,
    });
  } catch (error) {
    console.error("Erreur recherche stocks:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la recherche des stocks",
      error: error.message
    });
  }
};

// Statistiques des stocks
exports.getStats = async (req, res) => {
  try {
    const totalStocks = await Stock.countDocuments();
    
    // ✅ CORRECTION : Adapter les statistiques au nouveau modèle
    const stocksFaibles = await Stock.countDocuments({
      $expr: { $lte: ["$stock", "$threshold"] },
      stock: { $gt: 0 }
    });
    
    const stocksRupture = await Stock.countDocuments({
      stock: 0
    });
    
    const stocksDisponibles = await Stock.countDocuments({
      stock: { $gt: 0 }
    });

    // Statistiques par type
    const statsByType = await Stock.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalStock: { $sum: "$stock" }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalStocks,
        stocksFaibles,
        stocksRupture,
        stocksDisponibles,
        statsByType
      },
    });
  } catch (err) {
    console.error("Erreur statistiques stocks:", err);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: err.message,
    });
  }
};