const RequestLimitQueueService = require('../RequestLimitQueueService');
const { AppError } = require('../../config/errors');
const delay = require('../../utils/delay');

jest.mock('../../utils/delay', () => jest.fn(() => Promise.resolve()));
jest.mock('../../config/logger', () => ({
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    log: jest.fn()
}));

describe('RequestLimitQueueService', () => {
    let queueService;

    beforeEach(() => {
        jest.clearAllMocks();

        queueService = new RequestLimitQueueService({
            interval: 100,
            maxQueueSize: 5
        });
    });


    describe('startTask', () => {
        it('should process a task and return its result', async () => {
            const mockTask = jest.fn().mockResolvedValue('task result');

            const result = await queueService.startTask(mockTask);

            expect(mockTask).toHaveBeenCalled();
            expect(result).toBe('task result');
            expect(delay).toHaveBeenCalledWith(100);
        });

        it('should process multiple tasks in sequence with delays', async () => {
            const mockTask1 = jest.fn().mockResolvedValue('result 1');
            const mockTask2 = jest.fn().mockResolvedValue('result 2');

            const promise1 = queueService.startTask(mockTask1);
            const promise2 = queueService.startTask(mockTask2);

            const [result1, result2] = await Promise.all([promise1, promise2]);

            expect(mockTask1).toHaveBeenCalled();
            expect(mockTask2).toHaveBeenCalled();
            expect(result1).toBe('result 1');
            expect(result2).toBe('result 2');
            expect(delay).toHaveBeenCalledTimes(2);
        });

        it('should throw AppError when queue is full', async () => {
            const smallQueueService = new RequestLimitQueueService({
                interval: 0,
                maxQueueSize: 2
            });

            const pendingTask = () => new Promise(() => {});

            smallQueueService.startTask(pendingTask);
            smallQueueService.startTask(pendingTask);
            smallQueueService.startTask(pendingTask);

            await expect(smallQueueService.startTask(pendingTask))
                .rejects.toThrow(AppError);
        });

        it('should handle task errors without breaking the queue', async () => {
            const errorTask = jest.fn().mockRejectedValue(new Error('Task error'));
            const successTask = jest.fn().mockResolvedValue('success');

            const errorPromise = queueService.startTask(errorTask);
            const successPromise = queueService.startTask(successTask);

            await expect(errorPromise).rejects.toThrow('Task error');
            const result = await successPromise;

            expect(errorTask).toHaveBeenCalled();
            expect(successTask).toHaveBeenCalled();
            expect(result).toBe('success');
            expect(delay).toHaveBeenCalledTimes(2);
        });
    });
});