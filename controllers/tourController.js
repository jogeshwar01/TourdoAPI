const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

//top-5-cheap tours --> /api/v1/tours?limit=5&sort=-ratingsAverage,price&fields=name,price,ratingsAverage,summary,difficulty
exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
    // EXECUTE QUERY
    const features = new APIFeatures(Tour.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const tours = await features.query;

    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            tours
        }
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    // to populate guides in our query and not in our actual database
    //const tour = await Tour.findById(req.params.id).populate({
    //         path: 'guides',
    //         select: '-__v -passwordChangedAt'
    //     });
    const tour = await Tour.findById(req.params.id).populate('reviews');
    //above is shortcut for --> Tour.findOne({ _id: req.params.id })

    if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            tour
        }
    });
})

exports.createTour = catchAsync(async (req, res, next) => {
    // const newTour = new Tour({})
    // newTour.save()
    // Model.prototype.save() -->in mongoose documentation this will be written like this always

    //another way to do the above creation is to use create method
    const newTour = await Tour.create(req.body);

    //there may be an error related to node not supporting async/await until some version
    //so to resolve it, add "engines": {"node": ">=10.0.0"} in the package.json file
    res.status(201).json({
        status: 'success',
        data: {
            tour: newTour
        }
    });
})

exports.updateTour = factory.updateOne(Tour);

// exports.updateTour = catchAsync(async (req, res, next) => {
//     //put request won't work as it expects original object to be completely replaced
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//         new: true,  //to return the newly updated document
//         runValidators: true //run validators again on newly created document
//     });

//     if (!tour) {
//         return next(new AppError('No tour found with that ID', 404));
//     }

//     res.status(200).json({
//         status: 'success',
//         data: {
//             tour
//         }
//     });
// })

exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//     //in RESTful API ,we dont send the deleted object back to the client
//     const tour = await Tour.findByIdAndDelete(req.params.id);

//     if (!tour) {
//         return next(new AppError('No tour found with that ID', 404));
//     }

//     res.status(204).json({
//         status: 'success',
//         data: null
//     });
// })

exports.getTourStats = catchAsync(async (req, res, next) => {
    //need to await it to get back our result,else we will ust get a pipeline aggregate object
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                _id: { $toUpper: '$difficulty' },   //what we want to group by
                numTours: { $sum: 1 },  //add 1 for each documnet
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: { avgPrice: 1 }  //need to use field names specified in the group part
        },
        //can repeat stages like match here
        // {
        //   $match: { _id: { $ne: 'EASY' } }   //id not equal to easy
        // }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    });
});

//tours per month in a given year
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1; // 2021

    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'
            //deconstruct an array field from the input documents and then output one document for each element of the array
            //basically we want one tour for each date in the array of startDates
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTourStarts: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: { month: '$_id' }   //to add a field month as id so that we can delete our _id as it looks confusing
        },
        {
            $project: {
                _id: 0      //to hide id's (if we put 1 then it will be shown)
            }
        },
        {
            $sort: { numTourStarts: -1 }
        },
        {
            $limit: 12      //max no. of documents/output allowed --NOT USEFUL HERE but just to see example
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            plan
        }
    });
});