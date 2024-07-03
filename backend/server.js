require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const app = express();
app.use(express.json());
const cors = require('cors'); // use cors to avoid unknown origin error
app.use(cors({
    origin: function (origin, callback) {
        // Define a whitelist of allowed origins
        const whitelist = [
            'http://localhost:3000'
        ];

        if (!origin || whitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// start backend server
const port = process.env.PORT || 2000; // run on port 2000 for local development
app.listen(port, () => {
    console.log('Server running smoothly on port ' + port.toString());
})
// .env key credentials
const mongo_username = process.env.MONGO_USERNAME;
const mongo_password = process.env.MONGO_PASSWORD;
const mongo_cluster = process.env.MONGO_CLUSTER;
const mongo_database = process.env.MONGO_DATABASE;
const mongo_collection = process.env.MONGO_COLLECTION;

// MongoDB
const uri = `mongodb+srv://${mongo_username}:${mongo_password}@${mongo_cluster}/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
// initial run to ensure server is connected to MongoDB database
async function run() {
    try {
        await client.connect(); // connect the client to the server (optional starting in v4.7)
        await client.db("admin").command({ ping: 1 }); // send a ping to confirm a successful connection
        console.log("Pinged for deployment. Connection to MongoDB successful!");
    } catch (error) {
        console.log('An error has occurred during initial contact with mongodb database:', error);
    } finally {
        await client.close(); // ensures that the client will close when you finish/error
    }
}
run().catch(console.dir);
// endpoint for returning all course names
app.get('/courses', async (req, res) => {
    let response = { message: '', payload: [] };
    try {
        await client.connect();
        const db = client.db(mongo_database);
        const collection = db.collection(mongo_collection);
        const cursor = await collection.find({}, { projection: { _id: 0, reference: 1, course_name: 1 } });
        const package = await cursor.toArray();
        response.message = 'Server completed request successfully';
        response.payload = package;
        res.status(200).send(response);
    } catch (e) {
        console.log('An error occurred during calling /courses endpoint');
        response.message = 'Server has encountered an error during /courses endpoint';
        res.status(500).send(response);
    } finally {
        await client.close();
    }
})
