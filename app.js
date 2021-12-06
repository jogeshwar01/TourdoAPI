const fs = require('fs');
const express = require('express');
const morgan = require('morgan');

const app = express();

//1 .MIDDLEWARES
app.use(morgan('dev'))

app.use(express.json());

app.use((req, res, next) => {
    console.log('Hello from the middleware ✌️');
    next();
})

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
})

const tours = JSON.parse(
    fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);


//2. ROUTE HANDLERS

const getAllTours = (req, res) => {
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

const getTour = (req, res) => {
    //can add ? for optional parameters like :id?
    //console.log(req.params);

    const id = req.params.id * 1;  //trick to convert string to number
    const tour = tours.find(el => el.id == id);

    // if (id > tours.length) {     //another alternative condition
    if (!tour) {
        return res.status(404).json({
            status: 'fail',
            message: 'Invalid ID'
        });
    }

    res.status(200).json({
        status: 'success',
        data: {
            tour
        }
    })
}

const createTour = (req, res) => {
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
const updateTour = (req, res) => {

    const id = req.params.id * 1;
    if (id > tours.length) {
        return res.status(404).json({
            status: 'fail',
            message: 'Invalid ID'
        });
    }

    res.status(200).json({
        status: 'success',
        data: {
            tour: '<Updated tour here...>'
        }
    })
}

const deleteTour = (req, res) => {

    const id = req.params.id * 1;
    if (id > tours.length) {
        return res.status(404).json({
            status: 'fail',
            message: 'Invalid ID'
        });
    }

    res.status(204).json({
        status: 'success',
        data: null
    })
}

//app.get('/api/v1/tours', getAllTours);
//app.post('/api/v1/tours', createTour);
// app.get('/api/v1/tours/:id', getTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

//3. ROUTES

app.route('/api/v1/tours')
    .get(getAllTours)
    .post(createTour)

app.route('/api/v1/tours/:id')
    .get(getTour)
    .patch(updateTour)
    .delete(deleteTour)


//4. START THE SERVER
const port = 3000;
app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});


