var spredfast = require('./lib/spredfast.js');

var oauth = spredfast.OAuth.Existing({
    user: 'admin@devbox.spredfast.com',
    clientId: 'e65a9f746vt63vqxnu5r87c7',
    clientSecret: 'sSJAgVj9ZQ',
    redirectUri: 'http://localhost:3000/callback'
}, spredfast.OAuth.Server);

if (oauth.accessToken) {
    var conn = new spredfast.Connection(oauth);
    //conn.setCompany('<company_name>');
    //conn.setInitiative('<initiative_name>');
    //conn.setAccount('<account_name>');
} else {
    console.log('Authorization needed to continue.');
}

var app = require('express')();
app.get('/', function(req, res) {
    res.redirect(oauth.authorize());
});
app.get('/callback', function(req, res) {
    oauth.getAccessToken(req.query.code, function(oauth) {
        var conn = new spredfast.Connection(oauth);
    });
    res.send();
});
app.listen(3000);
console.log('Listening on port 3000');
