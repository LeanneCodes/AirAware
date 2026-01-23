const { Router } = require('express');
const dashboardController = require('../controllers/dashboardController');

const dashboardRouter = Router();

dashboardRouter.get('/', dashboardController.getDashboard);
dashboardRouter.post('/refresh', dashboardController.refreshDashboard);

module.exports = dashboardRouter;
