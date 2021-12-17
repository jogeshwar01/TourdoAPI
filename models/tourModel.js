const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel'); //used for embed user into tours
// const validator = require('validator');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        trim: true,
        unique: true,       //not a validator (though will show error if name same)
        maxlength: [40, 'A tour name must have less or equal then 40 characters'],
        minlength: [10, 'A tour name must have more or equal then 10 characters'],
        // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        // enum only works for strings
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either: easy, medium, difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        // min,max can also work with dates
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0']
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function (val) {
                // this only points to current doc on NEW document creation
                // hence this will not work in updating 
                return val < this.price;
            },
            // can access value using this wierd syntax --specific to mongoose and not related to javascript
            message: 'Discount price ({VALUE}) should be below regular price'
        }
    },
    summary: {
        type: String,
        trim: true,         //remove whitespace at beginning and end of a string
        required: [true, 'A tour must have a description']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),    //returns date in millisecond which is converted to formatted date in mongo
        select: false       //to hide this from output when sending back our responses
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    // can delete it and set first locations in locations array and set day=0 but it is better to specify it separately
    startLocation: {
        // GeoJSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],  //array of number -> longitude/latitude -this order is opposite to general like in google maps
        address: String,
        description: String
    },
    // Embedding -> embed locations in tours so we need to create an array of locations
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    //guides:Array       //if we do by embedding user into tours
    // CHILD REFERENCING
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// will be created each time data sent from database - not stored in database -hence can't use in queries
// used regular function instead of an arrow function as we want to use 'this'
tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()   (insertMany or other methods will not trigger this save middleware)
// 'save' is the hook --> so this is like pre save hook/middleware
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

// //We did change this to Referencing in the next part so commented this out
// //Embed users into tours using an array of user Ids
// tourSchema.pre('save', async function(next) {
//   const guidesPromises = this.guides.map(async id => await User.findById(id)); //async fn returns array of promises
//   this.guides = await Promise.all(guidesPromises);   //to resolve all promises in one go
//   next();
// });
// //if we did go by this embed way,do this on update docs also

// tourSchema.pre('save', function(next) {
//   console.log('Will save document...');
//   next();
// });

// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE -- before/after certain query is executed
// tourSchema.pre('find', function(next) {      //worl only for find --this will point to current query find here and not at current document
// /^find/ --regex for all starting with find  --all secret tours hidden in all queries
tourSchema.pre(/^find/, function (next) {       //works for all finds like find,findOne,findMany etc so that it works for all
    this.find({ secretTour: { $ne: true } });       //show only the ones where secretTour is not equal to true

    this.start = Date.now();
    next();
});

// populate 'guides' field on find queries -only in query and not in actual database
tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });

    next();
});

tourSchema.post(/^find/, function (docs, next) {
    console.log(`Query took ${Date.now() - this.start} milliseconds!`);
    next();
});

// AGGREGATION MIDDLEWARE
// hide secret tours from aggregations - add here to commonly add in all aggregations
// this points to current aggregation object
tourSchema.pre('aggregate', function (next) {
    // unshift --standard js method to add at start of an array
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

    console.log(this.pipeline());
    next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;