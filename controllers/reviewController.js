const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');

exports.getAllReviews = catchAsync(async (req, res, next) => {
    const reviews = await Review.find();

    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        results: reviews.length,
        data: {
            reviews
        }
    });
});

exports.createReview = catchAsync(async (req, res, next) => {
    //if manually we dont specify the tour & user ids in the url
    if (!req.body.tour) req.body.tour = req.params.tourId;  //from the parameter in url
    if (!req.body.user) req.body.user = req.user.id;   //from protect middleware

    const newReview = await Review.create(req.body);

    // SEND RESPONSE
    res.status(201).json({
        status: 'success',
        data: {
            review: newReview
        }
    });
});