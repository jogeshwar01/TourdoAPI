const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');

const router = express.Router();

//middleware to run for parameters like 'id' here
// router.param('id', tourController.checkID);

router.route('/top-5-cheap')
    .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router.route('/')
    .get(authController.protect, tourController.getAllTours)
    .post(tourController.createTour)

//could have added catchAsync here directly rather than in controller and it will work in the same way
//but then we would have to remember which one is fully async but here as all are async so no problem but may be there can be 
//  .get(catchAsync(tourController.getAllTours))        -this is not preferred -the other way is better 

router.route('/:id')
    .get(tourController.getTour)
    .patch(tourController.updateTour)
    .delete(tourController.deleteTour)

module.exports = router;
