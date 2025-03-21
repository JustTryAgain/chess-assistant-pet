const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config({path: path.join(__dirname, '..', '..', '.env')});

const apiRoutes = require("./routes/apiRoutes.js");
const loggingHandler = require("./middleware/loggingRequestHandler");
const errorHandler = require('./middleware/errorHandler');

const app = express();


app.use(express.json());

app.use(cors({
    origin: process.env.CLIENT_ORIGIN,
    methods: ['POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(loggingHandler);

app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.use((_req, res) => {
    res.status(404).json({error: 'Not Found 4 0 4 SOS'});
});

app.use(errorHandler);

module.exports = app;