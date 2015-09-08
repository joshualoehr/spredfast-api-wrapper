var fs = require('fs');
var path = require('path');

var errors = require('./errors.js');
var OptionError = errors.OptionError;
var ContentError = errors.ContentError;

var config = path.join(__dirname, '../config/oauth.json');

var ports = [];

/**
* Class containing utility functions.
*
* @class Util
* @static
*/
module.exports = {

    /**
    * Validates an options object by checking for required properties. If an
    * optional validation function is provided, this method will check against
    * that as well.
    *
    * @method validateOptions
    * @static
    * @param {Object} options The options object to be validated.
    * @param {String[]} required A list of required property names.
    * @param {Function} [customValidate] An optional, additional validation function
    * to check options against further criteria. Invoked with the options object.
    * @return {Error|null} An OptionError if one or more of the required options are missing,
    * or the result of calling customValidate with the options object, otherwise
    * null if no custom validation function is provided.
    */
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

    /**
    * Checks the type of a variable against a list of accepted types, and throws
    * an error if the type is not acceptable.
    *
    * @method checkType
    * @static
    * @param {any} foo The variable whose type will be checked.
    * @param {String} name The semantic name of the variable (used for error
    * message construction).
    * @param {String} expectedTypes A String consisting of acceptable types, delimited
    * by double bars ('||').
    * @return {Error|null} An error if the variable is not of correct type, null otherwise.
    */
    checkType: function(foo, name, expectedTypes) {
        var type = [typeof foo, this.getType(foo)];
        expectedTypes = expectedTypes.split('||');

        if (expectedTypes.indexOf(type[1]) === -1) {
            return new TypeError(name + ' (' + type[0] + ') '
            + 'must be of type(s): ' + expectedTypes);
        }

        return null;
    },

    /**
    * A slightly more robust way of determining the type of a variable, which
    * will also specify if the variable is an array, as well as the types of the
    * array's elements.
    *
    * @method getType
    * @static
    * @param foo The variable whose type will be determined.
    * @return {String} The variable's type.
    */
    getType: function(foo) {
        var type = '';
        if (Array.isArray(foo)) {
            var barType = null;
            foo.forEach(function(bar) {
                if (!barType) barType = bar === null ? 'null' : typeof bar;
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

    /**
    * Writes the result of the OAuth authorization flow to a JSON file.
    *
    * @method writeOAuthCreds
    * @static
    * @param {Object} oauth The completed OAuth object.
    * @param {String} [path] The file path to the JSON file in which the OAuth
    * object should be written. Defaults to `lib/config/config.json`.
    */
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

    /**
    * Reads saved OAuth info from a JSON file, and returns the OAuth object
    * which corresponds to the given user.
    *
    * @method readOAuthCreds
    * @static
    * @param {String} user The email address of the user corresponding to the
    * OAuth object to be retrieved.
    * @param {String} [path] The file path to the JSON file from which the OAuth
    * object should be read. Defaults to `lib/config/config.json`.
    * @return {Object} The completed OAuth object.
    */
    readOAuthCreds: function(user, path) {
        var configFilepath = path ? path : config;
        var data = fs.readFileSync(configFilepath, 'utf-8');
        if (!data) return null;

        data = JSON.parse(data);

        var oauth = Object.getOwnPropertyDescriptor(data, user);
        return oauth ? JSON.parse(oauth.value) : null;
    },

    /**
    * Determines if the value provided is equal to one or more of a given
    * enum object's values.
    *
    * @method validEnum
    * @static
    * @param {Object} obj The enum object.
    * @return {Object} The value to be checked.
    */
    validEnum: function(obj, value) {
        return Object.keys(obj).map(function(key){
            return obj[key];
        }).some(function(val) {
            return Object.is(val, value);
        });
    },

    /**
    * Convenience function to return a file's size in MB
    *
    * @method fileSizeInMegaBytes
    * @static
    * @param {String} filePath Path to the file whose size will be returned.
    * @return {Number} The size of the file in MB.
    */
    fileSizeInMegaBytes: function(filePath) {
        if (!filePath) return 0;
        return fs.statSync(filePath)['size'] / 1000000.0;
    }
};
