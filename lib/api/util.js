var fs = require('fs');
var path = require('path');

var configFilepath = path.join(__dirname, '../config/oauth.json');

module.exports = {
    /*
    * util.setIfInitializedAndFound('activeCompany', companyName, self.user.companies, self.getUserInfo)
    */
    // Tries to set the given property of the given object to the given value if
    // the given list contains an element whose matchProp equals the given value.
    // If the list is not initialized (null or undefined), executes the init function,
    // which should return an initialized list with which to recursively run the setting function again.
    // When finished, executes the callback function with a boolean representing
    // if the value was found in the list.
    setIfInitializedAndFound: function(obj, prop, value, list, matchProp, init, callback) {
        if (!list) {
            init(function(newList) {
                if (!newList) {
                    // TODO handle error (faulty init function)
                    return console.error('Init function failed to initialize the list');
                }
                setIfInitializedAndFound(prop, value, matchProp, newList, init, callback);
            });
        } else {
            var found = false;
            list.forEach(function(el) {
                var val = Object.getOwnPropertyDescriptor(el, matchProp).value;
                if (val === value) {
                    found = true;
                    Object.defineProperty(obj, prop, {
                        value: value,
                        enumerable: true,
                        configurable: true
                    });
                }
            });
            callback(found);
        }
    },

    // Writes the result of the OAuth authorization flow to a JSON file
    writeOAuthCreds: function(oauth) {
        var data = fs.readFileSync(configFilepath, 'utf-8');
        data = eval('(' + data + ')');
        Object.defineProperty(data, oauth.user, {
            value: JSON.stringify(oauth),
            configurable: true,
            enumerable: true
        });
        data = JSON.stringify(data);

        fs.writeFile(configFilepath, data, function(err) {
            if (err) {
                // TODO handle error (file write error)
            }
        });
    },

    // Reads saved OAuth info from a JSON file, and returns the OAuth object
    // which corresponds to the given user
    readOAuthCreds: function(user) {
        var data = fs.readFileSync(configFilepath, 'utf-8');
        data = eval('(' + data + ')');
        var keys = Object.keys(data);
        if (keys.indexOf(user) === -1) {
            return null;
        } else {
            return eval('(' + Object.getOwnPropertyDescriptor(data, user).value + ')');
        }
    }
};
