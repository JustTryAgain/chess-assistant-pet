const {AppError} = require('../config/errors');
const logger = require('../config/logger');

const errorHandler = (err, _req, res, _next) => {
    logger.error(err);

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({error: err.message,});
    }

    return res.status(500).json({error: 'Internal Server Error'});
};

module.exports = errorHandler;
