var fs = require('fs');
var path = require('path');
var spredfast = require('../lib/spredfast.js');
var unirest = require('unirest');
var util = require('../lib/api/util.js');

var OptionError = require('../lib/api/errors.js').OptionError;
var ContentError = require('../lib/api/errors.js').ContentError;

describe('OAuth', function() {
    var self = this;

    beforeEach(function() {
        self.options = {};
        self.configFilepath = path.join(__dirname, 'test_config/oauth.json');
        self.required = ['user'];
        self.oauth = {};
        self.testOptions = {
            user: 'admin@devbox.spredfast.com',
            clientId: 'e65a9f746vt63vqxnu5r87c7',
            clientSecret: 'sSJAgVj9ZQ',
            redirectUri: 'http://localhost:3000/callback'
        };
        self.fn = null;
    });

    describe('server flow', function() {
        beforeEach(function() {
            self.required = self.required.concat(['clientId','redirectUri','clientSecret']);
            self.fn = function() {
                return spredfast.OAuth.Server(self.options);
            }
        });

        describe('upon creation', function() {
            it('checks for all required options', function() {
                this.validateOptions(self.required, self.options, self.testOptions, self.fn);
                self.options = self.testOptions;
                expect(self.fn).not.toThrowError(OptionError);
            });

            it('is defined and instantiated properly', function() {
                self.options = self.testOptions;
                expect(self.fn).not.toThrow();

                self.oauth = self.fn();
                expect(self.oauth).toBeDefined();
                expect(self.oauth.type).toEqual('Server');
                expect(self.oauth.grantType).toEqual('authorization_code');
            });
        });

        describe('when authorizing', function() {
            it('returns an authorization url', function() {
                self.options = self.testOptions;
                self.oauth = self.fn();

                var authUrl = self.oauth.authorize();
                expect(authUrl).toEqual(
                    'https://infralogin.spredfast.com/v1/oauth/authorize?'
                    + 'response_type=code&client_id=e65a9f746vt63vqxnu5r87c7'
                    + '&redirect_uri=http://localhost:3000/callback'
                );
            });
        });

        describe('after authorizing', function() {
            beforeEach(function(done) {
                self.options = self.testOptions;
                self.oauth = self.fn();
                unirest.get(self.oauth.authorize()).end(function(response) {
                    self.code = response.body.code;
                    done();
                });
            });

            it('gets an access token', function() {
                self.oauth.getAccessToken(self.code, self.configFilepath, function(err, oauth) {
                    expect(err).toBe(null);
                    var token = util.readOAuthCreds(self.oauth.user,
                        self.configFilepath).accessToken;
                    expect(oauth.accessToken).toEqual(token);
                });
            });
        });
    });

    describe('from existing configuration', function() {
        beforeEach(function() {
            fs.writeFileSync(self.configFilepath, '');
            self.testOptions.path = self.configFilepath;
            self.options.path = self.configFilepath;
            self.fn = function() {
                return spredfast.OAuth.Existing(self.options, spredfast.OAuth.Server);
            }
        });

        it('checks for all required options', function() {
            this.validateOptions(self.required, self.options, self.testOptions, self.fn);
            self.options = self.testOptions;
            expect(self.fn).not.toThrowError(OptionError);
        });

        describe('upon failure to load', function() {
            it('is defined and instantiated properly from the alternative', function() {
                self.options = self.testOptions;
                self.options.user = 'test_user';
                expect(self.fn).not.toThrow();
                var oauth = self.fn();

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

                oauth = self.fn();
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
