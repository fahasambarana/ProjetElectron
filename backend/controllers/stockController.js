const mongoose = require("mongoose");
const Stock = require("../models/StockModel");

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

// Créer un nouveau stock
exports.createStock = async (req, res) => {
  try {
    const { name, description, stock, seuil } = req.body;

    // Validation des champs obligatoires
    if (!name || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: "Nom et stock sont obligatoires",
      });
    }

    const nouveauStock = await Stock.create({
      name,
      description,
      stock,
      seuil: seuil || 5,
    });

    res.status(201).json({
      success: true,
      message: "Stock créé avec succès",
      data: nouveauStock,
    });
  } catch (err) {
    console.error("Erreur création stock:", err);
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

// Mettre à jour un stock
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, stock, seuil } = req.body;

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

    const updatedStock = await Stock.findByIdAndUpdate(
      id,
      { name, description, stock, seuil },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Stock modifié avec succès",
      data: updatedStock,
    });
  } catch (err) {
    console.error("Erreur modification stock:", err);
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
    const stocksFaibles = await Stock.countDocuments({
      stock: { $lte: 5 } // Stocks à 5 ou moins
    });
    const stocksDisponibles = await Stock.countDocuments({
      stock: { $gt: 0 }
    });

    res.json({
      success: true,
      data: {
        totalStocks,
        stocksFaibles,
        stocksDisponibles,
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