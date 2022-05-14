const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pct5e.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db('doctor-portal').collection('services');
        const bookingCollection = client.db('doctor-portal').collection('bookings');

        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        app.get('/available', async (req, res) => {
            const date = req.query.date;
            //all services
            const services = await serviceCollection.find().toArray();
            //bookings of a day
            const query = { date: date };
            const bookings = await bookingCollection.find(query).toArray();
            //for each service
            services.forEach(service => {
                //finding bookings of service
                const serviceBookings = bookings.filter(book => book?.treatment === service?.name);
                //selectig slots
                const bookedSlots = serviceBookings.map(book => book?.slot);
                //available slots
                const available = service?.slots.filter(slot => !bookedSlots.includes(slot));
                //set available slots
                service.slots = available;
            })
            res.send(services);
        })

        app.get('/booking', async (req, res) => {
            const patient = req.query.patient;
            const query = { patient: patient };
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings);
        })

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient };
            const exists = await bookingCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists });
            }
            const result = await bookingCollection.insertOne(booking);
            return res.send({ success: true, result });
        })
    }
    finally {

    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Doctor portal server is running');
})

app.listen(port, () => {
    console.log('Doctor portal running on port', port);
})