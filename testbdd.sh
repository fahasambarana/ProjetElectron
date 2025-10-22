#!/bin/bash
# sync-unilateral.sh

# === CONFIGURATION ===
VOTRE_MACHINE="192.168.0.28"    # Votre IP
AUTRE_MACHINE="192.168.0.25"    # IP de l'autre machine
BASE_DONNEES="stock_db"
# === FIN CONFIGURATION ===

echo "🎯 Vérification de la connexion MongoDB..."

# Vérifier si MongoDB est en cours d'exécution localement
if ! mongosh --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; then
    echo "❌ ERREUR: MongoDB n'est pas en cours d'exécution localement"
    echo "   Démarrez MongoDB avec: sudo systemctl start mongod"
    exit 1
fi

echo "✅ MongoDB est en cours d'exécution"
echo "🎯 Votre machine va CHERCHER les données..."

mongosh --eval "

print('📡 Connexion à l\\'autre machine...');

try {
    // Se connecter uniquement à l'autre machine (source)
    var autreDB = connect('$AUTRE_MACHINE:27017/$BASE_DONNEES');
    print('✅ Connecté à l\\'autre machine');
    
    // Utiliser la base de données locale directement
    var votreDB = db.getSiblingDB('$BASE_DONNEES');
    print('✅ Base locale prête');
    
    var totalRecu = 0;

    // Pour chaque collection, COPIER depuis l'autre machine
    ['events', 'emprunts', 'stocks'].forEach(function(collection) {
        print('\\n📦 ' + collection + ':');
        
        var documentsRecus = 0;
        var erreurs = 0;
        
        // COPIER tous les documents de l'autre machine vers votre machine
        autreDB[collection].find().forEach(function(doc) {
            try {
                // Remplacer ou insérer dans VOTRE base
                var resultat = votreDB[collection].replaceOne(
                    { _id: doc._id },
                    doc,
                    { upsert: true }
                );
                
                if (resultat.upsertedCount > 0) {
                    documentsRecus++;
                } else if (resultat.modifiedCount > 0) {
                    documentsRecus++;
                }
            } catch (e) {
                erreurs++;
                print('   ❌ Erreur avec document: ' + e.message);
            }
        });
        
        print('   ✅ ' + documentsRecus + ' documents reçus');
        if (erreurs > 0) {
            print('   ❌ ' + erreurs + ' erreurs');
        }
        totalRecu += documentsRecus;
    });

    print('\\n🎉 RÉSULTAT:');
    print('   ' + totalRecu + ' documents reçus depuis l\\'autre machine');
    print('   ✅ Votre base est maintenant à jour');

} catch (e) {
    print('❌ ERREUR DE CONNEXION: ' + e.message);
    print('   Vérifiez que:');
    print('   1. L\\'autre machine (' + '$AUTRE_MACHINE' + ') est allumée');
    print('   2. MongoDB est en cours d\\'exécution sur l\\'autre machine');
    print('   3. Le firewall permet les connexions sur le port 27017');
}

" --quiet

echo "✅ Synchronisation unilatérale terminée!"