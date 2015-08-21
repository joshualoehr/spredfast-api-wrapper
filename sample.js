var fs = require('fs');
var path = require('path');
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
    var conn = new spredfast.Connection(oauth);
    conn.getCompanies(function(err, companies) {
        if (err) return console.error(err);
        listAvailable('companies', companies);
        conn.getInitiatives(function(err, initiatives) {
            if (err) return console.error(err);
            listAvailable('initiatives', initiatives);
            conn.setInitiative('Marketing', function(err, found) {
                if (!found) return console.log('Marketing: not found');

                conn.getAccounts(function(err, accounts) {
                    if (err) return console.error(err);
                    listAvailable('accounts', accounts);

                    conn.publish(new spredfast.Message({
                        service: 'TWITTER',
                        accounts: ['1'],
                        content: {
                            sfEntityType: 'Status',
                            text: 'Here is my tweet text'
                        },
                        callbacks: [
                            function(req, res) {
                                console.log('callback');
                            }
                        ]
                    }), function(err, res) {
                        console.log(res);
                    });
                });
            });
        });
    });
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
        oauth.getAccessToken(req.query.code, function(oauth) {
            doStuff(oauth);
        });
        res.send();
    });
    app.listen(3000);
    console.log('Listening on port 3000');
}
