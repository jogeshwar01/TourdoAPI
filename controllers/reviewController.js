const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getAllReviews = catchAsync(async (req, res, next) => {

    // to make this workGET /tour/234fad4/reviews
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const reviews = await Review.find(filter);

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

exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);