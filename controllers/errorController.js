const AppError = require('./../utils/appError');

//eg) wrong id in get tour by id
const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    //path and value -got to know about these after seeing error object in the output
    return new AppError(message, 400);
};

//eg) create a new tour with same value of name as stored on db
const handleDuplicateFieldsDB = err => {
    //const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];  //theory--just do by search--regex to extract name out of error
    //this above one is for previous generations where error object was different
    const value = err.keyValue.name;
    console.log(value);

    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
};

//eg) update a tour and set difficulty to "whatever" and name to shorter than length 10 which are invalid
const handleValidationErrorDB = err => {
    //create a message combining all the error messages in err
    const errors = Object.values(err.errors).map(el => el.message);

    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = () =>
    new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
    new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client-only errors created by ourselves in App Error class are operational
    //we also want to mark the mongoose errors and some more as operational so we do new Apperror for that in handle functions
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }
    // Programming or other unknown error: don't leak error details
    else {
        // 1) Log error
        console.error('ERROR 💥', err);

        // 2) Send generic message
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!'
        });
    }
};

//express in built error handling middleware 
//just give the four arguments so that express knows to run it only on errors
module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;     //500 default for internal server error
    err.status = err.status || 'error';     //for 500 status is error , for 404 it is fail

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    }
    //this is not working if we do process.env.NODE_ENV === 'production'
    //When we used set NODE_ENV=production && something in npm scripts then NODE_ENV=production becomes production + " " with one whitespace after it.
    else if (process.env.NODE_ENV.trim() === 'production') {
        let error = { ...err }; //just create hard copy of err as we dont want to change the original err

        //added these next 2 lines as due to some strange reason,
        //these both properties were not copied to error from err
        error.message = err.message;
        error.name = err.name;

        if (error.name === 'CastError')
            error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, res);
    }
};