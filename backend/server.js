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
let user_input = {}; // for building user data
let courses_return = []; // return during /courses API endpoint call
let ref_course = {}; // for reference:course_code object
let course_ref = {}; // for course_code reference object
let ref_prereq = {}; // {reference: [prereq1code, prereq2code...]}
let adj = []; // adj for Khan's topological sort
let inorder = []; // inorder for Khan's topological sort
let sort_output = []; // final sorting output contain all course order
// for Khan's algorithm
function khan_algorithm() {
    // for constructing adj ls for topological sorting
    for (key in ref_prereq) {
        if (ref_prereq[key] === undefined) {
            adj.push([]);
        } else {
            adj.push(ref_prereq[key]);
        }
    };
    // for constructing inorder_ls
    adj.forEach((entry) => inorder.push(0)); // pushing zeroes in
    for (element of adj) {
        if (element.length > 0) {
            for (course of element[0]) { // only used prereqs' first element (modify later)
                inorder[course] += 1;
            }
        }
    };
    let q = [];
    for (index in inorder) {
        if (inorder[parseInt(index)] === 0) {
            q.push(parseInt(index));
        }
    };
    while (q.length > 0) {
        const n = q.shift();
        sort_output.push(n);
        if (adj[n].length > 0) {
            for (entry of adj[n][0]) { // modify later
                inorder[entry] -= 1;
                if (inorder[entry] === 0) {
                    q.push(entry);
                }
            }
        }
    };
    sort_output.reverse(); // reverse for correct order
}
// initial run to ensure server is connected to MongoDB database
async function run() {
    try {
        await client.connect(); // connect the client to the server (optional starting in v4.7)
        await client.db("admin").command({ ping: 1 }); // send a ping to confirm a successful connection
        const db = client.db(mongo_database);
        const collection = db.collection(mongo_collection);
        const cursor = await collection.find({}, { projection: { _id: 0 } });
        const data = await cursor.toArray();
        data.map((element, index) => ref_course[element.course_name] = element.reference);
        data.map((entry, index) => course_ref[entry.reference] = entry.course_name);
        data.map((entry, index) => {
            const obj = { course_name: entry.course_name, reference: entry.reference };
            courses_return.push(obj);
        });
        data.map((element, index) => ref_prereq[element.reference] = element.prereq_reference);
        khan_algorithm(); // invoke initialization of adj & inorder ls
        console.log("Pinged for deployment. Connection to MongoDB + data initialization successful!");
    } catch (error) {
        console.log('An error has occurred during initial contact with mongodb database:', error);
    } finally {
        await client.close(); // ensures that the client will close when you finish/error
    }
}
run().catch(console.dir);
// endpoint for returning all course names
app.get('/courses', async (req, res) => {
    let response = { message: '', payload: [] }; // each js object should consist of a message (string) and a payload (anything)
    try {
        response.message = 'API endpoint call to /courses successful';
        response.payload = courses_return;
        res.status(200).send(response);
    } catch (e) {
        console.log('An error occurred during calling /courses endpoint');
        response.message = 'Server has encountered an error during /courses endpoint';
        res.status(500).send(response);
    } finally {
        await client.close();
    }
})
// endpoint for receiving questionnaire answers
app.post('/questionnaire', (req, res) => {
    let response = { message: '', payload: {} };
    user_input.gradOr = req.body.gradOr;
    user_input.semesterOr = req.body.semesterOr;
    if (user_input.semesterOr !== undefined && user_input.gradOr !== undefined) {
        response.message = 'API endpoint call to /questionnaire successful';
        response.payload = user_input;
        res.status(200).send(response); // return user_input
    } else {
        response.message = 'User input not recognized for /questionnaire API endpoint call';
        res.status(500).send(response);
    }
});
// endpoint for receiving course selection answers
app.post('/selection', (req, res) => {
    let response = { message: '', payload: {} };
    user_input.selection = Object.values(req.body);
    if (user_input.selection !== undefined && user_input.selection.length >= 3) {
        response.message = 'API endpoint call to /selection successful';
        topologicalSort(user_input.selection);
        response.payload = user_input;
        res.status(200).send(response); // return user_input
    } else {
        response.message = 'Something went wrong during /selection API call';
        res.status(500).send(response);
    }
});

// Khan's algorithm for topological sorting
function topologicalSort(course_ls) {

    // retrieve references based on course_names
};
