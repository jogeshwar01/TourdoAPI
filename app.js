const fs = require('fs');
const express = require('express');

const app = express();

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

const port = 3000;
app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});


