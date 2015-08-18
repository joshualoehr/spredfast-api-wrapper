var fs = require('fs');
var path = require('path');
var spredfast = require('../lib/spredfast.js');
var unirest = require('unirest');

describe('OAuth', function() {
    var self = this;

    var reset = function() {
        self.configFilepath = path.join(__dirname, 'test_config/oauth.json');
        self.required = ['user'];
        self.oauth = {};
        self.testOptions = {
            user: 'admin@devbox.spredfast.com',
            clientId: 'e65a9f746vt63vqxnu5r87c7',
            clientSecret: 'sSJAgVj9ZQ',
            redirectUri: 'http://localhost:3000/callback'
        };
        self.options = {};
    }

    beforeEach(reset);
    afterEach(reset);

    describe('server flow', function() {
        beforeEach(function() {
            self.required = self.required.concat(['clientId','redirectUri','clientSecret']);
        });

        describe('upon creation', function() {
            it('checks for all required options', function() {
                self.required.forEach(function(option, i, arr) {
                    Object.defineProperty(self.options, option, {
                        value: Object.getOwnPropertyDescriptor(self.testOptions, option).value,
                        enumerable: true,
                        configurable: true
                    });
                    if (Object.keys(self.options).length !== Object.keys(self.testOptions).length) {
                        expect(function() {
                            return spredfast.OAuth.Server(self.options);
                        }).toThrowError('Invalid options');
                    }
                });
                var options = self.options;
                expect(function() {
                    return spredfast.OAuth.Server(self.options);
                }).not.toThrowError('Invalid options');
            });

            it('is defined and instantiated properly', function() {
                self.options = self.testOptions;

                var fn = function() {
                    return spredfast.OAuth.Server(self.options);
                }

                expect(fn).not.toThrow();
                self.oauth = fn();
                expect(self.oauth).toBeDefined();
                expect(self.oauth.type).toEqual('Server');
                expect(self.oauth.grantType).toEqual('authorization_code');
            });
        });

        describe('when authorizing', function() {
            it('returns an authorization url', function() {
                self.options = self.testOptions;
                self.oauth = spredfast.OAuth.Server(self.options);

                expect(typeof self.oauth.authorize()).toEqual('string');
                expect(self.oauth.authorize()).toEqual(
                    'https://infralogin.spredfast.com/v1/oauth/authorize?'
                    + 'response_type=code&client_id=e65a9f746vt63vqxnu5r87c7'
                    + '&redirect_uri=http://localhost:3000/callback'
                );
            });
        });

        describe('after authorizing', function() {
            unirest.get('https://infralogin.spredfast.com/v1/oauth/authorize')
            .end(function(response) {
                self.code = response.code;

                it('gets an access token', function() {
                    var callback = jasmine.createSpy('callback');
                    self.oauth.getAccessToken(self.code, self.configFilepath, callback);

                    var token = util.readOAuthCreds(self.oauth.user,
                        self.configFilepath).accessToken;

                    expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({
                        accessToken: token
                    }));
                });
            });
        });
    });

    describe('from existing configuration', function() {
        beforeEach(function() {
            self.testOptions = {
                user: 'admin@devbox.spredfast.com',
                clientId: 'e65a9f746vt63vqxnu5r87c7',
                clientSecret: 'sSJAgVj9ZQ',
                redirectUri: 'http://localhost:3000/callback',
                path: self.configFilepath
            };
            self.options.path = self.configFilepath;
            fs.writeFileSync(self.configFilepath, '');
        });

        var fn = function() {
            return spredfast.OAuth.Existing(self.options, spredfast.OAuth.Server);
        }

        it('checks for all required options', function() {
            self.required.forEach(function(option, i, arr) {
                Object.defineProperty(self.options, option, {
                    value: Object.getOwnPropertyDescriptor(self.testOptions, option).value,
                    enumerable: true,
                    configurable: true
                });
                if (Object.keys(self.options).length !== Object.keys(self.testOptions).length) {
                    expect(fn).toThrowError('Invalid options');
                }
            });
            self.options = self.testOptions;
            expect(fn).not.toThrowError('Invalid options');
        });

        describe('upon failure to load', function() {
            it('is defined and instantiated properly from the alternative', function() {
                self.options = self.testOptions;
                self.options.user = 'test_user';
                expect(fn).not.toThrow();
                var oauth = fn();

                expect(oauth).toBeDefined();
                expect(oauth.type).toEqual('Server');
                expect(oauth.grantType).toEqual('authorization_code');
            });
        });

        describe('upon loading', function() {
            it('is defined and has an access token', function() {
                var oauth = [];
                oauth['admin@devbox.spredfast.com'] = {
                    accessToken: '2qwpahvu8sjf539uynvxvshr'
                };
                oauth = JSON.stringify(oauth);
                fs.writeFileSync(self.configFilepath, oauth);
                self.options = self.testOptions;

                oauth = fn();
                expect(oauth).toBeDefined();
                expect(oauth.accessToken).toBeDefined();
            });
        });
    });

    it('initializes every property to null on #init', function() {
        var oauth = spredfast.OAuth.Server(self.testOptions);
        oauth.init();
        var keys = Object.keys(oauth);
        keys.forEach(function(key) {
            var value = Object.getOwnPropertyDescriptor(oauth, key).value;
            if (typeof value !== 'function') {
                expect(value).toEqual(null);
            }
        });
    });
});
