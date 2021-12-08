const fs = require('fs');

const tours = JSON.parse(
    fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);

exports.checkID = (req, res, next, val) => {
    console.log(`Tour id is: ${val}`);

    if (req.params.id * 1 > tours.length) {
        return res.status(404).json({
            status: 'fail',
            message: 'Invalid ID'
        });
    }
    next();
};

exports.checkBody = (req, res, next) => {
    if (!req.body.name || !req.body.price) {
        return res.status(400).json({
            status: 'fail',
            message: 'Missing name or price'
        });
    }
    next();
};

exports.getAllTours = (req, res) => {
    console.log(req.requestTime);

    res.status(200).json({
        //add status as we use JSend format       
        //added result just for easy info to client(not part of JSend)
        status: 'success',
        requestedAt: req.requestTime,
        results: tours.length,
        data: {
            tours            //no need to write both key and value if they have same name in ES6
        }
    })
}

exports.getTour = (req, res) => {
    //can add ? for optional parameters like :id?
    //console.log(req.params);

    const id = req.params.id * 1;  //trick to convert string to number
    const tour = tours.find(el => el.id == id);

    res.status(200).json({
        status: 'success',
        data: {
            tour
        }
    })
}

exports.createTour = (req, res) => {
    //console.log(req.body);

    //get id
    const newId = tours[tours.length - 1].id + 1;
    //to merge two objects,we use assign method
    const newTour = Object.assign({ id: newId }, req.body)

    tours.push(newTour);

    //need to use asynchronous code in callbacks so dont use writeFileSync here
    fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), err => {
        res.status(201).json({
            status: 'status',
            data: {
                tour: newTour
            }
        })
    })
}

//not implementing logic of patch and delete as we are just doing sample testing
exports.updateTour = (req, res) => {
    res.status(200).json({
        status: 'success',
        data: {
            tour: '<Updated tour here...>'
        }
    })
}

exports.deleteTour = (req, res) => {
    res.status(204).json({
        status: 'success',
        data: null
    })
}