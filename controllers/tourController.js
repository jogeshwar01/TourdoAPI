const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');

//top-5-cheap tours --> /api/v1/tours?limit=5&sort=-ratingsAverage,price&fields=name,price,ratingsAverage,summary,difficulty
exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};

exports.getAllTours = async (req, res) => {
    try {
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
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err
        });
    }
}

exports.getTour = async (req, res) => {
    try {
        const tour = await Tour.findById(req.params.id);
        //above is shortcut for --> Tour.findOne({ _id: req.params.id })

        res.status(200).json({
            status: 'success',
            data: {
                tour
            }
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err
        });
    }
}

exports.createTour = async (req, res) => {
    try {
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
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err
        });
    }
}

exports.updateTour = async (req, res) => {
    try {
        //put request won't work as it expects original object to be completely replaced
        const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
            new: true,  //to return the newly updated document
            runValidators: true //run validators again on newly created document
        });

        res.status(200).json({
            status: 'success',
            data: {
                tour
            }
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err
        });
    }
}

exports.deleteTour = async (req, res) => {
    try {
        //in RESTful API ,we dont send the deleted object back to the client
        await Tour.findByIdAndDelete(req.params.id);

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err
        });
    }
}

exports.getTourStats = async (req, res) => {
    try {
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
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err
        });
    }
};

//tours per month in a given year
exports.getMonthlyPlan = async (req, res) => {
    try {
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
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err
        });
    }
};