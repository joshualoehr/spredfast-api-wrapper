var app;
var util = require('./util.js');

var errors = require('./errors.js');
var OptionError = errors.OptionError;
var ContentError = errors.ContentError;

var services = ['TWITTER', 'FACEBOOK', 'LINKEDIN'];
var contentTypes = ['Status', 'ImageShare'];

var required = ['service','content','accounts'];


/**
* A class representing a Message that may be published by the Conversations API.
*
* Validation Rules:
* <ul>
* <li> Image size can be no larger than 1 GB.
* <li> All supplied accounts must belong to the same service (social network),
* and that service (network) must match the value supplied for the message's
* service attribute.
* <li> Tweets can be no more than 140 characters long, without links. Twitter links
* (including the pic.twitter.com that is created when you publish a message with
* an image) add 22 characters to the total character count.
* <li> New labels can be created only if the user has sufficient privileges.
* Labels that already exist for the company can be added to messages, but creating
* new labels requires the caller's UserPrivilege to include canCreateLabels.
* </ul>
*
* @class Message
* @constructor
* @param {Object} options Options to configure the Message.
* @param {String} options.service The Service type enum representing the medium
* by which this message will be published (e.g. 'TWITTER', 'FACEBOOK', etc.).
* @param {number[]} options.accounts An array of the account ID's corresponding to
* the accounts which will publish this Message. Each of the listed accounts must
* be of the same Service type as the Message.
* @param {Object} options.content An object containing the content that will be
* published by this message.
* @param {String} options.content.sfEntityType The Spredfast entity type of the
* content. Must be either 'Status' or 'ImageShare'.
* @param {String} [options.content.text] The content's text, required if of type 'Status'.
* @param {String} [options.content.caption] The content's caption, if of type 'ImageShare'.
* @param {String} [options.content.temparoraryImageUrl] Temporary URL to the
* original image pointing to where Spredfast stores it prior to publication.
* This URL is only valid for approximately 30 minutes after message retrieval.
* Use only if Message is of type 'ImageShare'.
* @param {String} [options.content.temporaryThumbnailUrl] Temporary URL to the
* thumbnail image pointing to where Spredfast stores it prior to publication.
* This URL is only valid for use for roughly 30 minutes after message retrieval.
* Use only if Message is of type 'ImageShare'.
* @param {Date} [options.date] An ISO-8601-formatted datetime value representing the time
* at which the message should publish. The time must be at least two minutes in
* the future. If no date is specified, the message will be scheduled to publish
* as soon as possible.
* @param {Function[]|String[]} [options.callbacks] An array of either Functions, Strings,
* or both. <br/>If the element is a String, it should be a URI pointing to an HTTP endpoint
* which will accept a POST with a MessageEvent object from the API Server, upon
* publication. <br/>If the element is a Function, this class will automatically
* configure an Express server which will call the supplied Function upon notification
* of successful publication from the API Server.
* @example
*     var fiveMinsFromNow = new Date();
*     fiveMinsFromNow.setMinutes(new Date().getMinutes() + 5);
*
*     var msg = new spredfast.Message({
*         service: 'FACEBOOK',
*         accounts: ['42'],
*         content: {
*             sfEntityType: 'Status',
*             text: 'Here is my status text'
*         },
*         callbacks: [
*             function(req, res) {
*                 console.log('callback');
*             },
*             'http://localhost:3002/callback',
*             'http://www.example.com/callback'
*         ],
*         date: fiveMinsFromNow.toISOString()
*     });
* @throws {ReferenceError|TypeError|OptionError|ContentError}
* ReferenceError: If one or more of the required options is undefined.<br/>
* TypeError: If one or more of the supplied options is of incorrect type.<br/>
* OptionError: If one or more of the required options is not supplied.<br/>
* ContentError: If one or more of the supplied options is of correct type,
* but fails other specific criteria outlined in the above Validation Rules.
* @TODO Image messages
*/
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

    /**
    * Generates the raw JSON to send to the API server.
    *
    * @method build
    * @return {String} The JSON of this Message object.
    */
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

/**
* Custom validation function for Message options. Will be passed to
* util.validateOptions as a set of additonal criteria.
*
* @type Function
* @private
* @param options The options object to be validated.
* @return {Error|null} Any error that arises as a result
* of invalid options, null otherwise.
*/
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

    // Validate options.callbacks
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

/**
* Dynamically sets up an ExpressJS server with a map of callback functions that
* will be called if and when the Spredfast API server sends an HTTP request
* to this callback server with a valid function ID.
*
* @method setupCallback
* @private
* @param {Function|String} callback Either a String URI pointing to a separate
* callback endpoint, or a function to be called upon appropriate notification from
* the Spredfast API.
* @return {String} The URI that the Spredfast API should notify to execute the callback function.
*/
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
