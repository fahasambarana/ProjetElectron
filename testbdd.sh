#!/bin/bash
# sync-unilateral.sh

# === CONFIGURATION ===
VOTRE_MACHINE="192.168.0.28"    # Votre IP
AUTRE_MACHINE="192.168.0.25"    # IP de l'autre machine
BASE_DONNEES="stock_db"
# === FIN CONFIGURATION ===

echo "🎯 Votre machine va CHERCHER les données..."

mongosh --eval "

// Se connecter aux deux bases
var votreDB = connect('$VOTRE_MACHINE:27017/$BASE_DONNEES');
var autreDB = connect('$AUTRE_MACHINE:27017/$BASE_DONNEES');

print('📡 Connexion établie vers l\\'autre machine');

var totalRecu = 0;

// Pour chaque collection, COPIER depuis l'autre machine
['events', 'emprunts', 'stocks'].forEach(function(collection) {
    print('\\n📦 ' + collection + ':');
    
    var documentsRecus = 0;
    
    // COPIER tous les documents de l'autre machine vers votre machine
    autreDB[collection].find().forEach(function(doc) {
        // Remplacer ou insérer dans VOTRE base
        var resultat = votreDB[collection].replaceOne(
            { _id: doc._id },
            doc,
            { upsert: true }
        );
        
        if (resultat.upsertedCount > 0) {
            documentsRecus++;
            print('   ➕ Nouveau document reçu');
        } else if (resultat.modifiedCount > 0) {
            documentsRecus++;
            print('   ✏️  Document mis à jour');
        }
    });
    
    print('   ✅ ' + documentsRecus + ' documents reçus');
    totalRecu += documentsRecus;
});

print('\\n🎉 RÉSULTAT:');
print('   ' + totalRecu + ' documents reçus depuis l\\'autre machine');
print('   ✅ Votre base est maintenant à jour');

" --quiet

echo "✅ Synchronisation unilatérale terminée!"
