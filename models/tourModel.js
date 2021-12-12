const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        trim: true,
        unique: true
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
        required: [true, 'A tour must have a difficulty']
    },
    ratingsAverage: {
        type: Number,
        default: 4.5
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
        type: Number
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
    }
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