const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// GLOBAL MIDDLEWARES
// Set security HTTP headers -put in beginning
app.use(helmet());  // helemt() will return the desired middleware function

// Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Limit requests from same API --the number is reset on restarting the app
// Rate Limiting -to prevent same IP to make too many requests to our API
const limiter = rateLimit({
    max: 100,       // Max 100 requests in an hour -adapt to your app
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!'
});
// to see how many requests pending in postman check headers in output
app.use('/api', limiter);   // limit our api routes

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));   //max amount of data that can come into body set to 10kb

// Data sanitization against NoSQL query injection 
//--> "email":{"$gt":""}    //insert in login and with a password it would work if we dont use this middlewware
// needs to be after body parser as the previous middleware reads data into req.body
app.use(mongoSanitize());       //looks at req.body,req,query,req,params & filters out $ and .

// Data sanitization against XSS    ->prevent malicious html code with js
app.use(xss());

// Prevent parameter pollution --clear up the query string and uses the last specified one instead of creating an array hence no error
// -> ?sort=difficult&sort=price --express will create an array of sort=['duration','price'] which we cannot split as in apiFeatures and this will give an error
app.use(
    hpp({
        // properties where duplicate values should be allowed are in whitelist
        // as ?duration=5&duration=9 should work
        whitelist: [
            'duration',
            'ratingsQuantity',
            'ratingsAverage',
            'maxGroupSize',
            'difficulty',
            'price'
        ]
    })
);

// Serving static files
app.use(express.static(`${__dirname}/public`));     //public is default folder--to serve static files like any html or images

// Test middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    //console.log(req.headers);
    next();
})

//mounting routers  
app.use('/api/v1/tours', tourRouter);   //tourRouter is middleware to be applied for specific url
app.use('/api/v1/users', userRouter);

//to handle for all the requests/http methods.  -order matters hence this has to be at the last else all requests will go into this
app.all('*', (req, res, next) => {
    // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
    // err.status = 'fail';
    // err.statusCode = 404;

    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
    //next function with an argument is always taken as an error by express 
    //and all other normal middlewares are skipped and we go to global error handling middleware
});

app.use(globalErrorHandler);

module.exports = app;

