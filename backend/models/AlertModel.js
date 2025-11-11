const mongoose = require('mongoose');

const alerteRetardSchema = new mongoose.Schema({
  emprunt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Emprunt',
    required: true,
    unique: true // Une alerte par emprunt maximum
  },
  matricule: {
    type: String,
    required: true
  },
  prenoms: {
    type: String,
    required: true
  },
  materiel: {
    type: String,
    required: true
  },
  dateRetourPrevue: {
    type: Date,
    required: true
  },
  joursRetard: {
    type: Number,
    required: true,
    min: 10 // Seulement pour les retards de 10+ jours
  },
  dateAlerte: {
    type: Date,
    default: Date.now
  },
  statut: {
    type: String,
    enum: ['active', 'resolue', 'supprimee'],
    default: 'active'
  },
  notifie: {
    type: Boolean,
    default: false
  },
  historique: [{
    action: String,
    date: {
      type: Date,
      default: Date.now
    },
    details: String
  }]
}, {
  timestamps: true
});

// Index composé pour optimiser les recherches
alerteRetardSchema.index({ emprunt: 1 }, { unique: true });
alerteRetardSchema.index({ statut: 1, joursRetard: -1 });
alerteRetardSchema.index({ dateAlerte: -1 });

// Middleware pour ajouter une entrée d'historique
alerteRetardSchema.pre('save', function(next) {
  if (this.isModified('statut')) {
    this.historique.push({
      action: 'changement_statut',
      details: `Statut changé à: ${this.statut}`
    });
  }
  if (this.isModified('joursRetard')) {
    this.historique.push({
      action: 'mise_a_jour_retard',
      details: `Jours de retard mis à jour: ${this.joursRetard}`
    });
  }
  next();
});

// Méthode statique pour créer ou mettre à jour une alerte
alerteRetardSchema.statics.creerOuMettreAJour = async function(emprunt) {
  try {
    const joursRetard = emprunt.getJoursRetard();
    
    if (joursRetard < 10) {
      // Si pas en retard, supprimer l'alerte existante si elle existe
      await this.findOneAndDelete({ emprunt: emprunt._id });
      return null;
    }

    const alerteExistante = await this.findOne({ emprunt: emprunt._id });
    
    if (alerteExistante) {
      // Mettre à jour l'alerte existante
      alerteExistante.joursRetard = joursRetard;
      alerteExistante.statut = 'active';
      await alerteExistante.save();
      return alerteExistante;
    } else {
      // Créer une nouvelle alerte
      const nouvelleAlerte = new this({
        emprunt: emprunt._id,
        matricule: emprunt.matricule,
        prenoms: emprunt.prenoms,
        materiel: emprunt.materiel?.name || 'Matériel inconnu',
        dateRetourPrevue: emprunt.dateRetour,
        joursRetard: joursRetard
      });
      
      await nouvelleAlerte.save();
      return nouvelleAlerte;
    }
  } catch (error) {
    console.error('Erreur création/mise à jour alerte:', error);
    throw error;
  }
};

module.exports = mongoose.model('AlerteRetard', alerteRetardSchema);