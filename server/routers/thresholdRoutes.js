const { Router } = require('express');
const thresholdController = require('../controllers/thresholdController');

const thresholdRouter = Router();

thresholdRouter.get('/', thresholdController.getThresholds);
thresholdRouter.post('/', thresholdController.setThresholds);
thresholdRouter.patch('/', thresholdController.updateThresholds);
thresholdRouter.get('/defaults', thresholdController.getDefaultThresholds);

module.exports = thresholdRouter;