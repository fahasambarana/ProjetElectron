const AlerteService = require("../services/alertServices");

// Vérifier manuellement les retards
exports.verifierRetards = async (req, res) => {
  try {
    console.log("🔄 Vérification manuelle des retards demandée");
    
    const nombreRetards = await AlerteService.verifierRetards();
    
    res.json({
      success: true,
      message: `Vérification terminée - ${nombreRetards} emprunts en retard trouvés`,
      data: { nombreRetards }
    });
  } catch (error) {
    console.error("❌ Erreur vérification retards:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification des retards",
      error: error.message
    });
  }
};

// Récupérer les alertes actives
exports.getAlertesActives = async (req, res) => {
  try {
    const alertes = await AlerteService.getAlertesActives();
    
    res.json({
      success: true,
      count: alertes.length,
      data: alertes
    });
  } catch (error) {
    console.error("❌ Erreur récupération alertes:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des alertes",
      error: error.message
    });
  }
};