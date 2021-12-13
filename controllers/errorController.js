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
    //we also want to mark the mongoose errors and some more as operational 
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
    } else if (process.env.NODE_ENV === 'production') {
        sendErrorProd(err, res);
    }
};
