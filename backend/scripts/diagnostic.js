const mongoose = require('mongoose');
const Emprunt = require('../models/EmpruntModel');

async function diagnosticRetards() {
  try {
    await mongoose.connect('mongodb://localhost:27017/stock_db');
    
    console.log('=== DIAGNOSTIC RETARDS ===\n');
    
    // Récupérer tous les emprunts non rendus
    const empruntsNonRendus = await Emprunt.find({ 
      heureEntree: { $exists: false } 
    });
    
    console.log(`Emprunts non rendus trouvés: ${empruntsNonRendus.length}\n`);
    
    const aujourdHui = new Date();
    console.log(`Date d'aujourd'hui: ${aujourdHui.toLocaleDateString('fr-FR')}\n`);
    
    for (const emprunt of empruntsNonRendus) {
      const dateRetour = new Date(emprunt.dateRetour);
      const joursRetard = Math.ceil((aujourdHui - dateRetour) / (1000 * 60 * 60 * 24));
      
      console.log(`📋 Emprunt ${emprunt._id}:`);
      console.log(`   - Matricule: ${emprunt.matricule}`);
      console.log(`   - Date emprunt: ${new Date(emprunt.dateEmprunt).toLocaleDateString('fr-FR')}`);
      console.log(`   - Date retour: ${dateRetour.toLocaleDateString('fr-FR')}`);
      console.log(`   - Jours de retard: ${joursRetard}`);
      console.log(`   - En retard (>10 jours): ${joursRetard >= 10}`);
      console.log('---');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Erreur:', error);
  }
}

diagnosticRetards();