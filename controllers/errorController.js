//express in built error handling middleware 
//just give the four arguments so that express knows to run it only on errors
module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;     //500 default for internal server error
    err.status = err.status || 'error';     //for 500 status is error , for 404 it is fail

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    })
};
