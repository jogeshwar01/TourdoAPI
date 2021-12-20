const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

// mergeParams allow us to access the params from the incoming url like we want id in /:tourId/reviews
// as by default each router has access to its own params only but here we want it from other route url
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

// BOTH these routes go in this
// GET /tour/234fad4/reviews
// POST /tour/234fad4/reviews
// POST /reviews
router.route('/')
    .get(reviewController.getAllReviews)
    .post(
        authController.restrictTo('user'),  //only users can review
        reviewController.setTourUserIds,
        reviewController.createReview
    );

// who can CRUD reviews is all what we design and what makes sense
router.route('/:id')
    .get(reviewController.getReview)
    .patch(
        authController.restrictTo('user', 'admin'),
        reviewController.updateReview
    )
    .delete(authController.restrictTo('user', 'admin'),
        reviewController.deleteReview
    );

module.exports = router;
