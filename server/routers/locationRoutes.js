const { Router } = require('express');
const locationController = require('../controllers/locationController');

const locationRouter = Router();

locationRouter.get('/location', locationController.getLocation);
locationRouter.get('/location/history', locationController.getLocationHistory);
locationRouter.post('/location', locationController.setLocation);
locationRouter.patch('/location', locationController.updateLocation);
locationRouter.get('/location/validate', locationController.validateLocation);
locationRouter.delete('/location', locationController.deleteLocation);

module.exports = locationRouter;