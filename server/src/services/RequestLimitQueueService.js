const logger = require('../config/logger');
const {AppError} = require('../config/errors');

class RequestLimitQueueService {
    #queue = [];
    #processing = 0;
    #isProcessing = false;

    // interval in ms, so 1000 = 1s, by default here 1request per second
    constructor(options = {interval: 1000, maxQueueSize: process.env.QUEUE_LIMIT_API}) {
        this.interval = options.interval;
        this.maxQueueSize = options.maxQueueSize;
        logger.info(`Request queue initialized: interval=${this.interval}ms, maxQueueSize=${this.maxQueueSize}`);
    }

    async startTask(taskFn) {
        if (this.#queue.length >= this.maxQueueSize) {
            throw new AppError('Server is high loaded. Please try again later.', 503);
        }

        return new Promise((resolve, reject) => {
            this.#queue.push({
                taskFn,
                resolve,
                reject
            });

            logger.info(`Task added to queue. Queue size: ${this.#queue.length}`);

            this.#processQueue();
        });
    }

    async #processQueue() {
        if (this.#isProcessing || this.#queue.length === 0) return;

        this.#isProcessing = true;

        while (this.#queue.length > 0) {
            const {taskFn, resolve, reject} = this.#queue.shift();
            this.#processing++;

            try {
                const result = await taskFn();
                resolve(result);
            } catch (error) {
                reject(error);
            } finally {
                this.#processing--;
                logger.info(`Task completed. Queue size: ${this.#queue.length}, Processing: ${this.#processing}`);
            }

            // wait delay
            await new Promise((res) => setTimeout(res, this.interval));
        }

        this.#isProcessing = false;
    }
}

module.exports = RequestLimitQueueService;