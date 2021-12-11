class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        //1.MONGODB -->const tours = await Tour.find({ duration:5 , difficulty:'easy' }); 
        //2.MONGOOSE-->const tours = await Tours.find().where('duration').equals(5).where('difficulty').equals('easy');
        //for query string ,just pass it instead of predefined values inside function

        //console.log(req.query);         //queryObj -{ duration: { gte: '5' }, difficulty: 'easy' }

        //using mongoose methods
        // BUILD QUERY
        // 1A) Filtering
        const queryObj = { ...this.queryString };  //trick to make a hard copy and not a shallow copy of req.query as we dont want to change the actual req.query
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);  //delete excluded fields from the query object

        // 1B) Advanced Filtering
        let queryStr = JSON.stringify(queryObj);
        //regular expression in JS--difficult concept ->replace eg) gte with $gte to match mongo methods
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
        //console.log(JSON.parse(queryStr));

        this.query = this.query.find(JSON.parse(queryStr));
        //let query = Tour.find(JSON.parse(queryStr));

        return this;
    }

    sort() {
        // 2) Sorting   Ascending-->/api/v1/tours?sort=price      Descending->/api/v1/tours?sort=-price
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            //pass a backup string if two have same value for the property
            //  /api/v1/tours?sort=-price,ratingsAverage -> sort('price ratingsAverage')

            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');   //default descending sort for newest ones earlier
        }

        return this;
    }

    limitFields() {
        // 3) Field Limiting ->only return fields which the client wants
        //   /api/v1/tours/fields=name,duration,price
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');   //exclude __v with - sign ->this field is added by mongo as it uses it internally but we dont need it
        }

        return this;
    }

    paginate() {
        // 4) Pagination -->allow use to select a certain page of our results in case of a lot of results
        //   /api/v1/tours?page=2&limit=10 , 1-10 page1 , 11-20 page2 ......
        const page = this.queryString.page * 1 || 1;//default page 1    //convert string to number
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}

module.exports = APIFeatures;