const express = require('express');
const morgan = require('morgan');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

//MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.static(`${__dirname}/public`));     //public is default folder--to serve static files like any html or images

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
})

//mounting routers  
app.use('/api/v1/tours', tourRouter);   //tourRouter is middleware to be applied for specific url
app.use('/api/v1/users', userRouter);

//to handle for all the requests/http methods.  -order matters hence this has to be at the last else all requests will go into this
app.all('*', (req, res, next) => {
    // res.status(404).json({
    //     status: 'fail',
    //     message: `Can't find ${req.originalUrl} on this server!`
    // })

    const err = new Error(`Can't find ${req.originalUrl} on this server!`);
    err.status = 'fail';
    err.statusCode = 404;

    next(err); //next function with an argument is always taken as an error by express 
    //and all other normal middlewares are skipped and we go to global error handling middleware
});

//express in built error handling middleware 
//just give the four arguments so that express knows to run it only on errors
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;     //500 default for internal server error
    err.status = err.status || 'error';     //for 500 status is error , for 404 it is fail

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    })
});

module.exports = app;

