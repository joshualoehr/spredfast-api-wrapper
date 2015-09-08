var fs = require('fs');
var path = require('path');
var spredfast = require('../lib/spredfast.js');
var util = require('../lib/api/util.js');

var errors = require('../lib/api/errors.js');
var OptionError = errors.OptionError;
var ContentError = errors.ContentError;

describe('Utility', function() {
    var self = this;
    describe('#writeOAuthCreds and #readOAuthCreds', function() {
        self.filePath = path.join(__dirname, 'test_config/temp.json');
        var reset = function() {
            self.oauth = { user: 'test_user', pass: 'test_pass', clientId: 'test_client_id' };
            fs.writeFileSync(self.filePath, '');

            self.writeFn = function(obj, path) {
                util.writeOAuthCreds(obj, path);
            }
            self.readFn = function(user, path, log) {
                return util.readOAuthCreds(user, path, log);
            }
        }
        beforeEach(reset);
        afterEach(reset);

        afterAll(function() {
            fs.unlink(self.filePath, function(err) {
                if (err) console.error(err);
            });
        });

        it('writes an oauth object to a JSON file', function() {
            expect(function() {
                self.writeFn(self.oauth, self.filePath);
            }).not.toThrow();
            var data = fs.readFileSync(self.filePath, 'utf-8');
            expect(data).toBeDefined();
            expect(JSON.parse(data).test_user).toEqual(JSON.stringify(self.oauth));
        });

        it('reads an oauth object from a JSON file', function() {
            self.writeFn(self.oauth, self.filePath);
            expect(function() {
                self.readFn(self.oauth.user, self.filePath);
            }).not.toThrow();
            var obj = self.readFn(self.oauth.user, self.filePath);
            expect(obj).toBeDefined();
            expect(obj).toEqual(self.oauth);
        });

        it('does not overwrite existing data in the JSON file', function() {
            self.writeFn(self.oauth, self.filePath);
            var newOAuth = {
                user: 'another_test_user',
                pass: 'another_test_pass',
                clientId: 'another_test_client_id'
            };
            util.writeOAuthCreds(newOAuth, self.filePath);
            var origOAuth = util.readOAuthCreds(self.oauth.user, self.filePath);
            expect(origOAuth).toBeDefined();
            expect(origOAuth).toEqual(self.oauth);
            var readNewOAuth = util.readOAuthCreds(newOAuth.user, self.filePath);
            expect(readNewOAuth).toBeDefined();
            expect(readNewOAuth).toEqual(newOAuth);
        });

        it('returns null if no matching oauth object is found', function() {
            expect(self.readFn(self.oauth.user, self.filePath)).toBe(null);
            self.writeFn(self.oauth, self.filePath);
            expect(util.readOAuthCreds('non-existent', self.filePath)).toBe(null);
        });

        it('uses the default path if none is specified', function() {
            var defaultPath = path.join(__dirname, '../lib/config/oauth.json');
            var orig = fs.readFileSync(defaultPath, 'utf-8');
            fs.writeFileSync(defaultPath + '.bak', orig);
            util.writeOAuthCreds(self.oauth, defaultPath);
            var altered = fs.readFileSync(defaultPath, 'utf-8');
            expect(orig).not.toEqual(altered);
            var oauth = util.readOAuthCreds(self.oauth.user);
            expect(oauth).toEqual(self.oauth);
            fs.writeFileSync(defaultPath, orig);
        });
    });
    describe('#validateOptions', function() {
        beforeEach(function() {
            self.options = undefined;
            self.required = ['one', 'two', 'three', 'four'];
            self.fn = function() {
                if (err = util.validateOptions(self.options, self.required)) {
                    throw err;
                }
            }
        });

        it('checks that options exist', function() {
            expect(self.fn).toThrowError(OptionError);
        });

        it('checks that options contains all required options', function() {
            self.options = {};
            self.options.one = true;
            expect(self.fn).toThrowError(OptionError);
            self.options.two = true;
            expect(self.fn).toThrowError(OptionError);
            self.options.three = true;
            expect(self.fn).toThrowError(OptionError);
            self.options.five = true;
            expect(self.fn).toThrowError(OptionError);
            self.options.four = true;
            expect(self.fn).not.toThrowError(OptionError);
        });

        it('validates against a custom validation function if provided', function() {
            self.options = {};
            expect(self.fn).toThrowError(OptionError);
            self.options.one = true;
            self.options.two = true;
            self.options.three = true;
            self.options.four = true;
            expect(self.fn).not.toThrowError(OptionError);

            self.fn = function() {
                var customValidate = function(options) {
                    if (options.five && options.one !== false) {
                        return new ContentError('Option one must be false if option five exists');
                    }
                    if (options.three !== false) {
                        return new ContentError('Option three must be false');
                    }
                    return null;
                }

                var err = util.validateOptions(self.options, self.required, customValidate);
                if (err) throw err;
            }

            expect(self.fn).not.toThrowError(OptionError);
            expect(self.fn).toThrowError(ContentError);
            self.options.three = false;
            expect(self.fn).not.toThrowError(ContentError);
            self.options.five = true;
            expect(self.fn).toThrowError(ContentError);
            self.options.one = false;
            expect(self.fn).not.toThrowError(ContentError);
        });
    });
});
