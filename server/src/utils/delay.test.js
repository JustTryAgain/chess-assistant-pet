const delay = require('./delay');

describe('delay', () => {
    it('should resolve after the specified time', async () => {
        const startTime = Date.now();
        await delay(100);
        const elapsed = Date.now() - startTime;
        expect(elapsed).toBeGreaterThanOrEqual(100);
    });
});