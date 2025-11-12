const Emprunt = require("../models/EmpruntModel");
const Alerte = require("../models/AlertModel");

// Vérifier les retards et créer des alertes
exports.verifierRetards = async () => {
  try {
    console.log("🔍 Vérification des emprunts en retard...");
    
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0); // Remettre à minuit pour la comparaison
    
    // Calculer la date limite (10 jours avant aujourd'hui)
    const dateLimite = new Date(aujourdhui);
    dateLimite.setDate(aujourdhui.getDate() - 10);
    
    console.log("📅 Date limite pour les retards:", dateLimite.toLocaleDateString('fr-FR'));

    // 🔥 CORRECTION : Trouver les emprunts en retard de PLUS de 10 jours
    const empruntsEnRetard = await Emprunt.find({
      heureEntree: { $exists: false }, // Non rendus
      dateRetour: { 
        $exists: true, // Date de retour doit exister
        $lt: dateLimite // Date de retour AVANT la date limite (plus de 10 jours)
      }
    }).populate('materiel');

    console.log(`📊 ${empruntsEnRetard.length} emprunts en retard de plus de 10 jours trouvés`);

    // Afficher les détails pour debug
    empruntsEnRetard.forEach(emprunt => {
      const joursRetard = Math.floor((aujourdhui - new Date(emprunt.dateRetour)) / (1000 * 60 * 60 * 24));
      console.log(`   - ${emprunt.matricule}: ${joursRetard} jours de retard (date retour: ${new Date(emprunt.dateRetour).toLocaleDateString('fr-FR')})`);
    });

    // Créer des alertes pour chaque emprunt en retard
    let alertesCreees = 0;
    for (const emprunt of empruntsEnRetard) {
      // Vérifier si une alerte existe déjà pour cet emprunt
      const alerteExistante = await Alerte.findOne({
        emprunt: emprunt._id,
        resolu: false
      });

      if (!alerteExistante) {
        // Calculer le nombre de jours de retard
        const joursRetard = Math.floor((aujourdhui - new Date(emprunt.dateRetour)) / (1000 * 60 * 60 * 24));
        
        // Créer une nouvelle alerte
        await Alerte.create({
          emprunt: emprunt._id,
          matricule: emprunt.matricule,
          prenoms: emprunt.prenoms,
          materiel: emprunt.materiel,
          dateRetourPrevue: emprunt.dateRetour,
          joursRetard: joursRetard,
          type: 'retard',
          message: `Emprunt en retard de ${joursRetard} jours`,
          resolu: false
        });
        
        console.log(`⚠️ Alerte créée pour ${emprunt.matricule} - ${joursRetard} jours de retard`);
        alertesCreees++;
      }
    }

    console.log(`✅ ${alertesCreees} nouvelles alertes créées`);
    return empruntsEnRetard.length;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des retards:', error);
    throw error;
  }
};

// Récupérer les alertes actives
exports.getAlertesActives = async () => {
  try {
    const alertes = await Alerte.find({
      resolu: false
    })
    .populate('emprunt')
    .populate('materiel')
    .sort({ joursRetard: -1, createdAt: -1 }); // Trier par jours de retard décroissant

    console.log(`🔔 ${alertes.length} alertes actives trouvées`);
    
    // Log pour debug
    alertes.forEach(alerte => {
      console.log(`   - ${alerte.matricule}: ${alerte.joursRetard} jours de retard`);
    });
    
    return alertes;
  } catch (error) {
    console.error('❌ Erreur récupération alertes:', error);
    throw error;
  }
};

// Résoudre une alerte
exports.resoudreAlerte = async (empruntId) => {
  try {
    const result = await Alerte.updateMany(
      { 
        emprunt: empruntId,
        resolu: false 
      },
      { 
        resolu: true,
        dateResolution: new Date()
      }
    );
    console.log(`✅ ${result.modifiedCount} alertes résolues pour l'emprunt ${empruntId}`);
  } catch (error) {
    console.error('❌ Erreur résolution alerte:', error);
    throw error;
  }
};