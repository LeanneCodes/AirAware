const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const path = require('path');

/* Routers */
const authRouter = require('./routers/authRoutes');
const userRouter = require('./routers/userRoutes');
const thresholdRouter = require('./routers/thresholdRoutes');
const dashboardRouter = require('./routers/dashboardRoutes');
const locationRouter = require('./routers/locationRoutes');


/* Middleware */
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

app.use((req, res, next) => {
  console.log('APP.JS HIT:', req.method, req.path);
  next();
});

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

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'signup.html'));
});

app.get('/user', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'user.html'));
});

/* API routes */
app.use('/api/auth', authRouter);
app.use('/api/user', authMiddleware, userRouter);
app.use('/api/thresholds', authMiddleware, thresholdRouter);
app.use('/api/location', authMiddleware, locationRouter);
app.use('/api/dashboard', authMiddleware, dashboardRouter);

/* API 404 (only for /api/*) */
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

/* Frontend fallback (must be LAST) */
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

module.exports = app;
