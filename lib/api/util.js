var fs = require('fs');
var path = require('path');

var errors = require('./errors.js');
var OptionError = errors.OptionError;
var ContentError = errors.ContentError;

var config = path.join(__dirname, '../config/oauth.json');

var ports = [];

module.exports = {
    validateOptions: function(options, required, customValidate) {
        if (!options)
            return new OptionError('No options provided.');
        var optionKeys = Object.keys(options);
        for (var i = 0; i < required.length; i++) {
            if (!Object.getOwnPropertyDescriptor(options, required[i])) {
                return new OptionError('Option property "'+required[i]+'" is required.');
            }
        }

        return customValidate ? customValidate(options) : null;
    },

    checkType: function(foo, name, expectedTypes) {
        if (!foo) {
            return new ReferenceError(name + ' must be defined');
        }
        var type = [typeof foo, this.getType(foo)];
        expectedTypes = expectedTypes.split('||');

        if (expectedTypes.indexOf(type[1]) === -1) {
            return new TypeError(name + ' (' + type[0] + ') '
            + 'must be one of ' + expectedTypes);
        }

        return null;
    },

    isArray: function(foo) {
        return Object.prototype.toString.call(foo) === '[object Array]';
    },

    getType: function(foo) {
        var type = '';
        if (this.isArray(foo)) {
            var barType = null;
            foo.forEach(function(bar) {
                if (!barType) barType = typeof bar;
                else if (barType !== typeof bar) barType = 'multi';
            });
            type = '[' + barType + ']';
        } else if (foo === null) {
            type = 'null';
        } else {
            type = typeof foo;
        }
        return type;
    },


    // Tries to set the given property of the given object to the given value if
    // the given list contains an element whose matchProp equals the given value.
    // If the list is not initialized (null or undefined), executes the init function,
    // which should return an initialized list with which to recursively run the setting function again.
    // When finished, executes the callback function with a boolean representing
    // if the value was found in the list.
    setIfInitializedAndFound: function(obj, prop, value, list, matchProp, init, callback) {
        if (!list) {
            //var setIfInitializedAndFound = this.setIfInitializedAndFound;
            init(function(err, newList) {
                if (err || !newList) {
                    // TODO handle error (faulty init function)
                    throw new Error('Init function failed to initialize list');
                }
                var util = require('./util.js');
                util.setIfInitializedAndFound(obj, prop, value, newList, matchProp, init, callback);
            });
        } else {
            var found = false;
            list.forEach(function(el) {
                var descriptor = Object.getOwnPropertyDescriptor(el, matchProp);
                if (!descriptor) return;

                if (descriptor.value === value) {
                    found = true;
                    Object.defineProperty(obj, prop, {
                        value: el,
                        enumerable: true,
                        configurable: true
                    });
                }
            });
            if (callback) callback(found);
        }
    },

    // Writes the result of the OAuth authorization flow to a JSON file
    writeOAuthCreds: function(oauth, path) {
        var configFilepath = path ? path : config;
        var data = fs.readFileSync(configFilepath, 'utf-8');
        if (data) {
            data = JSON.parse(data);
        } else {
            data = {};
        }

        Object.defineProperty(data, oauth.user, {
            value: JSON.stringify(oauth),
            configurable: true,
            enumerable: true
        });
        data = JSON.stringify(data);

        fs.writeFileSync(configFilepath, data);
    },

    // Reads saved OAuth info from a JSON file, and returns the OAuth object
    // which corresponds to the given user
    // TODO try to remove try/catch blocks
    readOAuthCreds: function(user, path) {
        var configFilepath = path ? path : config;
        var data = fs.readFileSync(configFilepath, 'utf-8');
        if (!data) return null;

        data = JSON.parse(data);

        var oauth = Object.getOwnPropertyDescriptor(data, user);
        return oauth ? JSON.parse(oauth.value) : null;
    },

    getPort: function() {
        for (var port = 3001; port < 4000; port++) {
            if (ports.indexOf(port) === -1) {
                ports.push(port);
                return port;
            }
        }
        throw new Error('Too many ports in use');
    },

    releasePort: function(port) {
        ports = ports.filter(function(r) {
            return r !== port;
        });
    }
};
