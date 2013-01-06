var Q = require('q');

// Simple task queuing mechanism.
module.exports = function(consecutive) {
    if (!consecutive) consecutive = 1;

    var queue = [];
    var active = 0;

    // Queue a function, which may return a promise.
    return function(fn) {
        var defer = Q.defer();
        queue.push({ fn: fn, defer: defer });
        dequeue();
        return defer.promise;
    };

    // Dequeue as much as we can.
    function dequeue() {
        while (active < consecutive && queue.length) {
            var task = queue.shift();
            exec(task);
        }
    }

    // Run a task.
    function exec(task) {
        active++;
        task.defer.resolve(
            Q.fcall(task.fn)
            .fin(finish)
        );
    }

    // A task has finished.
    function finish() {
        active--;
        dequeue();
    }
};
