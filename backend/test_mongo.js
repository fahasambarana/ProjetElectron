const { MongoClient } = require('mongodb');

async function testDirectConnection() {
  console.log('🧪 Test de connexion directe avec MongoClient...');
  
  const uri = 'mongodb://127.0.0.1:27017/stock_db';
  
  try {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    
    await client.connect();
    console.log('✅ MongoClient connecté avec succès!');
    
    // Tester une opération
    const result = await client.db().admin().ping();
    console.log('🏓 Ping result:', result);
    
    const dbs = await client.db().admin().listDatabases();
    console.log('📊 Bases de données disponibles:');
    dbs.databases.forEach(db => console.log('  -', db.name));
    
    await client.close();
    console.log('🔌 Connexion fermée');
    
  } catch (error) {
    console.log('❌ Échec MongoClient:', error.message);
  }
}

testDirectConnection();