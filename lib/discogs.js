var Q = require('q');
var log = require('npmlog');
var request = require('request');
var Qthrottle = require('./q-throttle');

// Low-level Discogs client.
function Discogs() {
    this.userAgent = 'NodeDiscogs/0.1';

    // internal
    this.throttle = Qthrottle(1, 'second');
}
var proto = Discogs.prototype;

// Discogs request base URL, excluding trailing slash.
proto.base = 'http://api.discogs.com';

// Send a GET request.
proto.get = function(path, data) {
    return this.request('GET', path, data);
};

// Request helper that wraps throttling.
proto.request = function(method, path, data) {
    var self = this;

    return self.throttle(function() {
        return self.realRequest(method, path, data);
    });
};

// Request helper that sends the actual request.
proto.realRequest = function(method, path, data) {
    var defer = Q.defer();

    var options = {
        method: method,
        uri: this.base + path,
        headers: { 'User-Agent': this.userAgent },
        json: true
    };
    if (method === 'POST')
        options.form = data;
    else if (data)
        options.qs = data;

    log.http(method, options.uri);
    request(options, function(err, res, body) {
        if (err) {
            defer.reject(err);
        }
        else {
            log.http(res.statusCode, options.uri);
            defer.resolve(body);
        }
    });

    return defer.promise;
};

// Factory.
module.exports = function() {
    return new Discogs();
};
