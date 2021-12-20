// review / rating / createdAt / ref to tour / ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, 'Review can not be empty!']
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        // PARENT REFERENCING
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a tour.']
        },
        // PARENT REFERENCING
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user']
        }
    },
    {
        // So that virtual properties also shows up in json outputs and objects
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

reviewSchema.pre(/^find/, function (next) {
    // this.populate({
    //     path: 'tour',
    //     select: 'name'
    // }).populate({
    //     path: 'user',
    //     select: 'name photo'
    // });
    // REMOVED tour populate as we wanted to decrease the chain of populates in our app 
    // and based on our functionality we can decide accordingly but as we didnt need it here so did this to increase performance

    this.populate({
        path: 'user',
        select: 'name photo'
    });
    next();
});

// STATIC METHODS IN MONGOOSE --these can be called on model directly like Review.calcAverageRatings
reviewSchema.statics.calcAverageRatings = async function (tourId) {
    // aggregation pipeline -'this' points to model
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);
    //console.log(stats);  //eg output)- [ {_id: 61c0338f5a5b203d2cce2933, nRating: 3,avgRating: 4.666666666666667} ]

    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        });
    }
};

//Create reviews
//need to use post and not presave as we need it to be saved in our collection to do calculation on all reviews
reviewSchema.post('save', function () {
    // this points to current review document being saved
    // so we want to call our function using this.tour (so we use constructor to access tour)

    //we cannot use Review here as it is declared after this 
    //and we cannot shift it after it as then order matters and this fn will the not be seen
    //so we use this.constructor where constructor is basically the model that created that document ie. Tour
    this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndUpdate
// findByIdAndDelete
// for updating and deleting we did using findOneByIdAndDelete so we cannot use document middleware
// so we need to use QUERY MIDDLEWARE in which we dont have direct access to current review 
// so we use this trick to do the same
// we use findOneAnd hook here as findOneByIdAndDelete is shorthand for find One and delete for the current id
reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.r = await this.findOne();  //here 'this' is current query if if we execute it we get our document
    //way of passing data from pre to post middleware
    //saved it as this.r so that we can use this in the post middleware also

    //console.log(this.r);      //will contain the non-updated data
    next();
});

reviewSchema.post(/^findOneAnd/, async function () {
    // await this.findOne(); does NOT work here, query has already executed
    await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;