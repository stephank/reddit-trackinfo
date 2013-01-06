#!/usr/bin/env node

var Q = require('q');
var fs = require('fs');
var log = require('npmlog');
var path = require('path');
var jade = require('jade');
var express = require('express');
var uastr = require('../lib/uastr');

var HTTP_USER_AGENT = 'RedditTrackinfo/0.1 (by /u/sockstream)';
var REDDIT_FETCH_LIMIT = 100;
var REDDIT_HISTORY_LIMIT = 1000;


// Helpers
function dataPath(name) {
    return path.join(__dirname, '..', 'data', name + '.json');
}

function readData(name, def) {
    var file = dataPath(name);
    try {
        var data = fs.readFileSync(file, 'utf-8');
        return JSON.parse(data);
    }
    catch (e) {
        if (def) return def;
        throw e;
    }
}

function writeData(name, json) {
    var file = dataPath(name);
    var data = JSON.stringify(json, null, 4);
    fs.writeFileSync(file, data, 'utf-8');
}


// State
var config, app, reddit, soundcloud, discogs, history, tmpl;

function init() {
    config = readData('config');

    app = express();
    var server = app.listen(config.port, config.host, function() {
        var addr = server.address();
        log.info('init', 'server listening on ' + addr.address + ':' + addr.port);
    });

    reddit = require('../lib/reddit')(config.user, config.passwd);
    reddit.userAgent = uastr([HTTP_USER_AGENT, reddit.userAgent]);
    reddit.reset(readData('reddit', []));

    soundcloud = require('../lib/soundcloud')(config.soundcloudApp);
    soundcloud.userAgent = uastr([HTTP_USER_AGENT, soundcloud.userAgent]);

    discogs = require('../lib/discogs')();
    discogs.userAgent = uastr([HTTP_USER_AGENT, discogs.userAgent]);

    history = readData('history', []);

    var tmplFile = path.join(__dirname, '..', 'lib', 'page.jade');
    tmpl = fs.readFileSync(tmplFile, 'utf-8');
    tmpl = jade.compile(tmpl, { filename: tmplFile });
}

function save() {
    writeData('reddit', reddit.cookies());
    writeData('history', history);
}

init();


// Reddit
function refresh() {
    function next() {
        var options = { sort: 'new', limit: REDDIT_FETCH_LIMIT };
        if (history.length !== 0)
            options.before = history[0].name;

        return reddit.get('/new', options)
        .then(function(res) {
            var links = res.data.children.map(function(link) {
                return link.data;
            });

            var more = links.length === REDDIT_FETCH_LIMIT;

            history = links.concat(history).slice(0, REDDIT_HISTORY_LIMIT);

            if (more)
                return next();
            else
                save();
        });
    }
    return next();
}


// Server
app.configure(function(){
  app.use(express.favicon());
  app.use(express.static(path.join(__dirname, '..', 'lib', 'static')));
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
});

app.get('/', function(req, res) {
    res.send(200, tmpl({
        config: config,
        history: history
    }));
});

function webAction(path, fn) {
    app.post(path, function(req, res) {
        Q.fcall(fn, req)
        .then(function() {
            res.send(200);
        })
        .fail(function() {
            res.send(500);
        })
        .done();
    });
}

webAction('/refresh', refresh);
