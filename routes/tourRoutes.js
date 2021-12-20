const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

//middleware to run for parameters like 'id' here
// router.param('id', tourController.checkID);

// POST /tour/234fad4/reviews
// GET /tour/234fad4/reviews
// need to put it here as our url starts with /tour so it is redirected here from app.js
router.use('/:tourId/reviews', reviewRouter);   //to prevent duplicate code 
// mounting a router inside a router --use reviewRouter for these urls

router.route('/top-5-cheap')
    .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router.route('/monthly-plan/:year')
    .get(authController.protect,
        authController.restrictTo('admin', 'lead-guide', 'guide'),
        tourController.getMonthlyPlan
    );

router.route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.getToursWithin);
// /tours-within?distance=233&center=-40,45&unit=mi     //could have done the same like this with query strings
// /tours-within/233/center/-40,45/unit/mi

router.route('/')
    .get(tourController.getAllTours)    //as we want this part of API to be exposed to everyone 
    .post(authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.createTour
    )

//could have added catchAsync here directly rather than in controller and it will work in the same way
//but then we would have to remember which one is fully async but here as all are async so no problem but may be there can be 
//  .get(catchAsync(tourController.getAllTours))        -this is not preferred -the other way is better 

router.route('/:id')
    .get(tourController.getTour)
    .patch(authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.updateTour
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.deleteTour
    );

module.exports = router;
