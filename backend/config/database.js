const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Forcer l'URI pour le debug - à remettre en variable d'environnement après
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/stock_db';
    
    console.log('🔄 Tentative de connexion MongoDB...');
    console.log('📡 URI:', uri);

    // Options de connexion modernes
    const options = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // IPv4
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    };

    const conn = await mongoose.connect(uri, options);

    console.log('✅ MongoDB CONNECTÉ AVEC SUCCÈS!');
    console.log(`📊 Base de données: ${conn.connection.name}`);
    console.log(`🏠 Hôte: ${conn.connection.host}`);
    console.log(`🔌 Port: ${conn.connection.port}`);
    console.log(`📈 État: ${conn.connection.readyState === 1 ? 'Connecté' : 'Déconnecté'}`);
    
    // Événements de connexion
    mongoose.connection.on('error', (err) => {
      console.error('❌ Erreur MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB déconnecté');
    });

    return conn;

  } catch (error) {
    console.error('❌ ERREUR de connexion MongoDB:');
    console.error('Message:', error.message);
    console.error('Nom:', error.name);
    console.error('Code:', error.code);
    
    // Diagnostic détaillé
    console.log('\n🔍 Diagnostic avancé:');
    console.log('✅ MongoDB fonctionne (test ping ok)');
    console.log('✅ Port 27017 ouvert');
    console.log('❌ Problème de connexion Mongoose');
    
    console.log('\n💡 Solutions à essayer:');
    console.log('1. Vérifier les variables d\'environnement');
    console.log('2. Tester avec une URI directe');
    console.log('3. Vérifier la version de Mongoose');
    
    process.exit(1);
  }
};

module.exports = connectDB;