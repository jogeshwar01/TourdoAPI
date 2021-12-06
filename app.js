const fs = require('fs');
const express = require('express');

const app = express();

//middleware -it can modify incoming request data
app.use(express.json());

// app.get('/', (req, res) => {
//     res.status(200).json({
//         message: 'Hello from the server side!',
//         app: 'Tourdo'
//     });
// })

// app.post('/', (req, res) => {
//     res.send('You can post to this endpoint...');
// })

const tours = JSON.parse(
    fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

app.get('/api/v1/tours', (req, res) => {
    res.status(200).json({
        //add status as we use JSend format       
        //added result just for easy info to client(not part of JSend)
        status: 'success',
        results: tours.length,
        data: {
            tours            //no need to write both key and value if they have same name in ES6
        }
    })
})

app.post('/api/v1/tours', (req, res) => {
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
})

const port = 3000;
app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});


