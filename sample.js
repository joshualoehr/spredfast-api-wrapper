var fs = require('fs');
var path = require('path');
var Q = require('q');
var spredfast = require('./lib/spredfast.js');

var config = fs.readFileSync(path.join(__dirname, 'lib/config/config.json'), 'utf-8');
config = JSON.parse(config);

var options = {
    user: config.users.hubert,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri
};
var oauth = spredfast.OAuth.Existing(options, spredfast.OAuth.Server);
// var oauth = spredfast.OAuth.Server(options);

var doStuff = function(oauth) {
    var msg = new spredfast.Message({
        service: 'FACEBOOK',
        accounts: ['42'],
        content: {
            sfEntityType: 'Status',
            text: 'Here is my status text'
        },
        callbacks: [
            function(req, res) {
                console.log('callback');
            }
        ]
    });

    var conn = new spredfast.Connection(oauth);
    Q.ninvoke(conn, 'getCompanies')
    .then(function(companies) {
        return Q.ninvoke(conn, 'getInitiatives');
    })
    .then(function(initiatives) {
        listAvailable('initiatives', initiatives);

        var deferred = Q.defer();
        var initiativeName = 'Catch All';
        conn.setInitiative(initiativeName, function(err, found) {
            if (found) {
                deferred.resolve();
            } else {
                deferred.reject(err || new Error(initiativeName + ': initiative not found'));
            }
        });
        return deferred.promise;
    })
    .then(function() {
        return Q.ninvoke(conn, 'getAccounts');
    })
    .then(function(accounts) {
        listAvailable('accounts', accounts);
        return Q.ninvoke(conn, 'publish', msg);
    })
    .then(console.log)
    .catch(function(err) {
        console.error(err);
        process.exit(1);
    })
    .fin(process.exit);
}

var listAvailable = function(name, list) {
    console.log('Available ' + name + ': ' + list.map(function(thing) {
        var str = thing.id + ' [' + thing.name;
        str += (name === 'accounts') ? ' | ' + thing.service + ']' : ']';
        return str;
    }).join(', '));
}

var authorize = false;
if (oauth.accessToken) {
    doStuff(oauth);
} else {
    authorize = true;
    console.log('Authorization needed to continue.');
}

if (authorize) {
    var app = require('express')();
    app.get('/', function(req, res) {
        res.redirect(oauth.authorize());
    });
    app.get('/callback', function(req, res) {
        oauth.getAccessToken(req.query.code, function(err, oauth) {
            doStuff(oauth);
        });
        res.send();
    });
    app.listen(3000);
    console.log('Listening on port 3000');
}
