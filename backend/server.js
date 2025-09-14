const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const stockRoute = require('./routes/stockRoute');
const eventRoutes = require('./routes/eventRoutes')



dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());


const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stock_db';


connectDB(MONGO_URI);


app.use('/api/stocks', stockRoute);
app.use("/api/events", eventRoutes);


app.get('/', (req, res) => res.send('API stocks fonctionne'));


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));