var Q = require('q');
var log = require('npmlog');
var request = require('request');
var Qthrottle = require('./q-throttle');

// Low-level Reddit client.
function Reddit(user, passwd) {
    this.user = user;
    this.passwd = passwd;
    this.userAgent = 'NodeReddit/0.1';

    // internal
    this.jar = request.jar();
    this.throttle = Qthrottle(2, 'second');
}
var proto = Reddit.prototype;

// Reddit request base URL, excluding trailing slash.
proto.base = 'https://ssl.reddit.com';

// Return an array of cookies, ready to be serialized.
proto.cookies = function() {
    return this.jar.cookies.map(function(cookie) {
        return cookie.toString();
    });
};

// Clear the session, or reset to an array of cookies.
proto.reset = function(cookies) {
    this.jar.cookies = (cookies || []).map(function(str) {
        return request.cookie(str);
    });
};

// Send a GET request.
proto.get = function(path, data) {
    return this.request('GET', path, data);
};

// Send a POST request.
proto.post = function(path, data) {
    return this.request('POST', path, data);
};

// Request helper that wraps login and throttling.
proto.request = function(method, path, data) {
    var self = this;

    return Q.fcall(function() {
        if (/^\/api\/login\//.test(path)) return;
        if (!self.user || !self.passwd) return;

        if (self.jar.cookies.length === 0) {
            return self.post('/api/login/' + self.user, {
                user: self.user,
                passwd: self.passwd,
                rem: true
            });
        }
    })
    .then(function() {
        return self.throttle(function() {
            return self.realRequest(method, path, data);
        });
    });
};

// Request helper that sends the actual request.
proto.realRequest = function(method, path, data) {
    var defer = Q.defer();

    var options = {
        // FIXME - strictSSL: true,
        method: method,
        uri: this.base + path,
        headers: { 'User-Agent': this.userAgent },
        jar: this.jar,
        json: true
    };
    if (method === 'POST') {
        if (!data)
            data = {};
        data.api_type = 'json';
        options.form = data;
    }
    else {
        options.uri += '.json';
        if (data)
            options.qs = data;
    }

    log.http(method, options.uri);
    request(options, function(err, res, body) {
        if (err) {
            defer.reject(err);
            return;
        }

        log.http(res.statusCode, options.uri);
        if (method === 'POST') {
            if (body.json.errors.length)
                defer.reject(body.json.errors);
            else
                defer.resolve(body.json);
        }
        else {
            defer.resolve(body);
        }
    });

    return defer.promise;
};

// Factory.
module.exports = function(user, passwd) {
    return new Reddit(user, passwd);
};
