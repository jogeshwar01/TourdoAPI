class AppError extends Error {
    constructor(message, statusCode) {
        super(message);     //this will also set this.message = message

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        //used template string on statusCode to convert it to string so that we can use the function startsWith
        this.isOperational = true;  // added this property so that we can later call this only for operational errors

        Error.captureStackTrace(this, this.constructor);
        //just do this to capture the stack trace and also new function call will not go to stack trace and wont pollute it
    }
}

module.exports = AppError;
