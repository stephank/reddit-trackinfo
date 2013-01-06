var Q = require('q');
var Qtask = require('./q-task');
var Qlimiter = require('./q-limiter');

// Combine q-task and q-limiter to build a throttled task queue.
module.exports = function(a, b) {
    var queue = Qtask();
    var limiter = Qlimiter(a, b);

    return function(count, fn) {
        if (typeof(count) === 'function') {
            fn = count;
            count = 1;
        }

        return queue(function() {
            return limiter(count)
            .then(function() {
                return Q.fcall(fn);
            });
        });
    };
};
