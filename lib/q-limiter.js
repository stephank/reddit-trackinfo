var Q = require('q');
var RateLimiter = require('limiter').RateLimiter;

// Wrap RateLimiter with Q.
module.exports = function(a, b) {
    var limiter = new RateLimiter(a, b);

    return function(count) {
        return Q.ninvoke(limiter, 'removeTokens', count || 1);
    };
};
