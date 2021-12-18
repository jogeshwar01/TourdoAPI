const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

// mergeParams allow us to access the params from the incoming url like we want id in /:tourId/reviews
// as by default each router has access to its own params only but here we want it from other route url
const router = express.Router({ mergeParams: true });

// BOTH these routes go in this
// GET /tour/234fad4/reviews
// POST /tour/234fad4/reviews
// POST /reviews
router.route('/')
    .get(reviewController.getAllReviews)
    .post(
        authController.protect,
        authController.restrictTo('user'),  //only users can review
        reviewController.createReview
    );

router.route('/:id')
    .delete(reviewController.deleteReview);

module.exports = router;
