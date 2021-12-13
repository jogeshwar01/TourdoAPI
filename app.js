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
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`
    })
});

module.exports = app;

