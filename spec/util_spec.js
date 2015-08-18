var fs = require('fs');
var path = require('path');
var spredfast = require('../lib/spredfast.js');
var util = require('../lib/api/util.js');

describe('Utility', function() {
    var self = this;
    describe('#setIfInitializedAndFound', function() {
        var obj, prop, value, list, matchProp, initFn;
        var callback = jasmine.createSpy('callback');

        beforeEach(function() {
            obj = { property: 'pre-test' };
            prop = 'property';
            value = '';
            list = null;
            matchProp = 'name';
            initFn = function(callback) {
                list = [
                    { name: 'dummy0', other: 'someValue0' },
                    { name: 'dummy1', other: 'someValue1' },
                    { name: 'dummy2', other: 'someValue2' },
                    { name: 'dummy3', other: 'someValue3' }
                ];
                callback(null, list);
            }
        });

        it('throws an error if the init function does not initialize the list', function() {
            initFn = function(callback) { callback(null) }
            var fn = function() {
                util.setIfInitializedAndFound(obj, prop, value, list, matchProp, initFn, callback);
            }
            expect(fn).toThrowError('Init function failed to initialize list');
        });

        it('initializes an uninitialized list', function() {
            util.setIfInitializedAndFound(obj, prop, value, list, matchProp, initFn, callback);
            expect(list.length).toBeGreaterThan(0);
        });

        it('does not set the property if not found in the list', function() {
            util.setIfInitializedAndFound(obj, prop, value, list, matchProp, initFn, callback);
            expect(callback).toHaveBeenCalledWith(false);
            expect(Object.getOwnPropertyDescriptor(obj, prop).value).not.toEqual(value);
        });

        it('sets the property if found in the list', function() {
            value = 'dummy2';
            util.setIfInitializedAndFound(obj, prop, value, list, matchProp, initFn, callback);
            expect(callback).toHaveBeenCalledWith(true);
            var listObj = { name: 'dummy2', other: 'someValue2' };
            expect(Object.getOwnPropertyDescriptor(obj, prop).value).toEqual(listObj);
        });
    });
    describe('#writeOAuthCreds and #readOAuthCreds', function() {
        self.filePath = path.join(__dirname, 'test_config/temp.json');
        var reset = function() {
            self.oauth = { user: 'test_user', pass: 'test_pass', clientId: 'test_client_id' };
            fs.writeFile(self.filePath, '', function(err) {
                if (err) throw err;
            });

            self.writeFn = function(obj, path) {
                util.writeOAuthCreds(obj, path);
            }
            self.readFn = function(user, path, log) {
                return util.readOAuthCreds(user, path, log);
            }
        }
        beforeEach(reset);
        afterEach(reset);

        it('writes an oauth object to a JSON file', function() {
            expect(function() {
                self.writeFn(self.oauth, self.filePath);
            }).not.toThrow();
            fs.readFile(self.filePath, 'utf-8', function(err, data) {
                if (err) throw err;
                expect(data).toBeDefined();
                expect(data).toEqual(JSON.stringify(self.oauth));
            });
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
});
