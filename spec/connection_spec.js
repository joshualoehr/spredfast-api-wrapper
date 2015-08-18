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
                    "environment": "Development"
                },
                {
                    "sfEntityType": "AvailableCompany",
                    "id": "3",
                    "name": "Galaxy Express",
                    "environment": "Development"
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
                expect(res).toBeUndefined();
            });
        });

        it('can handle optional query parameters', function() {
            self.conn.request('v1/queries', 'get', {
                query: {pageSize: 100}
            }, function(err, body) {
                expect(err).toBeUndefined();
                expect(body.query).toEqual(true);
            });
        });
    });
});
