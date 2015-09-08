var unirest = require('unirest');
var util = require('./util.js');

var supportedMethods = ['get','post','put'];

/**
* A class containing methods that abstract out common API uses.
*
* @class Connection
* @constructor
* @param {Object} oauth A completed OAuth object, i.e. one with a defined
* accessToken property
* @param {String} oauth.accessToken The OAuth accessToken unique to the currently
* authenticated user.
* @param {Boolean} [log] Flag to toggle logging output from this connection. Defaults to false.
* @requires unirest
* @requires util.js
* @example
*     // Creating a Connection from an OAuth Server authentication flow (using ExpressJS)
*     var express = require('express');
*
*     var oauth = spredfast.OAuth.Server({
*         user: <user>,
*         clientId: <clientID>,
*         clientSecret: <clientSecret>,
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
* @example
*     // Creating a Connection from an existing access token
*     var oauth = {
*         accessToken: <accessToken>
*     };
*     var conn = new spredfast.Connection(oauth);
*/
function Connection(oauth, log) {
    /**
    * A reference to 'this' to sidestep scoping issues.
    * @type Object
    * @private
    */
    var self = this;

    /**
    * Stores the provided oauth argument.
    * @property oauth
    * @type Object
    * @private
    */
    this.oauth = oauth;
    if (!oauth || !oauth.accessToken) {
        throw new Error('Must provide an OAuth2.0 Access Token to create a new Connection');
    }

    /**
    * The base URI for the API to be used by this connection. Defaults to the
    * QA API (for now).
    *
    * @property baseUri
    * @type String
    */
    this.baseUri = 'https://qa2api.spredfast.com/';

    /**
    * Optional web proxy for HTTP requests.
    *
    * @property proxy
    * @type String
    * @default null
    */
    this.proxy = null;

    /**
    * Property to toggle logging output.
    *
    * @property logging
    * @type boolean
    * @default false
    */
    this.log = !!log;

    /**
    * General-purpose method for making requests against the Spredfast API.
    *
    * @method request
    * @param {String} endpoint The API endpoint to be targeted by the HTTP request.
    * @param {String} method The HTTP method to use for this request. Must be either
    * 'GET' or 'POST' (case-insensitive).
    * @param {Object} [options] Additional options for the HTTP request.
    * @param {Object} [options.query] An optional object whose properties correspond
    * to query parameters that will be sent with this request. See
    * {{#sourceLink "lib_api_connection.js.html#l286" "getInitiatives"}}{{/sourceLink}}
    * for a usage example.
    * @param {String} [options.type] An optional Content-Type header value (e.g. 'application/json').
    * @param {Object} [options.send] An optional post body object to send with the request (e.g. form data).
    * @param {Function} [callback] The callback function called with an error returned
    * by the API server (or null if none exists) and the response body of the API call, or
    * null if the response is undefined.
    * @throws {Error} If the method argument is unsupported.
    * @example
    *     var conn = new spredfast.Connection(oauth);
    *
    *     conn.request('v1/me', 'get', function(err, response) {
    *         if (err) return console.error(err);
    *         // do something with the response object
    *     });
    * @example
    *     var conn = new spredfast.Connection(oauth);
    *
    *     var options = {
    *         // equivalent: '?key1=value1&key2=value2'
    *         query: {
    *             key1: value1,
    *             key2: value2
    *         },
    *         type: 'application/json',
    *         send: {
    *             // Any object here
    *         }
    *     }
    *
    *     conn.request('v1/me', 'post', options, function(err, response) {
    *         if (err) return console.error(err);
    *         // do something with the response object
    *     });
    */
    this.request = function(endpoint, method, options, callback) {
        if (typeof options === 'function') {
            callback = options;
        }

        method = method.toLowerCase();
        if (supportedMethods.indexOf(method) === -1) {
            throw new Error('Unsupported http method');
        }
        var unirestFn = Object.getOwnPropertyDescriptor(unirest, method).value;

        var req = unirestFn(this.baseUri + endpoint);
        if (this.proxy) req.proxy(this.proxy);
        req.headers({ Authorization: 'Bearer ' + this.oauth.accessToken });

        if (options.query) req.query(options.query);
        if (options.type) req.headers({ 'Content-Type': options.type });
        if (options.send) req.send(options.send);
        if (options.multipart) req.multipart(options.multipart);

        if (options.multipart) {
            console.log('Message JSON:');
            console.log(options.multipart[0].body);
        }

        req.end(function(res) {
            if (log) console.log(method.toUpperCase() + ' ' + endpoint);
            var err = res.error;
            callback(err ? err : null, res ? res.body : null);
        });
    }

    /**
    * Method to retrieve the email of the currently authenticated user.
    *
    * @method getUserEmail
    * @param {Function} [callback] The callback function to be called with any
    * error (or null if none exist), and the email of the user.
    * @example
    *     var conn = new spredfast.Connection(oauth);
    *
    *     conn.getUserEmail(function(err, email) {
    *         if (err) return console.error(err);
    *
    *         console.log(email);
    *     });
    */
    this.getUserEmail = function(callback) {
        self.request('v1/me', 'get', function(err, res) {
            if (err) {
                if (callback) callback(err, null);
                return;
            }
            if (callback) callback(null, res.data.email);
        });
    }

    /**
    * Method to retrieve the available companies for the currently authenticated user.
    * The list of companies is passed to the callback function as a map with
    * company names as keys and the company entity objects as values.
    *
    * @method getCompanies
    * @param {Function} callback The callback function to be called with any
    * errors (or null if none exist), and a map of company objects.
    * @example
    *     var conn = new spredfast.Connection(oauth);
    *
    *     conn.getCompanies(function(err, companies) {
    *         if (err) return console.error(err);
    *
    *         for (var key in companies) {
    *             console.log(companies[key]);
    *         }
    *     });
    */
    this.getCompanies = function(callback) {
        self.request('v1/me', 'get', function(err, res) {
            if (err) {
                if (callback) callback(err, null);
                return;
            }

            var companies = {};
            res.data.companies.forEach(function(company) {
                company.environment = company.environment.toLowerCase();
                companies[company.name] = company;
            });

            if (callback) callback(err, companies);
        });
    }

    /**
    * Method to retrieve the available initiatives for the currently authenticated user.
    * The list of initiatives is passed to the callback function as a map with
    * initiative names as keys and the initiative entity objects as values.
    *
    * The API server will return paginated results. Pagination can be configured
    * with the options parameter of this method.
    *
    * @method getInitiatives
    * @param {Object} company The company containing the initiatives to be retrieved.
    * @param {Object} [options] Additional options for the HTTP request.
    * @param {number} [options.pageSize] The number of initiatives the server will
    * return per page. Must be between 0 and 100 (exclusive), defaults to 20.
    * @param {number} [options.pageNumber] Zero based index of the page of values
    * to return. Must be >= 0, defaults to 0.
    * @param {String} [options.nameFilter] Case-insensitive search within the
    * initiative name for the provided string. If not provided, all initiatives
    * are returned.
    * @param {Function} callback The callback function to be called with any
    * errors (or null if none exist), and a map of initiative objects.
    * @example
    *     var conn = new spredfast.Connection(oauth);
    *
    *     conn.getCompanies(function(err, companies) {
    *         conn.getInitiatives(companies['Planet Express'], function(err, initiatives) {
    *             if (err) return console.error(err);
    *
    *             for (var key in initiatives) {
    *                 console.log(initiatives[key]);
    *             }
    *         });
    *     });
    *
    * @TODO support pagination
    */
    this.getInitiatives = function(company, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = undefined;
        }

        try {
            var endpoint = company.environment + '/v1/company/'
                            + company.id + '/initiative';
        } catch (err) {
            // Catch missing properties on company object
            callback(err, null);
            return;
        }

        var query = {};
        if (options) {
            if (options.pageSize && options.pageSize > 0 && options.pageSize < 100) {
                query.pageSize = options.pageSize;
            }
            if (options.pageNumber) query.pageNumber = options.pageNumber;
            if (options.nameFilter) query.nameFilter = options.nameFilter;
        }

        self.request(endpoint, 'get', { query: query }, function(err, res) {
            if (err) {
                if (callback) callback(err, null);
                return;
            }
            var initiatives = {};
            res.data.forEach(function(initiative) {
                initiatives[initiative.name] = initiative;
            });

            if (callback) callback(null, initiatives);
        });
    }

    /**
    * Method to retrieve the available accounts for the currently authenticated user.
    * The list of accounts is passed to the callback function as a map with
    * account names as keys and the account entity objects as values.
    *
    * The API server will return paginated results. Pagination can be configured
    * with the options parameter of this method.
    *
    * @method getAccounts
    * @param {Object} [options] Additional options for the HTTP request.
    * @param {number} [options.pageSize] The number of accounts the server will
    * return per page. Must be between 0 and 100 (exclusive), defaults to 20.
    * @param {number} [options.pageNumber] Zero based index of the page of values
    * to return. Must be >= 0, defaults to 0.
    * @param {String} [options.services] Multi-valued list of possible Social
    * Network Service enums (i.e. one of 'FACEBOOK', 'TWITTER', or 'LINKEDIN').
    * @param {Function} callback The callback function to be called with any
    * errors (or null if none exist), and a map of account objects.
    * @example
    *     var conn = new spredfast.Connection(oauth);
    *
    *     conn.getCompanies(function(err, companies) {
    *         conn.getInitiatives(companies['Planet Express'], function(err, initiatives) {
    *             conn.getAccounts(initiatives['Marketing'], function(err, accounts)) {
    *                  if (err) return console.error(err);
    *
    *                  for (var key in initiatives) {
    *                     console.log(initiatives[key]);
    *                 }
    *             });
    *         });
    *     });
    * @TODO support pagination
    */
    this.getAccounts = function(company, initiative, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = undefined;
        }

        try {
            var endpoint = company.environment + '/v1/company/'
                        + company.id + '/initiative/' + initiative.id + '/accountset';
        } catch (err) {
            // Catch missing properties on company and/or initiative
            if (callback) callback(err, null);
            return;
        }

        var query = {};
        if (options) {
            if (options.pageSize && options.pageSize > 0 && options.pageSize < 100) {
                query.pageSize = options.pageSize;
            }
            if (options.pageNumber) query.pageNumber = options.pageNumber;
            if (options.services) {
                query.services =
                    options.services.map(String.prototype.toUppercase).join('&services=');
            }
        }

        self.request(endpoint, 'get', { query: query }, function(err, res) {
                if (err) {
                    if (callback) callback(err, null);
                    return;
                }

                var accounts = {};
                res.data.forEach(function(accountSet) {
                    if (accountSet.name === initiative.name) {
                        accountSet.accounts.forEach(function(account) {
                            accounts[account.name] = account;
                        });
                    }
                });

                if (callback) callback(null, accounts);
            }
        );
    }

    /**
    * Method to publish a message via the Conversations API, through the company,
    * initiative, and accounts specified in the provided Message object.
    *
    * Note that the callback function provided here is called when the method is
    * done communicating the publication request to the API server, NOT when
    * the message is actually published
    * (see {{#crossLink "Message"}}Message.callbacks{{/crossLink}}).
    *
    * @method publish
    * @param {Object} msg The {{#crossLink "Message"}}{{/crossLink}} object to be published.
    * @param {Function} [callback] The optional callback function to be called
    * after the publish action has been sent to the API server. The callback is
    * passed any existing error (or null if none exists), and the body of the
    * HTTP response, respectively.
    * @example
    *     var conn = new spredfast.Connection(oauth);
    *
    *     conn.getCompanies(function(err, companies) {
    *         conn.getInitiatives(companies['Planet Express'], function(err, initiatives) {
    *             conn.getAccounts(initiatives['Marketing'], function(err, accounts)) {
    *                 var targetAccounts = Object.keys(accounts).map(function(key) {
    *                     if (accounts[key].service === spredfast.services.FACEBOOK) {
    *                         return accounts[key];
    *                     }
    *                 });
    *
    *                 var msg = new spredfast.Message({
    *                     company: companies['Planet Express'],
    *                     initiative: initiatives['Marketing'],
    *                     service: spredfast.services.FACEBOOK,
    *                     accounts: targetAccounts,
    *                     content: {
    *                         sfEntityType: spredfast.contentTypes.STATUS,
    *                         text: 'Here is my status text'
    *                    },
    *                    callbacks: [
    *                        function(req, res) {
    *                            console.log('callback');
    *                        }
    *                    ]
    *                 });
    *             });
    *         });
    *     });
    *
    *     conn.publish(msg, function(err, res) {
    *         if (err) return console.error(err);
    *         else console.log('Message published successfully.');
    *     });
    */
    this.publish = function(msg, callback) {
        var endpoint = msg.company.environment + '/v1/company/' + msg.company.id
            + '/initiative/' + msg.initiative.id + '/message';

        var options;
        if (msg.content.sfEntityType === 'Status') {
            options = {
                type: 'application/json',
                send: msg.build()
            };
        } else {
            options = {
                type: 'multipart/form-data',
                multipart: [
                    {
                        'content-type': 'application/json',
                        'content-disposition': 'form-data; name="message"',
                        body: msg.build()
                    },
                    {
                        'content-type': 'image/jpg',
                        'content-disposition': 'form-data; name="image"; filename="image.jpg"',
                        body: msg.imageData()
                    }
                ]
            };
        }

        self.request(endpoint, 'post', options, callback);
    }

    /**
    * Method to retrieve publishing privileges for the currently authenticated user.
    *
    * @method getUserPrivileges
    * @param {Object} company The company for which the user has privileges.
    * @param {Function} callback The callback function to be called with any
    * errors (or null if none exist), and an object containing the user's privileges
    * as well as a reference to the company for which the privileges apply.
    */
    this.getUserPrivileges = function(company, callback) {
        try {
            var endpoint = company.environment + '/v1/company/'
                        + company.id + '/privilege';
        } catch (err) {
            // Catch missing properties on company and/or initiative
            callback(err, null);
            return;
        }

        self.request(endpoint, 'get', function(err, res) {
            if (err) {
                if (callback) callback(err, null);
                return;
            }
            var privileges = {
                company: company,
                canPublish: res.data.canPublish,
                canCreateLabels: res.data.canCreateLabels
            }
            callback(null, privileges);
        });
    }
}

module.exports = Connection;
