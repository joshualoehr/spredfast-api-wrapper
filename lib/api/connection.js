var unirest = require('unirest');
var util = require('./util.js');

var supportedMethods = ['get','post'];

/**
* A class containing methods that abstract out common API uses.
*
* @class Connection
* @constructor
* @param {Object} oauth A completed OAuth object, i.e. one with a defined
* accessToken property
* @param {String} oauth.accessToken The OAuth accessToken unique to the currently
* authenticated user.
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
* @TODO ability to toggle logging
*/
function Connection(oauth) {
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

    /**
    * The base URI for the API to be used by this connection. Defaults to the
    * QA API.
    *
    * @property baseUri
    * @type String
    */
    this.baseUri = 'https://qa2api.spredfast.com/';

    /**
    * Container object for information regarding the currently authenticated user.
    *
    * @property user
    * @type Object
    */
    this.user = {
        /**
        * The current user's email address
        * @property user.email
        * @type String
        * @default null
        */
        email: null,

        /**
        * The available companies for the current user
        * @property user.companies
        * @type Object[]
        * @default null
        */
        companies: null,

        /**
        * The current user's 'active' company. Used as a default value where
        * a company value is required.
        * @property user.activeCompany
        * @type Object
        * @default null
        */
        activeCompany: null,

        /**
        * The available initiatives for the current user
        * @property user.initiatives
        * @type Object[]
        * @default null
        */
        initiatives: null,

        /**
        * The current user's 'active' initiative. Used as a default value where
        * an initiative value is required.
        * @property user.activeInitiative
        * @type Object
        * @default null
        */
        activeInitiative: null,

        /**
        * The available accounts for the current user
        * @property user.accounts
        * @type Object[]
        * @default null
        */
        accounts: null,

        /**
        * The current user's 'active' account. Used as a default value where
        * an account value is required.
        * @property user.activeAccount
        * @type Object
        * @default null
        */
        activeAccount: null
    };

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

        req.headers({ Authorization: 'Bearer ' + this.oauth.accessToken });
        if (options.query) req.query(options.query);
        if (options.type) req.headers({ 'Content-Type': options.type });
        if (options.send) req.send(options.send);
        req.end(function(res) {
            // try {
            //     console.log(method + ' ' + res.request.href);
            // } catch (e) {}
            var err = res.error;
            callback(err ? err : null, res ? res.body : null);
        });
    }

    /**
    * Method to populate the
    * {{#propertyLink "Connection" "user.companies"}}{{/propertyLink}}
    * list with companies available to the
    * current user. If at least 1 company is returned, this method will set the
    * user's activeCompany property to the first company in the returned list.
    * Additionally sets the user's email address.
    *
    * @method getCompanies
    * @param {Function} [callback] The callback function to be called with any
    * errors (or null if none exist), and an array of company objects.
    * @example
    *     var conn = new spredfast.Connection(oauth);
    *
    *     conn.getCompanies(function(err, companies) {
    *         if (err) return console.error(err);
    *
    *         companies.forEach(function(company, i, arr) {
    *             console.log(Object.keys(company)); // [sfEntityType, id, name, environment]
    *         });
    *     });
    */
    this.getCompanies = function(callback) {
        self.request('v1/me', 'get', function(err, res) {
            if (err) {
                if (callback) callback(err, null);
                return;
            }
            if (res.body) res = res.body;
            self.user.email = res.data.email;
            self.user.companies = res.data.companies;

            self.user.companies.forEach(function(company) {
                company.environment = company.environment.toLowerCase();
            });

            // default to the first listed company
            if (self.user.companies.length) {
                self.user.activeCompany = self.user.companies[0];
            }

            if (callback) callback(err, self.user.companies);
        });
    }

    /**
    * Method to populate the
    * {{#propertyLink "Connection" "user.initiatives"}}{{/propertyLink}}
    * list with initiatives available to the
    * current user. If at least 1 initiative is returned, this method will set the
    * user's activeInitiative property to the first initiative in the returned list.
    *
    * The API server will return paginated results. Pagination can be configured
    * with the options parameter of this method.
    *
    * If no activeCompany is set for the current user, calling this method
    * will result in the user's initiatives list being set to an empty array,
    * which will get passed to the callback function if one is provided. The user's
    * activeInitiative will be set to null.
    *
    * @method getInitiatives
    * @param {Object} [options] Additional options for the HTTP request.
    * @param {number} [options.pageSize] The number of initiatives the server will
    * return per page. Must be between 0 and 100 (exclusive), defaults to 20.
    * @param {number} [options.pageNumber] Zero based index of the page of values
    * to return. Must be >= 0, defaults to 0.
    * @param {String} [options.nameFilter] Case-insensitive search within the
    * initiative name for the provided string. If not provided, all initiatives
    * are returned.
    * @param {Function} [callback] The callback function to be called with any
    * errors (or null if none exist), and an array of initiative objects.
    * @example
    *     var conn = new spredfast.Connection(oauth);
    *
    *     // Will set a default user.activeCompany if possible
    *     conn.getCompanies(function(err, companies) {
    *         if (err) return console.error(err);
    *
    *         conn.getInitiatives(function(err, initiatives) {
    *             if (err) return console.error(err);
    *
    *             initiatives.forEach(function(initiative, i, arr) {
    *                 console.log(Object.keys(initiative)); // [sfEntityType, id, name, description]
    *             });
    *         });
    *     });
    * @TODO support pagination
    */
    this.getInitiatives = function(options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {
                pageSize: 20
            };
        }
        if (!self.user.activeCompany) {
            self.user.activeInitiative = null;
            self.user.initiatives = [];
            if (callback) callback(null, self.user.initiatives);
            return;
        }

        var endpoint = self.user.activeCompany.environment + '/v1/company/'
                        + self.user.activeCompany.id + '/initiative';

        var query = {};
        if (options.pageSize && options.pageSize > 0 && options.pageSize < 100) {
            query.pageSize = options.pageSize;
        }
        if (options.pageNumber) query.pageNumber = options.pageNumber;
        if (options.nameFilter) query.nameFilter = options.nameFilter;

        self.request(endpoint, 'get', { query: query }, function(err, res) {
                if (err) {
                    if (callback) callback(err, null);
                    return;
                }
                if (res.body) res = res.body;
                self.user.initiatives = res.data;

                // default to first listed initiative
                if (self.user.initiatives.length) {
                    self.user.activeInitiative = self.user.initiatives[0];
                }

                if (callback) callback(null, self.user.initiatives);
            }
        );
    }

    /**
    * Method to populate the
    * {{#propertyLink "Connection" "user.accounts"}}{{/propertyLink}}
    * list with accounts available to the
    * current user. If at least 1 account is returned, this method will set the
    * user's activeAccount property to the first account in the returned list.
    *
    * The API server will return paginated results. Pagination can be configured
    * with the options parameter of this method.
    *
    * If no activeCompany or activeInitiative is set for the current user,
    * calling this method will result in the user's accounts list being set to
    * an empty array, which will get passed to the callback function if one is
    * provided. The user's activeAccount will be set to null.
    *
    * @method getAccounts
    * @param {Object} [options] Additional options for the HTTP request.
    * @param {number} [options.pageSize] The number of accounts the server will
    * return per page. Must be between 0 and 100 (exclusive), defaults to 20.
    * @param {number} [options.pageNumber] Zero based index of the page of values
    * to return. Must be >= 0, defaults to 0.
    * @param {String} [options.services] Multi-valued list of possible Social
    * Network Service enums (i.e. one of 'FACEBOOK', 'TWITTER', or 'LINKEDIN').
    * @param {Function} [callback] The callback function to be called with any
    * errors (or null if none exist), and an array of account objects.
    * @example
    *     var conn = new spredfast.Connection(oauth);
    *
    *     // Will set a default user.activeCompany if possible
    *     conn.getCompanies(function(err, companies) {
    *         if (err) return console.error(err);
    *
    *         // Will set a default user.activeInitiative if possible
    *         conn.getInitiatives(function(err, initiatives) {
    *             if (err) return console.error(err);
    *
    *             conn.getAccounts(function(err, accounts) {
    *                 if (err) return console.error(err);
    *
    *                 accounts.forEach(function(account, i, arr) {
    *                     console.log(Object.keys(account)); // [sfEntityType, id, name, service, accountType]
    *                 });
    *             });
    *         });
    *     });
    * @TODO support pagination
    */
    this.getAccounts = function(options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {
                pageSize: 20
            };
        }
        if (!self.user.activeCompany || !self.user.activeInitiative) {
            self.user.activeAccount = null;
            self.user.accounts = [];
            if (callback) callback(null, self.user.accounts);
            return;
        }

        var endpoint = self.user.activeCompany.environment + '/v1/company/'
                        + self.user.activeCompany.id + '/initiative/'
                        + self.user.activeInitiative.id + '/accountset';

        var query = {};
        if (options.pageSize && options.pageSize > 0 && options.pageSize < 100) {
            query.pageSize = options.pageSize;
        }
        if (options.pageNumber) query.pageNumber = options.pageNumber;
        if (options.services) {
            query.services = options.services.map(function(val) {
                return val.toUpperCase();
            }).join('&services=');
        }

        self.request(endpoint, 'get', { query: query }, function(err, res) {
                if (err) {
                    if (callback) callback(err, null);
                    return;
                }

                if (res.body) res = res.body;
                self.user.accounts = res.data[0].accounts;

                // default to first listed account
                if (self.user.accounts.length) {
                    self.user.activeAccount = self.user.accounts[0];
                }

                if (callback) callback(null, self.user.accounts);
            }
        );
    }


    /**
    * Sets the
    * {{#propertyLink "Connection" "user.activeCompany" "activeCompany"}}{{/propertyLink}}
    * for the current user. If the list of available
    * companies is not yet initialized, this method will attempt to initialize it
    * first, and then set the activeCompany if it exists in the list.
    *
    * Upon successfully setting the activeCompany, the user's activeInitiative
    * and activeAccount, as well as their respective lists, are reset to null.
    *
    * @method setCompany
    * @param {String} companyName The name of the company to set as active.
    * @param {Function} [callback] The callback function to be called with any
    * errors (or null if none exist), and a boolean representing if the
    * activeCompany was successfully set.
    * @example
    *     var conn = new spredfast.Connection(oauth);
    *
    *     conn.getCompanies(function(err, companies) {
    *         if (err) return console.error(err);
    *
    *         conn.setCompany('Planet Express', function(found) {
    *             if (!found) {
    *                 return console.error(new Error('Company not found'));
    *             } else {
    *                 // do something
    *             }
    *         });
    *     });
    * @TODO allow setting company by other parameters, such as ID
    */
    this.setCompany = function(companyName, callback) {
        util.setIfInitializedAndFound(self.user, 'activeCompany', companyName,
            self.user.companies, 'name', self.getCompanies, function(found) {
                self.user.activeCompany.environment =
                    self.user.activeCompany.environment.toLowerCase();

                // Since initiatives are tied to companies,
                // reset the available list of initiatives (and accounts)
                if (found) {
                    self.user.initiatives = null;
                    self.user.activeInitiative = null;
                    self.user.accounts = null;
                    self.user.activeAccount = null;
                }

                if (callback) callback(null, found);
            });
    }

    /**
    * Sets the
    * {{#propertyLink "Connection" "user.activeInitiative" "activeInitiative"}}{{/propertyLink}}
    * for the current user. If the list of available
    * initiatives is not yet initialized, this method will attempt to initialize it
    * first, and then set the activeInitiative if it exists in the list.
    *
    * Upon successfully setting the activeInitiative, the user's activeAccount
    * and list of available accounts are reset to null.
    *
    * @method setInitiative
    * @param {String} initiativeName The name of the initiative to set as active.
    * @param {Function} [callback] The callback function to be called with any
    * errors (or null if none exist), and a boolean representing if the
    * activeInitiative was successfully set.
    * @example
    *     var conn = new spredfast.Connection(oauth);
    *
    *     // Assuming conn.user.companies is already initialized
    *     conn.getInitiatives(function(err, initiatives) {
    *         if (err) return console.error(err);
    *
    *         conn.setInitiative('Marketing', function(found) {
    *             if (!found) {
    *                 return console.error(new Error('Initiative not found'));
    *             } else {
    *                 // do something
    *             }
    *         });
    *     });
    * @TODO allow setting initiative by other parameters, such as ID
    */
    this.setInitiative = function(initiativeName, callback) {
        util.setIfInitializedAndFound(self.user, 'activeInitiative', initiativeName,
            self.user.initiatives, 'name', self.getInitiatives, function(found) {
                // Since accounts are tied to initiatives,
                // reset the available list of accounts
                if (found) {
                    self.user.accounts = null;
                    self.user.activeAccount = null;
                }

                callback(null, found);
            });
    }

    /**
    * Sets the
    * {{#propertyLink "Connection" "user.activeAccount" "activeAccount"}}{{/propertyLink}}
    * for the current user. If the list of available
    * accounts is not yet initialized, this method will attempt to initialize it
    * first, and then set the activeAccount if it exists in the list.
    *
    * @method setAccount
    * @param {String} accountName The name of the account to set as active.
    * @param {Function} [callback] The callback function to be called with any
    * errors (or null if none exist), and a boolean representing if the
    * activeAccount was successfully set.
    * @example
    *     var conn = new spredfast.Connection(oauth);
    *
    *     // Assuming conn.user.companies and conn.user.initiatives
    *     // are already initialized
    *     conn.getAccounts(function(err, accounts) {
    *         if (err) return console.error(err);
    *
    *         conn.setAccount('My Twitter Account', function(found) {
    *             if (!found) {
    *                 return console.error(new Error('Account not found'));
    *             } else {
    *                 // do something
    *             }
    *         });
    *     });
    * @TODO allow setting account by other parameters, such as ID
    */
    this.setAccount = function(accountName, callback) {
        util.setIfInitializedAndFound(self.user, 'activeAccount', accountName,
            self.user.accounts, 'name', self.getAccounts, function(found) {
                callback(null, found);
            });
    }

    /**
    * Method to publish a message via the Conversations API. Requires the current
    * user to have a defined
    * {{#propertyLink "Connection" "user.activeCompany" "activeCompany"}}{{/propertyLink}}
    * and
    * {{#propertyLink "Connection" "user.activeInitiative" "activeInitiative"}}{{/propertyLink}}
    * with which to publish.
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
    * @throws {Error} If the user's account list does not contain one or more of
    * the accounts specified in the message.
    * @throws {Error} If the message's specified accounts are of
    * incorrect Service type to publish the message.
    * @example
    *     var conn = new spredfast.Connection(oauth);
    *
    *     // initialize the user's company, initiative, and accounts
    *
    *     var msg = new spredfast.Message({
    *         service: 'FACEBOOK',
    *         accounts: ['42'],
    *         content: {
    *             sfEntityType: 'Status',
    *             text: 'Here is my status text'
    *         },
    *         callbacks: [
    *             function(req, res) {
    *                 console.log('callback');
    *             }
    *         ]
    *     });
    *
    *     conn.publish(msg, function(err, res) {
    *         if (err) return console.error(err);
    *     });
    */
    this.publish = function(msg, callback) {
        if (!self.user.activeCompany || !self.user.activeInitiative) {
            var err = new Error('The connection must have an active company '
                + 'and an active initiative to publish a message');
            callback(err, null);
            return;
        }

        msg.accounts.forEach(function(account) {
            var matchingAccounts = self.user.accounts.filter(function(acc) {
                return acc.id === account
            });

            if (matchingAccounts.length < 1) {
                throw new Error('No available account with ID ' + account);
            }

            matchingAccounts.forEach(function(acc) {
                if (acc.service !== msg.service) {
                    throw new Error('Account ' + acc.id + ' (' + acc.name + ') '
                        + 'is of incorrect service (' + acc.service + ') to '
                        + 'publish message to ' + msg.service);
                }
            });
        });

        var company = self.user.activeCompany, initiative = self.user.activeInitiative;
        var endpoint = company.environment + '/v1/company/' + company.id
            + '/initiative/' + initiative.id + '/message';
        var options = {
            type: msg.content.sfEntityType === 'Status' ? 'application/json' : 'multipart/form-data',
            send: msg.build()
        };
        self.request(endpoint, 'post', options, callback);
    }

}

module.exports = Connection;
