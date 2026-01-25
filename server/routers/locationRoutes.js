const { Router } = require("express");
const locationController = require("../controllers/locationController");

const locationRouter = Router();

locationRouter.get("/", locationController.getLocation);
locationRouter.get("/history", locationController.getLocationHistory);
locationRouter.post("/", locationController.setLocation);
locationRouter.patch("/", locationController.updateLocation);
locationRouter.patch("/select", locationController.selectLocation);
locationRouter.delete("/:id", locationController.deleteLocation);

module.exports = locationRouter;
