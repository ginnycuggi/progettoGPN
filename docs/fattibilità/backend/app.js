const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const schemaRoutes = require('./routes/schemaRoutes');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/api/schemi', schemaRoutes);

app.listen(3000, () => console.log('Server avviato su http://localhost:3000'));