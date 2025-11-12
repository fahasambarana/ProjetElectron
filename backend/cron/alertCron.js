const cron = require('node-cron');
const AlerteService = require('../services/alertServices');

// Vérifier les retards tous les jours à 8h00
cron.schedule('0 8 * * *', async () => {
  console.log('Vérification des emprunts en retard...');
  try {
    const alertes = await AlerteService.verifierEmpruntsEnRetard();
    console.log(`${alertes.length} nouvelle(s) alerte(s) de retard créée(s)`);
    
    // Ici vous pourriez ajouter l'envoi d'emails ou notifications
  } catch (error) {
    console.error('Erreur lors de la vérification cron des retards:', error);
  }
});

// Nettoyage des anciennes alertes tous les dimanches à 2h00
cron.schedule('0 2 * * 0', async () => {
  console.log('Nettoyage des anciennes alertes...');
  try {
    await AlerteService.nettoyerAnciennesAlertes();
    console.log('Nettoyage des alertes terminé');
  } catch (error) {
    console.error('Erreur lors du nettoyage des alertes:', error);
  }
});