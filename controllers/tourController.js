const Tour = require('./../models/tourModel');

exports.getAllTours = async (req, res) => {
    try {
        //1.MONGODB -->const tours = await Tour.find({ duration:5 , difficulty:'easy' }); 
        //2.MONGOOSE-->const tours = await Tours.find().where('duration').equals(5).where('difficulty').equals('easy');
        //for query string ,just pass it instead of predefined values inside function

        //using mongoose methods
        // BUILD QUERY
        const queryObj = { ...req.query };  //trick to make a hard copy and not a shallow copy of req.query as we dont want to change the actual req.query
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);  //delete excluded fields from the query object

        const query = Tour.find(queryObj);

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