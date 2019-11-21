class TaskQueue {
    constructor() {
        this._queue = [];
    }

    add(fn) {
        this._queue.push(fn);
    }

    async run() {
        for (const task of this._queue) {
            await task();
        }
    }
}

module.exports = TaskQueue;