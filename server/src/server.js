const logger = require('./config/logger');
const app = require('./app');

const port = process.env.APPLICATION_PORT || 3002;

const server = app.listen(port, () => {
    logger.info('------------------------------------');
    logger.info(`Server is running on port ${port}`);
    logger.info('------------------------------------');
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    server.close(() => process.exit(1));
});