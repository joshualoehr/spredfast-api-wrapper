// Uncomment if having trouble with proxies
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var fs = require('fs');
var path = require('path');
var spredfast = require('./lib/spredfast.js');
var unirest = require('unirest');

var config = fs.readFileSync(path.join(__dirname, 'lib/config/config.json'), 'utf-8');
config = JSON.parse(config);

var options = {
    user: config.users.hubert,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri
};
var oauth = spredfast.OAuth.Existing(options, spredfast.OAuth.Server);

var app = require('express')();
app.listen(3000);
console.log('Listening on port 3000');

var authorize = !oauth.accessToken;
if (authorize) {
    console.log('Authorization needed to continue - go to http://localhost:3000/ in a browser.');

    app.get('/', function(req, res) {
        res.redirect(oauth.authorize());
    });
    app.get('/callback', function(req, res) {
        oauth.getAccessToken(req.query.code, function(err, oauth) {
            if (err) throw err;
            else doStuff(oauth);
        });
        res.end();
    });
} else {
    doStuff(oauth);
}

function doStuff(oauth) {
    var msgOptions = {
        company: null,
        initiative: null,
        accounts: [],
        service: spredfast.Services.TWITTER,
        content: {
            sfEntityType: spredfast.ContentTypes.STATUS,
            text: 'Status text here'
        },
        // content: {
        //     sfEntityType: 'ImageShare',
        //     caption: 'Trying to get callbacks to work',
        //     imagePath: '/Users/jloehr/Downloads/image.jpg'
        // },
        callbacks: [
            function callbackFn(req, res) {
                console.log('callback');
                process.exit(0);
            }
        ]
    };

    var conn = new spredfast.Connection(oauth);
    var company, initiative, targetAccounts;

    conn.getCompanies(function(err, companies) {
        if (err) throw err;

        company = companies['Planet Express'];
        msgOptions.company = company;
        conn.getInitiatives(company, function(err, initiatives) {
            if (err) throw err;

            initiative = initiatives['Marketing'];
            msgOptions.initiative = initiative;
            conn.getAccounts(company, initiative, function(err, accounts) {
                if (err) throw err;

                targetAccounts = [accounts['Express_ATX']];
                msgOptions.accounts = targetAccounts;
                conn.publish(new spredfast.Message(msgOptions), function(err, res) {
                    if (err) throw err;
                    if (res.status.succeeded) {
                        console.log('Status successfully published to Twitter');
                    } else {
                        console.log('Oops! Something went wrong.');
                        console.log(res.data);
                    }
                });
            });
        });
    });
}
