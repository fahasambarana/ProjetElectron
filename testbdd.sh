#!/bin/bash
# sync-unilateral-auto-complete.sh

# === CONFIGURATION ===
MACHINE_A="192.168.0.8"
MACHINE_B="192.168.0.28"
BASE_DONNEES="stock_db"
MONGO_PORT="27017"
# === FIN CONFIGURATION ===

get_current_ip() {
    IP1=$(hostname -I | awk '{print $1}')
    IP2=$(ip route get 1 | awk '{print $7}' | head -1)
    
    for ip in "$IP1" "$IP2"; do
        if [[ $ip =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo "$ip"
            return
        fi
    done
    
    echo "127.0.0.1"
}

CURRENT_IP=$(get_current_ip)
echo "🏠 Machine actuelle: $CURRENT_IP"

if [ "$CURRENT_IP" = "$MACHINE_A" ]; then
    MA_MACHINE="$MACHINE_A"
    AUTRE_MACHINE="$MACHINE_B"
    echo "🔍 Identifié comme: Machine A"
else
    MA_MACHINE="$MACHINE_B"
    AUTRE_MACHINE="$MACHINE_A"
    echo "🔍 Identifié comme: Machine B"
fi

echo "🎯 Votre machine ($MA_MACHINE) va CHERCHER les données depuis $AUTRE_MACHINE"

# Vérifier la connexion réseau
echo "🔍 Test de connexion à $AUTRE_MACHINE..."
if ! ping -c 1 -W 2 "$AUTRE_MACHINE" > /dev/null 2>&1; then
    echo "❌ Impossible de joindre $AUTRE_MACHINE"
    exit 1
fi
echo "✅ Autre machine accessible"

# Vérifier si MongoDB écoute sur l'autre machine
echo "🔍 Test de MongoDB sur $AUTRE_MACHINE:$MONGO_PORT..."
if ! nc -z -w 5 "$AUTRE_MACHINE" "$MONGO_PORT" 2>/dev/null; then
    echo "❌ MongoDB n'est pas accessible sur $AUTRE_MACHINE:$MONGO_PORT"
    echo "   Vérifiez que:"
    echo "   1. MongoDB est démarré sur $AUTRE_MACHINE"
    echo "   2. bindIp: 0.0.0.0 dans /etc/mongod.conf"
    echo "   3. Le port 27017 est ouvert dans le firewall"
    exit 1
fi
echo "✅ MongoDB accessible sur l'autre machine"

# Lancer la synchronisation
mongosh --eval "

print('📡 Connexion à MongoDB sur ' + '$AUTRE_MACHINE' + '...');

try {
    // URL de connexion complète
    var autreUrl = 'mongodb://' + '$AUTRE_MACHINE' + ':27017/' + '$BASE_DONNEES';
    var autreDB = connect(autreUrl);
    print('✅ Connecté à l\\'autre machine: ' + autreUrl);
    
    // Utiliser la base de données locale
    var maDB = db.getSiblingDB('$BASE_DONNEES');
    print('✅ Base locale prête');
    
    var totalRecu = 0;
    
    // LISTE COMPLÈTE DES COLLECTIONS À SYNCHRONISER
    var collectionsSync = ['events', 'emprunts', 'stocks', 'students'];
    
    // Afficher les collections disponibles sur l'autre machine
    print('\\n📋 Collections disponibles sur l\\'autre machine:');
    var collectionsDisponibles = autreDB.getCollectionNames();
    collectionsDisponibles.forEach(function(coll) {
        print('   - ' + coll + ' (' + autreDB[coll].countDocuments() + ' documents)');
    });

    collectionsSync.forEach(function(collection) {
        print('\\n📦 Synchronisation: ' + collection);
        
        // Vérifier si la collection existe sur l'autre machine
        if (collectionsDisponibles.indexOf(collection) === -1) {
            print('   ⚠️  Collection non trouvée sur l\\'autre machine');
            return;
        }
        
        var documentsRecus = 0;
        var erreurs = 0;
        
        var countAvant = maDB[collection].countDocuments();
        var countSource = autreDB[collection].countDocuments();
        
        print('   📊 Source: ' + countSource + ' documents');
        print('   📊 Local avant: ' + countAvant + ' documents');
        
        autreDB[collection].find().forEach(function(doc) {
            try {
                var resultat = maDB[collection].replaceOne(
                    { _id: doc._id },
                    doc,
                    { upsert: true }
                );
                
                if (resultat.upsertedCount > 0 || resultat.modifiedCount > 0) {
                    documentsRecus++;
                }
            } catch (e) {
                erreurs++;
                if (erreurs <= 3) {
                    print('   ❌ Erreur document: ' + e.message);
                }
            }
        });
        
        var countApres = maDB[collection].countDocuments();
        
        print('   📊 Local après: ' + countApres + ' documents');
        print('   ✅ ' + documentsRecus + ' documents synchronisés');
        if (erreurs > 0) {
            print('   ⚠️  ' + erreurs + ' erreurs');
        }
        totalRecu += documentsRecus;
    });

    print('\\n🎉 SYNCHRONISATION TERMINÉE:');
    print('   ' + totalRecu + ' documents reçus depuis $AUTRE_MACHINE');
    
    // Résumé final
    print('\\n📊 RÉSUMÉ FINAL:');
    collectionsSync.forEach(function(collection) {
        var countLocal = maDB[collection].countDocuments();
        print('   ' + collection + ': ' + countLocal + ' documents');
    });

} catch (e) {
    print('❌ ERREUR CONNEXION: ' + e.message);
    print('   Détails: ' + JSON.stringify(e));
}

" --quiet

if [ $? -eq 0 ]; then
    echo "✅ Script terminé avec succès!"
else
    echo "❌ Erreur lors de l'exécution du script"
    exit 1
fi