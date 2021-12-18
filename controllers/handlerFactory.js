const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

//returns a function
//JavaScript closures property used here which is
//inner function will get access to the variables of outer function even when outer has already returned
exports.deleteOne = Model =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id);

        if (!doc) {
            return next(new AppError('No document found with that ID', 404));
        }

        //in RESTful API ,we dont send the deleted object back to the client
        res.status(204).json({
            status: 'success',
            data: null
        });
    });