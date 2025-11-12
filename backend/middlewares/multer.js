const multer = require("multer");
const path = require("path");

// 📁 Dossier de stockage
const stockage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // ex: 1699801234567.png
  }
});

// 🔒 Filtrer les fichiers (images uniquement)
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Format non supporté. Images seulement."));
  }
};

module.exports = multer({
  storage: stockage,
  fileFilter,
});
