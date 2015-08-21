var app;
var util = require('./util.js');

var errors = require('./errors.js');
var OptionError = errors.OptionError;
var ContentError = errors.ContentError;

var services = ['TWITTER', 'FACEBOOK'];
var contentTypes = ['Status', 'ImageShare'];

var servers = [];

var required = ['service','content','accounts'];
function Message(options) {
    if (err = util.validateOptions(options, required, customValidation)) {
        throw err;
    }

    var self = this;
    Object.keys(options).forEach(function(key) {
        Object.defineProperty(self, key, Object.getOwnPropertyDescriptor(options, key));
    });

    if (self.callbacks) {
        self.callbacks = self.callbacks.map(setupCallback);
    }

    this.build = function() {
        var msgObj = {
            sfEntityType: 'Message',
            service: self.service,
            targetAccountIds: self.accounts,
            content: self.content
        };

        if (self.date) {
            msgObj.scheduledPublishDate = self.date;
        }
        if (self.callbacks) {
            msgObj.callbacks = self.callbacks;
        }
        return JSON.stringify(msgObj);
    }
}

var customValidation = function(options) {
    var errors = [];

    // Validate options.service
    errors.push(util.checkType(options.service, 'options.service', 'string'));
    if (services.indexOf(options.service.toUpperCase()) === -1) {
        errors.push(new ContentError('options.service must be one of ' + services.join()));
    }

    // Validate options.content
    errors.push(util.checkType(options.content, 'options.content', 'object'));
    errors.push(util.checkType(options.content.sfEntityType, 'options.content.sfEntityType', 'string'));
    if (contentTypes.indexOf(options.content.sfEntityType) === -1) {
        errors.push(new ContentError('options.content.sfEntityType must be one of ' + contentTypes.join()));
    } else if (options.content.sfEntityType === 'Status') {
        errors.push(util.checkType(options.content.text, 'options.content.text', 'string'));
        if (options.service === 'TWITTER' && options.content.text.length > 140) {
            errors.push(new ContentError('Tweet text must be less than 140 characters'));
        }
    }

    // Validate options.accounts
    errors.push(util.checkType(options.accounts, 'options.accounts', '[string]'));

    // Validate options.labels
    if (options.labels) {
        errors.push(util.checkType(options.labels, 'options.labels', '[string]'));
    }

    if (options.callbacks) {
        errors.push(util.checkType(options.callbacks,
            'options.callbacks', '[string]||[function]||[multi]'));
    }

    for (var i = 0; i < errors.length; i++) {
        if (errors[i]) {
            return errors[i];
        }
    }
}

var setupCallback = function(callback) {
    if (typeof callback === 'string') {
        return callback;
    }
    if (!app) {
        app = require('express')();
        app.routeFns = [];
        app.post('/callback', function(req, res) {
            var id = req.query.id;
            app.routeFns[id](req, res);
            res.send();
        });
        app.listen(3001);
        console.log('Listening on port 3001');
    }
    var uri = 'http://localhost:3000/callback?id=' + app.routeFns.length;
    app.routeFns.push(callback);
    return uri;
}

module.exports = Message;
