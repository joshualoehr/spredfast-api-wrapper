/* eslint camelcase:0 */

var unirest = require('unirest'),
    util = require('./util.js');

var devMode = true, // eslint-disable-line one-var
    oauth;

/**
* Builds the proper authorization URL based on which flow is being used.
*
* @type Function
* @param {Object} oauth The partially completed OAuth object.
* @return {String} Redirect URL for user authorization step of the OAuth flow.
* @private
*/
function buildAuthUrl(type) {
    var base = 'https://' + (devMode ? 'infra' : '') + 'login.spredfast.com/',
        path = 'v1/oauth/';

    if (type === 'Password' || type === 'Application') {
        path += 'token';
    } else if (type === 'Server') {
        path += 'authorize?response_type=code';
    }

    return base + path;
}

/**
* A wrapper object for all OAuth information. Contains functions for authorizing
* and retrieving access tokens.
*
* @type Object
*/
oauth = {
    /**
    * Initialization function. Sets all properties to null.
    *
    * @method init
    * @for OAuth
    * @type Function
    * @private
    */
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
    /**
    * Determines and executes the appropriate authorization steps based on the
    * the type of OAuth flow. Currently, 'Server' is the only functioning type.
    * 'Password' and 'Application' flow types are WIP.
    *
    * For 'Server' flow types, this function returns a URL to which the user
    * should be redirected. Upon successful authorization, the user will be
    * redirected to the redirectUri specified in the creation of this OAuth flow.
    *
    * @method authorize
    * @return {String} A redirect URL to Spredfast's authorization page.
    * @TODO get Password and Application authentications working, if supported
    */
    authorize: function() {
        var authUrl = buildAuthUrl(oauth.type);
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

    //
    // Saves the oauth object by writing it to a JSON file.
    // When finished, executes the callback with the completed oauth object
    /**
    * Uses the authorization code provided by the API to receive an access token.
    * Upon retrieval, saves the OAuth object by writing to a JSON file.
    *
    * @method getAccessToken
    * @param {String} code Authorization code, provided by Spredfast's Server as
    * a result of user authorization (see {{#crossLink "OAuth/authorize"}}{{/crossLink}})
    * @param {String} [path] The file path pointing to the file where this method
    * will write the completed OAuth object for future retrieval. Defaults to
    * `lib/config/oauth.json`.
    * @param {Function} callback The callback function to be called with any
    * error (or null if none exists), and the completed OAuth object, respectively.
    */
    getAccessToken: function(code, path, callback) {
        var base = 'https://' + (devMode ? 'infra' : '') + 'login.spredfast.com/'
            + 'v1/oauth/token';

        if (typeof path === 'function') {
            callback = path;
            path = null;
        }

        this.authCode = code;
        unirest.post(base)
        .send({
            grant_type: oauth.grantType,
            code: oauth.authCode,
            redirect_uri: oauth.redirectUri,
            client_id: oauth.clientId,
            client_secret: oauth.clientSecret
        }).end(function(response) {
            var err = null;
            if (response.status !== 200) {
                err = new Error('Server responded ' + response.status);
                return;
            }
            oauth.accessToken = response.body.data.accessToken;
            util.writeOAuthCreds(oauth, path);
            callback(err, oauth);
        });
    }
};

/**
* Static class containing factory methods for specific OAuth flow types. <br/><br/>
* {{#oauthExample "lib_api_connection.js.html#l286" "getInitiatives"}}{{/oauthExample}}
*
* @example
*     // Using ExpressJS
*     var express = require('express');
*
*     var oauth = spredfast.OAuth.Server({
*         user: <user>,
*         clientId: <clientID>,
*         clientSecret: <clientSecret>
*         redirectUri: 'http://localhost:3000/callback'
*     });
*
*     var app = express();
*     app.get('/', function(req, res) {
*          res.redirect(oauth.authorize());
*     });
*     app.get('/callback', function(req, res) {
*         oauth.getAccessToken(req.query.code, function(oauth) {
*             var conn = new spredfast.Connection(oauth);
*             doStuff(conn);
*         });
*         res.send();
*     });
*     app.listen(3000);
* @class OAuth
* @static
*/
module.exports = {
    Password: function(options) {
        var required = ['pass', 'clientId'];
        if (err = util.validateOptions(options, required)) throw err;

        oauth.init();
        oauth.type = 'Password';
        oauth.grantType = 'password';
        oauth.user = options.user;
        oauth.pass = options.pass;
        oauth.clientId = options.clientId;
        return oauth;
    },

    /**
    * The 'Server' OAuth flow type. Requires a username, clientId, clientSecret,
    * and redirectUri.
    *
    * @method Server
    * @param {Object} options Configuration options for initializing the OAuth flow.
    * @param {String} options.user The user's email used to login to Conversations.
    * @param {String} options.clientId Your application's clientID (provided by Spredfast).
    * @param {String} options.clientSecret Your application's clientSecret (provided by Spredfast).
    * @param {String} options.redirectUri The URI to which Spredfast's API will
    * redirect the user after authorization.
    * @return {Object} A partially initialized OAuth object.
    * @throws {OptionError} If one or more of the required options is not supplied.
    * @example
    *     var oauth = spredfast.OAuth.Server({
    *         user: <user>,
    *         clientId: <clientID>,
    *         clientSecret: <clientSecret>
    *        redirectUri: 'http://localhost:3000/callback'
    *     });
    */
    Server: function(options) {
        var required = ['user', 'clientId', 'clientSecret', 'redirectUri'];
        if (err = util.validateOptions(options, required)) throw err;

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
        var required = ['clientId', 'clientSecret'];
        if (err = util.validateOptions(options, required)) throw err;

        oauth.init();
        oauth.type = 'Application';
        oauth.grantType = 'client_credentials';
        oauth.user = options.user;
        oauth.clientId = options.clientId;
        oauth.clientSecret = options.clientSecret;
        return oauth;
    },

    /**
    * Method to retrieve an existing OAuth object that has been saved to a JSON file.
    * If the OAuth object cannot be retrieved, this method will instead initialize a
    * new OAuth flow from the provided alternative method.
    *
    * OAuth objects are stored and retrieved using the options.user (user email)
    * property as a unique key.
    *
    * Note that while this method only requires a 'user' option be provided, if the
    * alternative OAuth method is called it will still require its usual required
    * options.
    *
    * @method Existing
    * @param {Object} options Configuration options for initializing the OAuth flow.
    * @param {String} options.user The user's email used to login to Conversations.
    * redirect the user after authorization.
    * @return {Object} A completed OAuth object if found, otherwise a partially
    * initialized OAuth object.
    * @throws {OptionError} If one or more of the required options is not supplied.
    * @example
    *     var options = {
    *         user: <user>,
    *         clientId: <clientID>,
    *         clientSecret: <clientSecret>
    *         redirectUri: 'http://localhost:3000/callback'
    *     };
    *     var oauth = spredfast.OAuth.Existing(options, spredfast.OAuth.Server);
    * @TODO consider a better (more secure?) way to load existing OAuth info
    * @TODO ensure that token is still valid, refresh if not
    */
    Existing: function(options, alt) {
        var required = ['user'];
        if (err = util.validateOptions(options, required)) throw err;

        oauth.init();
        return util.readOAuthCreds(options.user, options.path) || alt(options);
    }
};
