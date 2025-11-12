const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stockController");
const upload = require("../middlewares/multer"); // Middleware pour l'upload d'images

// Routes pour les stocks
router.post("/", upload.single("photo"), stockController.createStock);
router.get("/", stockController.getStocks);
router.get("/:id", stockController.getStockById);
router.put("/:id", upload.single("photo"), stockController.updateStock);
router.delete("/:id", stockController.deleteStock);
router.get("/count", stockController.countStocks);

module.exports = router;