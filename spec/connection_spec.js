var spredfast = require('../lib/spredfast.js');

describe('A Connection', function() {
    var self = this;

    beforeEach(function() {
        self.oauth = {
            user: 'admin@devbox.spredfast.com',
            accessToken: '2qwpahvu8sjf539uynvxvshr'
        };
        self.errs = [];
        self.conn = new spredfast.Connection(self.oauth);
    });

    it('can fetch companies, initiatives, and accounts', function() {
        expect(self.conn.getCompanies).not.toThrow();
        expect(self.conn.getInitiatives).not.toThrow();
        expect(self.conn.getAccounts).not.toThrow();
    });

    describe('when making general API requests', function() {
        it('requires a valid http method', function() {
            var supportedMethods = ['get','post'],
                unsupportedMethods = ['put','delete'];

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
                expect(res.body).toBe(null);
            });
        });

        it('can handle optional query parameters', function() {
            self.conn.request('v1/queries', 'get', {
                query: {pageSize: 100}
            }, function(err, res) {
                expect(err).toBe(null);
                expect(res.body.query).toEqual(true);
            });
        });
    });

    describe('when getting user info', function() {
        beforeEach(function(done) {
            self.conn.getCompanies(function(err, companies) {
                self.errs.push(err);
                self.conn.getInitiatives(function(err, initiatives) {
                    self.errs.push(err);
                    self.conn.getAccounts(function(err, accounts) {
                        self.errs.push(err);
                        self.companies = companies;
                        self.initiatives = initiatives;
                        self.accounts = accounts;
                        done();
                    });
                });
            });
        });

        it('fetches available companies', function() {
            expect(self.errs[0]).toBe(null);
            expect(self.companies).toBeDefined();
            expect(self.companies).toEqual([
                {
                    "sfEntityType": "AvailableCompany",
                    "id": "2",
                    "name": "Planet Express",
                    "environment": "development"
                },
                {
                    "sfEntityType": "AvailableCompany",
                    "id": "3",
                    "name": "Galaxy Express",
                    "environment": "development"
                }
            ]);
            expect(self.conn.user.companies).toBe(self.companies);
            if (self.companies.length) {
                expect(self.conn.user.activeCompany).toBe(self.companies[0]);
            }
            expect(self.conn.user.email).toBeDefined();
        });

        it('fetches available initiatives', function() {
            expect(self.errs[1]).toBe(null);
            expect(self.initiatives).toBeDefined();
            expect(self.initiatives).toEqual([
                {
                    "sfEntityType": "Initiative",
                    "id": 2,
                    "name": "Marketing",
                    "description": null
                },
                {
                    "sfEntityType": "Initiative",
                    "id": 3,
                    "name": "Support",
                    "description": null
                }
            ]);
            expect(self.conn.user.initatives).toBe(self.initatives);
            if (self.initiatives.length) {
                expect(self.conn.user.activeInitiative).toBe(self.initiatives[0]);
            }
        });

        it('fetches available accounts', function() {
            expect(self.errs[2]).toBe(null);
            expect(self.accounts).toBeDefined();
            expect(self.accounts).toEqual([
                {
                    "sfEntityType": "Account",
                    "id": 1,
                    "service": "TWITTER",
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
            ]);
            expect(self.conn.user.accounts).toBe(self.accounts);
            if (self.accounts.length) {
                expect(self.conn.user.activeAccount).toBe(self.accounts[0]);
            }
        });
    });

    describe('when setting user info', function() {
        it('sets the active company', function(done) {
            self.conn.setCompany('Galaxy Express', function(err, found) {
                expect(err).toBe(null);
                expect(found).toEqual(true);
                expect(self.conn.user.companies).toBeDefined();
                expect(self.conn.user.activeCompany.name).toEqual('Galaxy Express');
                expect(self.conn.user.initiatives).toBe(null);
                expect(self.conn.user.activeInitiative).toBe(null);
                expect(self.conn.user.accounts).toBe(null);
                expect(self.conn.user.activeAccount).toBe(null);
                done();
            });
        });

        it('sets the active initiative', function(done) {
            self.conn.getCompanies(function(err, companies) {
                self.conn.setInitiative('Support', function(err, found) {
                    expect(err).toBe(null);
                    expect(found).toEqual(true);
                    expect(self.conn.user.companies).toBeDefined();
                    expect(self.conn.user.activeCompany).toBeDefined();
                    expect(self.conn.user.initiatives).toBeDefined();
                    expect(self.conn.user.activeInitiative.name).toEqual('Support');
                    expect(self.conn.user.accounts).toBe(null);
                    expect(self.conn.user.activeAccount).toBe(null);
                    done();
                });
            });
        });

        it('sets the active account', function(done) {
            self.conn.getCompanies(function(err, companies) {
                self.conn.getInitiatives(function(err, initiatives) {
                    self.conn.setAccount('Page: Planet Express', function(err, found) {
                        expect(err).toBe(null);
                        expect(found).toEqual(true);
                        expect(self.conn.user.companies).toBeDefined();
                        expect(self.conn.user.activeCompany).toBeDefined();
                        expect(self.conn.user.initiatives).toBeDefined();
                        expect(self.conn.user.activeInitiative).toBeDefined();
                        expect(self.conn.user.accounts).toBeDefined();
                        expect(self.conn.user.activeAccount.name).toEqual('Page: Planet Express');
                        done();
                    });
                });
            });
        });
    });

    describe('when publishing a message', function() {
        beforeEach(function() {
            self.conn = new spredfast.Connection(self.oauth);
            self.conn.user = {
                email: 'admin@devbox.spredfast.com',
                activeCompany: {
                    "sfEntityType": "AvailableCompany",
                    "id": "2",
                    "name": "Planet Express",
                    "environment": "development"
                },
                activeInitiative: {
                    "sfEntityType": "Initiative",
                    "id": 2,
                    "name": "Marketing",
                    "description": null
                },
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
                ]
            };

            self.msg = new spredfast.Message({
                content: { sfEntityType: 'Status', text: 'Here is my tweet text' },
                scheduledPublishDate: new Date((new Date()).getTime() + (5 * 60000)), // five mins from now
                labels: [ 'foo', 'bar' ],
                service: 'TWITTER',
                accounts: [ '42' ],
                callbacks: [
                    'http://foodomain.com/notifyhere',
                    'http://goodomain.com/notifyheretoo?somekey=somestate'
                ]
            });
        });

        it('requires an activeCompany and an activeInitative to be set', function() {
            self.conn.user.activeCompany = null;
            self.conn.user.activeInitative = null;
            var callback = jasmine.createSpy('callback');
            self.conn.publish(self.msg, callback);
            expect(callback).toHaveBeenCalledWith(jasmine.any(Error), null);
        });

        it('validates that the current user can publish the given message', function() {
            var fn = function() {
                self.conn.publish(self.msg, function(err, res){});
            }

            expect(fn).toThrowError('No available account with ID 42');
            self.conn.user.accounts[0].id = '42';
            expect(fn).toThrowError('Account 42 (Express_ATX) is of incorrect ' +
                'service (FACEBOOK) to publish message to TWITTER');
            self.conn.user.accounts[0].service = 'TWITTER';
            expect(fn).not.toThrow();
        });

        it('should publish successfully', function() {
            self.conn.user.accounts[0].id = '42';
            self.conn.user.accounts[0].service = 'TWITTER';
            self.conn.publish(self.msg, function(err, res) {
                
                expect(err).toBe(null);
                expect(res.body).toEqual({
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
                            "42"
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
