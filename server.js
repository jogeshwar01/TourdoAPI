const mongoose = require('mongoose');
const dotenv = require('dotenv');

//these wont work if it occurs inside a middleware as that will be called on request hence the error handling middleware will handle it
//this needs to be at the top as the exception may occur before this function if its not at the start
//eg) doing console.log(x) where x is not defined
process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
    //we must crash our application here and restart it as entire node process is in unclean state
});

dotenv.config({ path: './config.env' });    //read variables from config.env file and save them to node environment variables
//can use these env variables using process anywhere and dont need to do anything now again

//"start:prod": "SET NODE_ENV=production & nodemon server.js" --correct syntax in windows for npm start:prod

//need to have this after configuring as we use it in app.js
const app = require('./app');

const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);

mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    })
    .then((con) => console.log('DB connection successful!'));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});

//to handle all unhandled promise rejections -eg) problem connecting to database like if password was wrong is dotenv file 
process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);

    //to shutdown gracefully,first shutdown server(give time to server to handle all pending requests) 
    //and then shut process  (rather than directly exiting)
    server.close(() => {
        process.exit(1);    //optional to crash our app
    });
});