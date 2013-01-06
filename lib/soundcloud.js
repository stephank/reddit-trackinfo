var Q = require('q');
var log = require('npmlog');
var request = require('request');
var Qthrottle = require('./q-throttle');

// Low-level SoundCloud client.
function SoundCloud(clientId) {
    this.clientId = clientId;
    this.userAgent = 'NodeSoundCloud/0.1';

    // internal
    this.throttle = Qthrottle(2, 'second'); // FIXME: what's the actual limit?
}
var proto = SoundCloud.prototype;

// SoundCloud request base URL, excluding trailing slash.
proto.base = 'https://api.soundcloud.com';

// Send a GET request.
proto.get = function(path, data) {
    return this.request('GET', path, data);
};

// Send a POST request.
proto.post = function(path, data) {
    return this.request('POST', path, data);
};

// Send a PUT request.
proto.put = function(path, data) {
    return this.request('PUT', path, data);
};

// Send a DELETE request.
proto.del = function(path, data) {
    return this.request('DELETE', path, data);
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
        strictSSL: true,
        method: method,
        uri: this.base + path,
        headers: { 'User-Agent': this.userAgent },
        json: true
    };
    if (!data)
        data = {};
    data.format = 'json';
    data.client_id = this.clientId;
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
module.exports = function(clientId) {
    return new SoundCloud(clientId);
};
