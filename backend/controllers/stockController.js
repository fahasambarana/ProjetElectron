const Stock = require("../models/StockModel"); 
const fs = require("fs");

// ✅ CREATE — Ajouter un stock avec image (CORRIGÉ)
exports.createStock = async (req, res) => {
  try {
    const { name, type, stock, threshold, specifications } = req.body;

    const photo = req.file ? req.file.path : null;

    // Gérer les spécifications si envoyées en JSON stringifié
    let specs = {};
    if (specifications) {
      try {
        specs = JSON.parse(specifications);
      } catch (parseError) {
        console.warn("Erreur parsing specifications:", parseError);
      }
    }

    // ✅ CORRECTION : Inclure le champ 'type' qui est requis
    const newStock = new Stock({ 
      name, 
      type, // ✅ Maintenant inclus
      stock: Number(stock),
      threshold: Number(threshold),
      specifications: specs,
      photo 
    });
    
    const saved = await newStock.save();

    res.status(201).json({
      message: "Stock ajouté avec succès ✅",
      data: saved,
    });
  } catch (error) {
    console.error("Erreur création stock:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Données invalides", 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ UPDATE — Modifier un stock + remplacer l'ancienne image (CORRIGÉ)
exports.updateStock = async (req, res) => {
  try {
    const { name, type, stock, threshold, specifications } = req.body;

    const existingStock = await Stock.findById(req.params.id);
    if (!existingStock) return res.status(404).json({ message: "Stock introuvable" });

    // Gérer les spécifications
    let specs = existingStock.specifications;
    if (specifications) {
      try {
        specs = JSON.parse(specifications);
      } catch (parseError) {
        console.warn("Erreur parsing specifications:", parseError);
      }
    }

    // Si une nouvelle image est uploadée → supprimer l'ancienne
    if (req.file && existingStock.photo && fs.existsSync(existingStock.photo)) {
      fs.unlinkSync(existingStock.photo);
    }

    // ✅ CORRECTION : Mettre à jour tous les champs requis
    existingStock.name = name ?? existingStock.name;
    existingStock.type = type ?? existingStock.type; // ✅ Maintenant inclus
    existingStock.stock = stock !== undefined ? Number(stock) : existingStock.stock;
    existingStock.threshold = threshold !== undefined ? Number(threshold) : existingStock.threshold;
    existingStock.specifications = specs;
    existingStock.photo = req.file ? req.file.path : existingStock.photo;

    const updated = await existingStock.save();

    res.json({
      message: "Stock modifié ✅",
      data: updated,
    });
  } catch (error) {
    console.error("Erreur modification stock:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Données invalides", 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ READ — Tous les stocks
exports.getStocks = async (req, res) => {
  try {
    const stocks = await Stock.find().sort({ createdAt: -1 });
    res.json(stocks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ READ — Stock par ID
exports.getStockById = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) return res.status(404).json({ message: "Stock introuvable" });

    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ DELETE — Supprimer stock + supprimer photo du disque
exports.deleteStock = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) return res.status(404).json({ message: "Stock introuvable" });

    // Supprimer la photo du serveur si elle existe
    if (stock.photo && fs.existsSync(stock.photo)) {
      fs.unlinkSync(stock.photo);
    }

    await stock.deleteOne();

    res.json({ message: "Stock supprimé ✅" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ Compter les stocks
exports.countStocks = async (req, res) => {
  try {
    const count = await Stock.countDocuments();
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};