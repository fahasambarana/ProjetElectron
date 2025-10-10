const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stockController");

router.get("/count", stockController.countStocks)
router.get("/", stockController.getStocks);        // liste tous les stocks
router.get("/:id", stockController.getStockById);  // récupérer un stock
router.post("/", stockController.createStock);     // créer un stock
router.put("/:id", stockController.updateStock);   // mettre à jour un stock
router.delete("/:id", stockController.deleteStock);// supprimer un stock

module.exports = router;
