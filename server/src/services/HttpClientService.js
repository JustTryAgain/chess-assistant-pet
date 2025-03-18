const axios = require('axios');
const logger = require("../config/logger");
const delay = require("../utils/delay");
const {UnauthorizedError, AppError} = require('../config/errors');

class HttpClientService {
    constructor(config = {}) {
        this.maxRetries = config.maxRetries || 3;
        this.retryDelay = config.retryDelay || 1000;
        this.timeout = config.timeout || 60000;
    }

    async request(method, url, data = null, headers = {}) {
        let lastError;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await axios({
                    method,
                    url,
                    data,
                    headers,
                    timeout: this.timeout,
                });

                return response.data;
            } catch (error) {
                lastError = error;

                if (!this.isRetryableError(error) || attempt === this.maxRetries) {
                    break;
                }

                const delayMs = this.getBackoffDelay(this.retryDelay, attempt);

                logger.warn(
                    `Request failed (attempt ${attempt}/${this.maxRetries}): ${error.message}. Retrying in ${delayMs.toFixed(0)}ms...`
                );

                await delay(delayMs);
            }
        }

        this.handleRequestError(lastError);
    }

    async post(url, data, headers = {}) {
        return this.request('post', url, data, headers);
    }

    async get(url, headers = {}) {
        return this.request('get', url, null, headers);
    }

    async put(url, data, headers = {}) {
        return this.request('put', url, data, headers);
    }

    async delete(url, headers = {}) {
        return this.request('delete', url, null, headers);
    }

    handleRequestError(error) {
        let status = 500;
        logger.error('Original error:', error);

        if (error.response) {
            status = error.response.status;
            const responseData = error.response.data || error.response;
            const detail = responseData?.detail || responseData?.error || JSON.stringify(responseData);

            switch (status) {
                case 401:
                case 403:
                    throw new UnauthorizedError(`Authentication error: ${detail}`);
                case 429:
                    throw new AppError(`Rate limit exceeded: ${detail}`, status);
                default:
                    if (status >= 500) {
                        throw new AppError(`Server error: ${detail}`, status);
                    }
                    throw new AppError(`${detail}`, status);
            }
        }

        if (error.request) {
            throw new AppError(`Network error: No response received (${error.message})`, status);
        }

        throw new AppError(`Request configuration error: ${error.message}`, status);
    }

    isRetryableError(error) {
        if (!error.response) {
            return true;
        }

        const statusCode = error.response.status;
        return statusCode === 429 || (statusCode >= 500 && statusCode < 600);
    }

    getBackoffDelay(baseDelay, attempt) {
        const exponentialDelay = baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * baseDelay;
        return exponentialDelay + jitter;
    }
}

module.exports = HttpClientService;