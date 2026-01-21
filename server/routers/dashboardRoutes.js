const { Router } = require('express');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

const dashboardRouter = Router();

dashboardRouter.get('/', authMiddleware, dashboardController.getDashboard);

module.exports = dashboardRouter;
