const mongoose = require('mongoose');

const dotenv = require('dotenv');
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
app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});