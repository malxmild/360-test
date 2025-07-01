const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const pool = require('./models/db');
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());


const userRoutes = require('./routes/users');
const evaluationsRoutes = require('./routes/evaluations');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/evaluation_relations', evaluationsRoutes);

// Routes
app.use('/api/auth', authRoutes);

const evaluationRelationsRouter = require('./routes/evaluation_relations');
app.use('/api/evaluation_relations', evaluationRelationsRouter);

const questionsRoutes = require('./routes/questions');
app.use('/api/questions', questionsRoutes);

const answersRoutes = require("./routes/answers");
app.use("/api/answers", answersRoutes);

const export360Routes = require('./routes/export360');
app.use('/api/export360', export360Routes);

// เพิ่มไว้ก่อน listen() ก็ได้
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
