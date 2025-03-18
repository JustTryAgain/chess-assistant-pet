const logger = require('../config/logger');
const {AppError} = require('../config/errors');

class RequestLimitQueueService {
    #queue = [];
    #processing = 0;
    #timer = null;

    // interval in ms, so 1000 = 1s, by default here 1request per second
    constructor(options = {concurrency: 1, interval: 1000, maxQueueSize: process.env.QUEUE_LIMIT_API}) {
        this.concurrency = options.concurrency;
        this.interval = options.interval;
        this.maxQueueSize = options.maxQueueSize;
        logger.info(`Request queue initialized: concurrency=${this.concurrency}, interval=${this.interval}ms, maxQueueSize=${this.maxQueueSize}`);
    }

    queueTask(taskFn) {
        return new Promise((resolve, reject) => {
            if (this.#queue.length >= this.maxQueueSize) {
                const error = new AppError('Server is high loaded. Please try again later.', 503);
                return reject(error);
            }

            this.#queue.push({
                task: taskFn,
                resolve,
                reject,
                timestamp: Date.now()
            });

            logger.info(`Task added to queue. Queue size: ${this.#queue.length}`);

            this.#processQueue();
        });
    }

    #processQueue() {
        // already processing so skip
        if (this.#timer) return;

        this.#timer = setInterval(() => {
            // stop if empty
            if (this.#queue.length === 0) {
                clearInterval(this.#timer);
                this.#timer = null;
                return;
            }

            while (this.#processing < this.concurrency && this.#queue.length > 0) {
                this.#queue.sort((a, b) => a.timestamp - b.timestamp);

                const { task, resolve, reject } = this.#queue.shift();
                this.#processing++;

                Promise.resolve()
                    .then(() => task())
                    .then(result => resolve(result))
                    .catch(error => reject(error))
                    .finally(() => {
                        this.#processing--;
                        logger.info(`Task completed. Queue size: ${this.#queue.length}, Processing: ${this.#processing}`);
                    });
            }
        }, this.interval);
    }
}

module.exports = RequestLimitQueueService;