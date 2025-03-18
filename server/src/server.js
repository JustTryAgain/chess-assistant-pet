const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config({path: path.join(__dirname, '..', '..', '.env')});

const apiRoutes = require("./routes/apiRoutes.js");
const logger = require("./config/logger");
const loggingHandler = require("./middleware/loggingRequestHandler");
const errorHandler = require('./middleware/errorHandler');

const app = express();
const port = process.env.APPLICATION_PORT || 3002;

app.use(express.json());

app.use(cors({
    origin: process.env.CLIENT_ORIGIN,
    methods: ['POST'],
    allowedHeaders: ['Content-Type']
}));

// app.use(express.static(path.join(__dirname, '../static')));

app.use(loggingHandler);

app.use('/api', apiRoutes);

app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, '../static/index.html'));
});

app.use((_req, res) => {
    res.status(404).json({error: 'Not Found (×_×;'});
});

app.use(errorHandler);

const server = app.listen(port, () => {
    logger.info('------------------------------------');
    logger.info(`Server is running on port ${port}`);
    logger.info('------------------------------------');
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    server.close(() => process.exit(1));
});