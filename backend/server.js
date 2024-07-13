require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = require('./app');
const { khan_algorithm } = require('./algorithms/algorithms');

// imported routes
const inputRoutes = require('./routes/input');

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
let ref_course = {}; // for reference:course_code object
let course_ref = {}; // for course_code reference object
let ref_prereq = {}; // {reference: [prereq1code, prereq2code...]}
let courses_return = []; // for API

// initial run to ensure server is connected to MongoDB database
async function run() {
    let data = [];
    try {
        await client.connect(); // connect the client to the server (optional starting in v4.7)
        await client.db("admin").command({ ping: 1 }); // send a ping to confirm a successful connection
        const db = client.db(mongo_database);
        const collection = db.collection(mongo_collection);
        const cursor = await collection.find({}, { projection: { _id: 0 } });
        data = await cursor.toArray();
        data.map((element, index) => ref_course[element.course_name] = element.reference);
        data.map((entry, index) => course_ref[entry.reference] = entry.course_name);
        data.map((entry, index) => {
            const obj = { course_name: entry.course_name, reference: entry.reference };
            courses_return.push(obj);
        });
        data.map((element, index) => ref_prereq[element.reference] = element.prereq_reference);
        console.log("Pinged for deployment. Connection to MongoDB + data initialization successful!");
    } catch (error) {
        console.log('An error has occurred during initial contact with mongodb database:', error);
    } finally {
        await client.close(); // ensures that the client will close when you finish/error
    }
    return data;
}
// initializing server
async function startServer() {
    const data = await run(); // contains everything within the database (has to be run before app.use)
    const sort_output = khan_algorithm(ref_prereq);
    // Pass the necessary arguments to routes
    app.use('', inputRoutes(client, courses_return, sort_output, data));

    // start server
    const PORT = process.env.PORT || 2000;
    app.listen(PORT, () => {
        console.log(`Server is running smoothly on port ${PORT}`);
    });
}

startServer().catch(console.dir);

