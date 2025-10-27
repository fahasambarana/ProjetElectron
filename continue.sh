#!/bin/bash
# sync-surveillance.sh

VOTRE_MACHINE="192.168.0.28"
AUTRE_MACHINE="192.168.0.25"
BASE_DONNEES="stock_db"

echo "👀 Surveillance active - Ctrl+C pour arrêter"

while true; do
    echo "$(date +%H:%M:%S) - Vérification des modifications..."
    
    mongosh --eval "
        var votreDB = connect('$VOTRE_MACHINE:27017/$BASE_DONNEES');
        var autreDB = connect('$AUTRE_MACHINE:27017/$BASE_DONNEES');
        
        var modifications = 0;
        
        // Vérifier chaque collection
        ['events','emprunts','stocks'].forEach(function(coll) {
            autreDB[coll].find().forEach(function(doc) {
                var result = votreDB[coll].replaceOne(
                    {_id: doc._id}, 
                    doc, 
                    {upsert: true}
                );
                if (result.modifiedCount > 0 || result.upsertedCount > 0) {
                    modifications++;
                }
            });
        });
        
        if (modifications > 0) {
            print('🔄 ' + modifications + ' modifications importées');
        }
    " --quiet
    
    sleep 10  # Vérifier toutes les 10 secondes
done
