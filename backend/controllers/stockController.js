const Stock = require("../models/StockModel");

// Créer un nouveau stock
exports.createStock = async (req, res) => {
  try {
    const { name, stock, threshold } = req.body;
    if (!name || stock == null || threshold == null) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }
    const newStock = new Stock({ name, stock, threshold });
    const saved = await newStock.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Récupérer tous les stocks
exports.getStocks = async (req, res) => {
  try {
    const stocks = await Stock.find().sort({ createdAt: -1 });
    res.json(stocks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Mettre à jour un stock
exports.updateStock = async (req, res) => {
  try {
    const { name, stock, threshold } = req.body;
    if (!name || stock == null || threshold == null) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    const updatedStock = await Stock.findByIdAndUpdate(
      req.params.id,
      { name, stock, threshold },
      { new: true } // retourne le document mis à jour
    );

    if (!updatedStock) return res.status(404).json({ message: "Stock introuvable" });

    res.json(updatedStock);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
exports.getStockById = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      return res.status(404).json({ message: "Stock non trouvé" });
    }
    res.json(stock);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};



// Supprimer un stock
exports.deleteStock = async (req, res) => {
  console.log("Requête DELETE reçue avec id :", req.params.id);
  try {
    const { id } = req.params;
    const stock = await Stock.findByIdAndDelete(id);
    if (!stock) return res.status(404).json({ message: "Stock non trouvé" });
    res.json({ message: "Stock supprimé avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
