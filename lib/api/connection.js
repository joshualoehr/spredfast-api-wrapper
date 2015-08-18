var unirest = require('unirest');
var util = require('./util.js');

var supportedMethods = ['get','post'];
var baseUri = 'https://qa2api.spredfast.com/';

// Class containing functions that abstract out common API uses
// TODO in-depth documentation
function Connection(oauth) {
    var self = this; // to sidestep scoping issues
    this.oauth = oauth;
    this.user = {
        email: null,
        companies: null,
        activeCompany: null,
        initiatives: null,
        activeInitiative: null,
        accounts: null,
        activeAccount: null
    };

    // General-purpose method for making requests against the API
    this.request = function(endpoint, method, options, callback) {
        if (typeof options === 'function') {
            callback = options;
        }

        method = method.toLowerCase();
        if (supportedMethods.indexOf(method) === -1) {
            // TODO handle error (unsupported http method)
            throw new Error('Unsupported http method');
        }
        var unirestFn = Object.getOwnPropertyDescriptor(unirest, method).value;

        var req = unirestFn(baseUri + endpoint);
        req.headers({ Authorization: 'Bearer ' + this.oauth.accessToken });
        if (options.query) req.query(options.query);
        req.end(function(res) {
            var err = new Error('Server responded ' + res.status);
            callback(res.status === 200 ? null : err, res ? res.body : null);
        });
    }

    this.getCompanies = function(callback) {
        self.request('v1/me', 'get', function(err, res) {
            if (err) {
                if (callback) callback(err, null);
                return;
            }
            var body = res.body;
            self.user.email = body.data.email;
            self.user.companies = body.data.companies;

            // default to the first listed company
            if (self.user.companies.length) {
                self.user.activeCompany = self.user.companies[0];
            }

            if (callback) callback(err, self.user.companies);
        });
    }

    // TODO support pagination
    this.getInitiatives = function(options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {
                pageSize: 20
            };
        }
        if (!self.user.activeCompany) {
            // TODO handle error (no active company);
            self.user.initiatives = [];
            if (callback) callback(self.user.initiatives);
            return;
        }

        var endpoint = self.user.activeCompany.environment + '/v1/company/'
                        + self.user.activeCompany.id + '/initiative';
        var query = {
            pageSize: options.pageSize,
            pageNumber: options.pageNumber,
            nameFilter: options.nameFilter
        };

        self.request(endpoint, 'get', { query: query }, function(err, res) {
                if (err) {
                    if (callback) callback(err, null);
                    return;
                }
                var body = res.body;
                self.user.initiatives = body.data;

                // default to first listed initiative
                if (self.user.initiatives.length) {
                    self.user.activeInitiative = self.user.initiatives[0];
                }

                if (callback) callback(null, self.user.initiatives);
            }
        );
    }

    // TODO support pagination
    this.getAccounts = function(options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {
                pageSize: 20
            };
        }
        if (!self.user.activeCompany || !self.user.activeInitiative) {
            // TODO handle error (no active company or initiative);
            self.user.accounts = [];
            if (callback) callback(null, self.user.accounts);
            return;
        }

        var endpoint = self.user.activeCompany.environment + '/v1/company/'
                        + self.user.activeCompany.id + '/initiative/'
                        + self.user.activeInitiative.id + '/accountset';

        var query = {};
        if (options.pageSize) query.pageSize = options.pageSize;
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

                var body = res.body;
                self.user.accounts = body.data[0].accounts;

                // default to first listed account
                if (self.user.accounts.length) {
                    self.user.activeAccount = self.user.accounts[0];
                }

                if (callback) callback(null, self.user.accounts);
            }
        );
    }

    // TODO allow setting company by other parameters, such as ID
    this.setCompany = function(companyName, callback) {
        util.setIfInitializedAndFound(self.user, 'activeCompany', companyName,
            self.user.companies, 'name', self.getCompanies, function(found) {
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

    // TODO allow setting initiative by other parameters, such as ID
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

    // TODO allow setting account by other parameters, such as ID
    this.setAccount = function(accountName, callback) {
        util.setIfInitializedAndFound(self.user, 'activeAccount', accountName,
            self.user.accounts, 'name', self.getAccounts, function(found) {
                callback(null, found);
            });
    }

}

module.exports = Connection;
