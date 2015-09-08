var spredfast = require('../lib/spredfast.js');

describe('A Connection', function() {
    var self = this;

    beforeEach(function() {
        self.errs = [];
        self.oauth = {
            user: 'admin@devbox.spredfast.com',
            accessToken: '2qwpahvu8sjf539uynvxvshr'
        };
        self.conn = new spredfast.Connection(self.oauth);
    });

    describe('when making general API requests', function() {
        it('requires a valid http method', function() {
            var supportedMethods = ['get','post','put'],
                unsupportedMethods = ['patch','delete'];

            unsupportedMethods.forEach(function(method) {
                expect(function() {
                    self.conn.request('v1/me', method, function(){});
                }).toThrowError('Unsupported http method');
            });

            supportedMethods.forEach(function(method) {
                expect(function() {
                    self.conn.request('v1/me', method, function(){});
                }).not.toThrowError('Unsupported http method');
            });
        });

        it('passes an error if the server does not respond with status 200', function() {
            var endpoint = 'v1/error';
            var method = 'get';
            self.conn.request(endpoint, method, function(err, res) {
                expect(err).toBeDefined();
                expect(res.data).toBe(null);
            });
        });

        it('can handle optional query parameters', function() {
            self.conn.request('v1/queries', 'get', {
                query: {pageSize: 100}
            }, function(err, res) {
                expect(err).toBe(null);
                expect(res.status.succeeded).toBe(true);
            });
        });
    });

    describe('when getting user info', function() {
        beforeEach(function(done) {
            var asyncCounter = 0;

            self.conn.getUserEmail(function(err, email) {
                self.errs['getUserEmail'] = err;
                self.email = email;
            });

            self.conn.getCompanies(function(err, companies) {
                self.errs['getCompanies'] = err;
                self.companies = companies;

                var company = companies['Planet Express'];
                self.conn.getUserPrivileges(company, function(err, privileges) {
                    self.errs['getUserPrivileges'] = err;
                    self.privileges = privileges;

                    if (++asyncCounter === 2) done();
                });

                self.conn.getInitiatives(company, function(err, initiatives) {
                    self.errs['getInitiatives'] = err;
                    self.initiatives = initiatives;

                    var initiative = initiatives['Marketing'];
                    self.conn.getAccounts(company, initiative, function(err, accounts) {
                        self.errs['getAccounts'] = err;
                        self.accounts = accounts;

                        if (++asyncCounter === 2) done();
                    });
                });
            });
        });

        it('fetches the user email', function() {
            expect(self.errs['getUserEmail']).toBe(null);
            expect(self.email).toBeDefined();
        });

        it('fetches available companies', function() {
            expect(self.errs['getCompanies']).toBe(null);
            expect(self.companies).toBeDefined();
            expect(self.companies).toEqual({
                'Planet Express': {
                    "sfEntityType": "AvailableCompany",
                    "id": "2",
                    "name": "Planet Express",
                    "environment": "development"
                },
                'Galaxy Express': {
                    "sfEntityType": "AvailableCompany",
                    "id": "3",
                    "name": "Galaxy Express",
                    "environment": "development"
                }
            });
        });

        it('fetches available initiatives', function() {
            expect(self.errs['getInitiatives']).toBe(null);
            expect(self.initiatives).toBeDefined();
            expect(self.initiatives).toEqual({
                'Marketing': {
                    "sfEntityType": "Initiative",
                    "id": 2,
                    "name": "Marketing",
                    "description": null
                },
                'Support': {
                    "sfEntityType": "Initiative",
                    "id": 3,
                    "name": "Support",
                    "description": null
                }
            });
        });

        it('fetches available accounts', function() {
            expect(self.errs['getAccounts']).toBe(null);
            expect(self.accounts).toBeDefined();
            expect(self.accounts).toEqual({
                'Express_ATX': {
                    "sfEntityType": "Account",
                    "id": 1,
                    "service": "TWITTER",
                    "name": "Express_ATX",
                    "accountType": "USER"
                },
                'Page: Planet Express': {
                    "sfEntityType": "Account",
                    "id": 2,
                    "service": "FACEBOOK",
                    "name": "Page: Planet Express",
                    "accountType": "PAGE"
                }
            });
        });

        it('fetches user privileges', function() {
            expect(self.errs['getUserPrivileges']).toBe(null);
            expect(self.privileges).toBeDefined();
            expect(self.privileges).toEqual({
                company: {
                    "sfEntityType": "AvailableCompany",
                    "id": "2",
                    "name": "Planet Express",
                    "environment": "development"
                },
                canPublish: true,
                canCreateLabels: true
            });
        });
    });

    describe('when publishing a message', function() {
        beforeEach(function() {
            self.conn = new spredfast.Connection(self.oauth);
            self.options = {
                company: {
                    "sfEntityType": "AvailableCompany",
                    "id": "2",
                    "name": "Planet Express",
                    "environment": "development"
                },
                initiative: {
                    "sfEntityType": "Initiative",
                    "id": 2,
                    "name": "Marketing",
                    "description": null
                },
                content: {
                    sfEntityType: spredfast.contentTypes.STATUS,
                    text: 'Here is my tweet text'
                },
                labels: [ 'foo', 'bar' ],
                service: spredfast.services.TWITTER,
                accounts: [
                    {
                        "sfEntityType": "Account",
                        "id": 40,
                        "service": "FACEBOOK",
                        "name": "Express_ATX",
                        "accountType": "USER"
                    },
                    {
                        "sfEntityType": "Account",
                        "id": 2,
                        "service": "FACEBOOK",
                        "name": "Page: Planet Express",
                        "accountType": "PAGE"
                    }
                ],
                callbacks: [
                    'http://foodomain.com/notifyhere',
                    'http://goodomain.com/notifyheretoo?somekey=somestate'
                ]
            };

            self.err = undefined, self.res = undefined;
            self.fn = function(callback) {
                self.msg = new spredfast.Message(self.options);
                self.conn.publish(self.msg, function(err, res) {
                    self.err = err;
                    self.res = res;
                    if (callback) callback();
                });
            }
        });

        it('validates that the current user can publish the given message', function() {
            expect(self.fn).toThrowError('One or more target '
                + 'accounts are of incorrect service type to publish to TWITTER');
            self.options.accounts[0].service = spredfast.services.TWITTER;
            self.options.accounts[1].service = spredfast.services.TWITTER;
            expect(self.fn).not.toThrow();

            self.fn(function() {
                expect(self.err).toBe(null);
                expect(self.res).not.toBe(null);
            });


            // TODO labels
        });

        it('should publish successfully', function() {
            self.options.accounts[0].service = spredfast.services.TWITTER;
            self.options.accounts[1].service = spredfast.services.TWITTER;
            self.fn(function() {
                expect(self.err).toBe(null);
                expect(self.res).toEqual({
                    "data": {
                        "sfEntityType": "Message",
                        "id": "X",
                        "content": {
                            "sfEntityType": "Status",
                            "text": "Here is my tweet text"
                        },
                        "labels": [
                            "foo",
                            "bar"
                        ],
                        "service": "TWITTER",
                        "targetAccountIds": [
                            "40","2"
                        ],
                        "status": "PENDING",
                        "publicationResults": [
                            {
                                "sfEntityType": "PublicationResult",
                                "accountId": "42",
                                "status": "PENDING"
                            }
                        ],
                        "callbacks": [
                            "http://foodomain.com/notifyhere",
                            "http://goodomain.com/notifyheretoo?somekey=somestate"
                        ]
                    },
                    "status": {
                        "succeeded": true
                    }
                });
            });
        });
    });
});
