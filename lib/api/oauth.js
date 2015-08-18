var unirest = require('unirest');
var util = require('./util.js');

// Builds the proper authorization URL based on which flow is being used.
var buildAuthUrl = function(oauth) {
    //var base = 'https://login.spredfast.com/';
    var base = 'https://infralogin.spredfast.com/';
    var path = 'v1/oauth/';

    if (oauth.type === 'Password' || oauth.type === 'Application') {
        path += 'token';
    } else if (oauth.type === 'Server') {
        path += 'authorize?response_type=code';
    }

    return base + path;
};

// A wrapper object for all OAuth information.
// Contains functions for authorizing and retrieving access tokens.
var oauth = {
    init: function() {
        this.type = null;
        this.grantType = null;
        this.user = null;
        this.pass = null;
        this.clientId = null;
        this.clientSecret = null;
        this.redirectUri = null;
        this.authCode = null;
        this.accessToken = null;
    },

    // Determines and executes the appropriate authorization steps based on
    // the type of OAuth flow (currently only 'Server' works).
    // TODO get Password and Application authentications working, if supported
    authorize: function() {
        var authUrl = buildAuthUrl(this);
        if (oauth.type === 'Server') {
            authUrl += '&client_id=' + oauth.clientId;
            authUrl += '&redirect_uri=' + oauth.redirectUri;
            return authUrl; // redirect user's browser to this url
        } else if (oauth.type === 'Password') {
            unirest.post(authUrl)
            .send({
                grant_type: this.grantType,
                username: this.user,
                password: this.pass,
                client_id: this.clientId
            }).end(function(response) {
                console.log(response.status);
            });
        } else if (oauth.type === 'Application') {
            unirest.post(authUrl)
            .send({
                grant_type: this.grantType,
                client_id: this.clientId,
                client_secret: this.clientSecret
            }).end(function(response) {
                console.log(response.status);
            });
        }
    },

    // Uses the authorization code provided by the API to receive an acces token.
    // Saves the oauth object by writing it to a JSON file.
    // When finished, executes the callback with the completed oauth object
    getAccessToken: function(code, path, callback) {
        if (typeof path === 'function') {
            callback = path;
            path = null;
        }
        this.authCode = code;
        //var tokenUrl = 'https://login.spredfast.com/v1/oauth/token';
        var tokenUrl = 'https://infralogin.spredfast.com/v1/oauth/token';
        unirest.post(tokenUrl)
        .send({
            grant_type: oauth.grantType,
            code: oauth.authCode,
            redirect_uri: oauth.redirectUri,
            client_id: oauth.clientId,
            client_secret: oauth.clientSecret
        }).end(function(response) {
            if (response.status !== 200) {
                // TODO handle error (bad status code)
                return;
            }
            oauth.accessToken = response.body.data.accessToken;
            util.writeOAuthCreds(oauth, path);
            callback(oauth);
        });
    }
};

// Different OAuth flow styles with slightly different required parameters.
// Currently only 'Server' is working.
module.exports = {
    Password: function(options) {
        if (!options || !options.user || !options.pass || !options.clientId) {
            // TODO handle error (invalid options)
            throw new Error('Invalid options');
        }
        oauth.init();
        oauth.type = 'Password';
        oauth.grantType = 'password';
        oauth.user = options.user;
        oauth.pass = options.pass;
        oauth.clientId = options.clientId;
        return oauth;
    },

    Server: function(options) {
        if (!options || !options.user || !options.clientId || !options.redirectUri || !options.clientSecret) {
            // TODO handle error (invalid options)
            throw new Error('Invalid options');
        }
        oauth.init();
        oauth.type = 'Server';
        oauth.grantType = 'authorization_code';
        oauth.user = options.user;
        oauth.clientId = options.clientId;
        oauth.redirectUri = options.redirectUri;
        oauth.clientSecret = options.clientSecret;
        return oauth;
    },

    Application: function(options) {
        if (!options || !options.user || !options.clientId || !options.clientSecret) {
            // TODO handle error (invalid options)
            throw new Error('Invalid options');
        }
        oauth.init();
        oauth.type = 'Application';
        oauth.grantType = 'client_credentials';
        oauth.user = options.user;
        oauth.clientId = options.clientId;
        oauth.clientSecret = options.clientSecret;
        return oauth;
    },

    // Loads an existing OAuth object from a JSON file. If the JSON does not
    // contain an OAuth object for the provided user, a new OAuth flow is
    // started using the given alternative (one of the above flows).
    // TODO consider a better way to load existing OAuth info
    // TODO ensure that token is still valid, refresh if not
    Existing: function(options, alt) {
        if (!options || !options.user) {
            // TODO handle error (invalid options)
            throw new Error('Invalid options');
        }
        oauth.init();
        return util.readOAuthCreds(options.user, options.path) || alt(options);
    }
};
