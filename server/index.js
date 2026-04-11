import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/connectDB.js';


dotenv.config();


const app = express();
const PORT = process.env.PORT || 8001;

app.get('/', (req, res) => {
  return res.json({ message: `Server is running on port ${PORT}` });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});