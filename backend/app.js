const express = require('express');
const app = express();
app.use(express.json());
const helmet = require('helmet');
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
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin"}));
module.exports = app;