var unirest = require('unirest');

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
            return console.error('Unsupported http method');
        }
        var unirestFn = Object.getOwnPropertyDescriptor(unirest, method).value;

        var req = unirestFn(baseUri + endpoint);
        req.headers({ Authorization: 'Bearer ' + this.oauth.accessToken });
        if (options.query) req.query(options.query);
        req.end(function(res) {
            if (res.status !== 200) {
                // TODO handle error (bad status code)
                return console.error('Server returned status ' + res.status);
            }
            callback(res.body);
        });
    }

    this.getCompanies = function(callback) {
        this.request('v1/me', 'get', function(res) {
            self.user.email = res.data.email;
            self.user.companies = res.data.companies;

            // default to the first listed company
            if (self.user.companies.length) {
                self.user.activeCompany = self.user.companies[0];
            }

            if (callback) callback(self.user.companies);
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
            callback(self.user.initiatives);
        }

        var endpoint = self.user.activeCompany.environment + '/v1/company/'
                        + self.user.activeCompany.id + '/initiative';
        var query = {
            pageSize: options.pageSize,
            pageNumber: options.pageNumber,
            nameFilter: options.nameFilter
        };

        this.request(endpoint, 'get', { query: query }, function(res) {
                self.user.initiatives = res.data;

                // default to first listed initiative
                if (self.user.initiatives.length) {
                    self.user.activeInitiative = self.user.initiatives[0];
                }

                if (callback) callback(self.user.initiatives);
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
            callback(self.user.accounts);
        }

        var endpoint = self.user.activeCompany.environment + '/v1/company/'
                        + self.user.activeCompany.id + '/initiative/'
                        + self.user.activeInitiative.id + '/accountset';
        var query = {
            pageSize: options.pageSize
            pageNumber: options.pageNumber
        };
        if (options.services) {
            query.services = options.services.map(function(val) { return val.toUpperCase(); })
                .join('&services=');
        }

        this.request(endpoint, 'get', { query: query }, function(res) {
                self.user.accounts = res.data;

                // default to first listed account
                if (self.user.accounts.length) {
                    self.user.activeAccount = self.user.accounts[0];
                }

                if (callback) callback(self.user.accounts);
            }
        );
    }

    // TODO allow setting company by other parameters, such as ID
    this.setCompany = function(companyName, callback) {
        util.setIfInitializedAndFound(self.user, 'activeCompany', companyName,
            self.user.companies, 'name', self.getCompanies, callback);

        // Since initiatives are tied to companies, reset the available list of initiatives
        self.user.initiatives = null;
        self.user.activeInitiative = null;
    }

    // TODO allow setting initiative by other parameters, such as ID
    this.setInitiative = function(initiativeName, callback) {
        util.setIfInitializedAndFound(self.user, 'activeInitiative', initiativeName,
            self.user.initiatives, 'name', self.getInitiatives, callback);

        // Since accounts are tied to initiatives, reset the available list of accounts
        self.user.accounts = null;
        self.user.activeAccount = null;
    }

    // TODO allow setting account by other parameters, such as ID
    this.setAccount = function(accountName, callback) {
        util.setIfInitializedAndFound(self.user, 'activeAccount', accountName,
            self.user.accounts, 'name', self.getAccounts, callback);
    }

}

module.exports = Connection;
