const Tour = require('./../models/tourModel');

//top-5-cheap tours --> /api/v1/tours?limit=5&sort=-ratingsAverage,price&fields=name,price,ratingsAverage,summary,difficulty
exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};

exports.getAllTours = async (req, res) => {
    try {
        //1.MONGODB -->const tours = await Tour.find({ duration:5 , difficulty:'easy' }); 
        //2.MONGOOSE-->const tours = await Tours.find().where('duration').equals(5).where('difficulty').equals('easy');
        //for query string ,just pass it instead of predefined values inside function

        //console.log(req.query);         //queryObj -{ duration: { gte: '5' }, difficulty: 'easy' }

        //using mongoose methods
        // BUILD QUERY
        // 1A) Filtering
        const queryObj = { ...req.query };  //trick to make a hard copy and not a shallow copy of req.query as we dont want to change the actual req.query
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);  //delete excluded fields from the query object

        // 1B) Advanced Filtering
        let queryStr = JSON.stringify(queryObj);
        //regular expression in JS--difficult concept ->replace eg) gte with $gte to match mongo methods
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
        //console.log(JSON.parse(queryStr));

        let query = Tour.find(JSON.parse(queryStr));

        // 2) Sorting   Ascending-->/api/v1/tours?sort=price      Descending->/api/v1/tours?sort=-price
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            //pass a backup string if two have same value for the property
            //  /api/v1/tours?sort=-price,ratingsAverage -> sort('price ratingsAverage')

            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');   //default descending sort for newest ones earlier
        }

        // 3) Field Limiting ->only return fields which the client wants
        //   /api/v1/tours/fields=name,duration,price
        if (req.query.fields) {
            const fields = req.query.fields.split(',').join(' ');
            query = query.select(fields);
        } else {
            query = query.select('-__v');   //exclude __v with - sign ->this field is added by mongo as it uses it internally but we dont need it
        }

        // 4) Pagination -->allow use to select a certain page of our results in case of a lot of results
        //   /api/v1/tours?page=2&limit=10 , 1-10 page1 , 11-20 page2 ......
        const page = req.query.page * 1 || 1;//default page 1    //convert string to number
        const limit = req.query.limit * 1 || 100;
        const skip = (page - 1) * limit;

        query = query.skip(skip).limit(limit);

        if (req.query.page) {
            const numTours = await Tour.countDocuments();
            if (skip >= numTours) throw new Error('This page does not exist');
        }

        // EXECUTE QUERY
        const tours = await query;

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