const express = require('express');
const cors = require('cors');
const path = require('path');

/* Routers */
const authRouter = require('./routers/authRoutes');
const userRouter = require('./routers/userRoutes');
const thresholdRouter = require('./routers/thresholdRoutes');
const dashboardRouter = require('./routers/dashboardRoutes');

/* Middleware */
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

/* Global middleware */
app.use(cors());
app.use(express.json());

/* Serve static frontend files */
app.use(express.static(path.join(__dirname, '..', 'public')));

/* Frontend routes (Views) */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
});

app.get('/threshold', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'threshold.html'));
});

app.get('/location', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'location.html'));
});

/* API routes */
app.use('/api/auth', authRouter);
app.use('/api/user', authMiddleware, userRouter);
app.use('/api/thresholds', authMiddleware, thresholdRouter);
app.use('/api/dashboard', authMiddleware, dashboardRouter);

/* Fallback for unknown routes */
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;