const mongoose = require('mongoose');
const connectDB = async (uri) => {
try {
await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
console.log('MongoDB connecté');
} catch (err) {
console.error('Erreur MongoDB :', err.message);
process.exit(1);
}
};
module.exports = connectDB;