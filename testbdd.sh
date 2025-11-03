#!/bin/bash
# sync-unilateral-auto.sh

# === CONFIGURATION ===
MACHINE_A="192.168.0.28"
MACHINE_B="192.168.0.8"
BASE_DONNEES="stock_db"
# === FIN CONFIGURATION ===

# Fonction pour obtenir l'IP de la machine actuelle
get_current_ip() {
    # Plusieurs méthodes pour obtenir l'IP
    IP1=$(hostname -I | awk '{print $1}')
    IP2=$(ip route get 1 | awk '{print $7}' | head -1)
    
    # Prendre la première IP valide
    for ip in "$IP1" "$IP2"; do
        if [[ $ip =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo "$ip"
            return
        fi
    done
    
    echo "127.0.0.1"  # Fallback
}

# Déterminer automatiquement quelle machine exécute le script
CURRENT_IP=$(get_current_ip)
echo "🏠 Machine actuelle: $CURRENT_IP"

if [ "$CURRENT_IP" = "$MACHINE_A" ]; then
    MA_MACHINE="$MACHINE_A"
    AUTRE_MACHINE="$MACHINE_B"
    echo "🔍 Identifié comme: Machine A"
elif [ "$CURRENT_IP" = "$MACHINE_B" ]; then
    MA_MACHINE="$MACHINE_B"
    AUTRE_MACHINE="$MACHINE_A"
    echo "🔍 Identifié comme: Machine B"
else
    # Si l'IP ne correspond pas, demander à l'utilisateur
    echo "❓ IP actuelle ($CURRENT_IP) ne correspond à aucune machine configurée"
    echo "Choisissez votre rôle:"
    echo "1) Je suis la Machine A ($MACHINE_A) - Je veux PULL des données"
    echo "2) Je suis la Machine B ($MACHINE_B) - Je veux PULL des données"
    read -p "Votre choix [1/2]: " choix
    
    if [ "$choix" = "1" ]; then
        MA_MACHINE="$MACHINE_A"
        AUTRE_MACHINE="$MACHINE_B"
    else
        MA_MACHINE="$MACHINE_B"
        AUTRE_MACHINE="$MACHINE_A"
    fi
fi

echo "🎯 Votre machine ($MA_MACHINE) va CHERCHER les données depuis $AUTRE_MACHINE"

# Vérifier la connexion à l'autre machine
echo "🔍 Test de connexion à $AUTRE_MACHINE..."
if ! ping -c 1 -W 2 "$AUTRE_MACHINE" > /dev/null 2>&1; then
    echo "❌ Impossible de joindre $AUTRE_MACHINE"
    echo "   Vérifiez que la machine est allumée et sur le réseau"
    exit 1
fi

echo "✅ Autre machine accessible"

mongosh --eval "

print('📡 Connexion à l\\'autre machine (' + '$AUTRE_MACHINE' + ')...');

try {
    // Se connecter à l'autre machine (source des données)
    var autreDB = connect('$AUTRE_MACHINE:27017/$BASE_DONNEES');
    print('✅ Connecté à l\\'autre machine');
    
    // Utiliser la base de données locale
    var maDB = db.getSiblingDB('$BASE_DONNEES');
    print('✅ Base locale prête');
    
    var totalRecu = 0;
    var collectionsSync = ['events', 'emprunts', 'stocks'];

    // Pour chaque collection, COPIER depuis l'autre machine
    collectionsSync.forEach(function(collection) {
        print('\\n📦 Synchronisation: ' + collection);
        
        var documentsRecus = 0;
        var erreurs = 0;
        
        // Compter avant synchronisation
        var countAvant = maDB[collection].countDocuments();
        
        // COPIER tous les documents de l'autre machine vers votre machine
        autreDB[collection].find().forEach(function(doc) {
            try {
                // Remplacer ou insérer dans VOTRE base
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
                if (erreurs <= 3) {  // Afficher seulement les 3 premières erreurs
                    print('   ❌ Erreur document: ' + e.message);
                }
            }
        });
        
        var countApres = maDB[collection].countDocuments();
        
        print('   📊 Avant: ' + countAvant + ' documents');
        print('   📊 Après: ' + countApres + ' documents');
        print('   ✅ ' + documentsRecus + ' documents synchronisés');
        if (erreurs > 0) {
            print('   ⚠️  ' + erreurs + ' erreurs (premières 3 affichées)');
        }
        totalRecu += documentsRecus;
    });

    print('\\n🎉 SYNCHRONISATION TERMINÉE:');
    print('   ' + totalRecu + ' documents reçus depuis $AUTRE_MACHINE');
    print('   ✅ Votre base ($MA_MACHINE) est maintenant à jour');

} catch (e) {
    print('❌ ERREUR: ' + e.message);
    print('   Vérifiez que:');
    print('   1. MongoDB est en cours d\\'exécution sur $AUTRE_MACHINE');
    print('   2. Le firewall permet les connexions sur le port 27017');
    print('   3. MongoDB écoute sur toutes les interfaces (bindIp: 0.0.0.0)');
}

" --quiet

echo "✅ Script terminé!"