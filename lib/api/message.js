var errors = require('./errors.js'),
    util = require('./util.js');

var app, // eslint-disable-line one-var
    ContentError = errors.ContentError,
    required = ['company', 'initiative', 'accounts', 'service', 'content'],
    Services = {
        FACEBOOK: 'FACEBOOK',
        LINKEDIN: 'LINKEDIN',
        TWITTER: 'TWITTER'
    },
    ContentTypes = {
        STATUS: 'Status',
        IMAGE: 'ImageShare',
        IMAGESHARE: 'ImageShare'
    };

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
* @param {Object} company The company under which this Message will be published.
* @param {Object} initiative The initiative under which this Message will be published.
* @param {String} options.service The Service type enum representing the medium
* by which this message will be published (e.g. 'TWITTER', 'FACEBOOK', etc.).
* @param {number[]} options.accounts An array of accounts with which to publish
* the message. Each of the listed accounts must be of the same Service type as
* the Message.
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
*         company: {
*             "sfEntityType": "AvailableCompany",
*             "id": "2",
*             "name": "Planet Express",
*             "environment": "development"
*         },
*         initiative: {
*             "sfEntityType": "Initiative",
*             "id": 2,
*             "name": "Marketing",
*             "description": null
*         },
*         accounts: [
*             {
*                 "sfEntityType": "Account",
*                 "id": 42,
*                 "service": "FACEBOOK",
*                 "name": "Express_ATX",
*                 "accountType": "USER"
*             },
*             {
*                 "sfEntityType": "Account",
*                 "id": 2,
*                 "service": "FACEBOOK",
*                 "name": "Page: Planet Express",
*                 "accountType": "PAGE"
*             }
*         ],
*         service: 'FACEBOOK',
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
* @TODO Validate labels
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
            targetAccountIds: self.accounts.map(function(account) {
                return account.id.toString();
            }),
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

    /**
    * If the message is of type ImageShare, this function will provide the
    * raw image data needed to send over HTTP.
    *
    * @method imageData
    * @return {fs.ReadStream} A NodeJS Read Stream object for the image.
    */
    this.imageData = function() {
        if (self.content.sfEntityType === 'Status') {
            return null;
        }
        var fs = require('fs');
        return fs.createReadStream(self.content.imagePath);
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
function customValidation(options) {
    var err, valid, invalidAccounts, isStatus, requiredContent;

    // Validate Types

    function validateTypes(obj, typeMap) {
        var keys = Object.keys(typeMap),
            propName, desc, value, i;

        for (i = 0; i < keys.length; i++) {
            propName = keys[i];
            desc = Object.getOwnPropertyDescriptor(obj, propName);
            value = desc ? desc.value : undefined;
            if (err = util.checkType(value, propName, typeMap[propName])) {
                return err;
            }
        }
        return null;
    }

    err = validateTypes(options, {
        company: 'object',
        initiative: 'object',
        service: 'string',
        accounts: '[object]',
        content: 'object',
        labels: 'undefined||[string]',
        callbacks: 'undefined||[string]||[function]||[multi]'
    });
    if (err) return err;

    err = validateTypes(options.content, {
        sfEntityType: 'string',
        text: 'undefined||string',
        imagePath: 'undefined||string',
        caption: 'undefined||string',
        temporaryImageUrl: 'undefined||string',
        temporaryThumbnailUrl: 'undefined||string'
    });
    if (err) return err;

    // Validate Content

    if (!options.company.id) {
        return new ContentError('options.company must have an id property');
    }

    if (!options.company.environment) {
        return new ContentError('options.company must have an environment property');
    }

    if (!options.initiative.id) {
        return new ContentError('options.initiative must have an id property');
    }

    if (!util.validEnum(Services, options.service)) {
        valid = 'spredfast.Services.[' + Object.keys(Services).join() + ']';
        return new ContentError('options.service must be one of ' + valid);
    }

    invalidAccounts = options.accounts.filter(function(account) {
        return account.service !== options.service;
    });
    if (invalidAccounts.length) {
        return new ContentError('One or more target accounts are of incorrect '
            + 'service type to publish to ' + options.service);
    }

    if (!util.validEnum(ContentTypes, options.content.sfEntityType)) {
        valid = 'spredfast.ContentTypes.[' + Object.keys(ContentTypes).join() + ']';
        return new ContentError('options.content.sfEntityType must be one of ' + valid);
    }

    isStatus = options.content.sfEntityType === ContentTypes.STATUS;
    requiredContent = ['sfEntityType', isStatus ? 'text' : 'imagePath'];
    err = util.validateOptions(options.content, requiredContent);
    if (err) return err;

    if (isStatus) {
        if (options.service === Services.TWITTER && options.content.text.length > 140) {
            return new ContentError('Tweet text must be less than 140 characters');
        }
    } else {
        if (util.fileSizeInMegaBytes(options.content.imagePath) >= 1000) {
            return new ContentError(options.content.imagePath + ' must be smaller than 1 GB');
        }
        if (options.service === Services.TWITTER && options.content.caption.length > 117) {
            return new ContentError('Tweet text must be less than 117 characters '
                + 'when including an image');
        }
    }

    return null;
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
* @return {String} The URI that the Spredfast API should notify to execute the
* callback function.
* @TODO Dynamically configure URI
*/
function setupCallback(callback) {
    var uri;

    if (typeof callback === 'string') {
        return callback;
    }
    if (!app) {
        app = require('express')();
        app.routeFns = [];
        app.post('/callback', function(req, res) {
            var id = req.query.id;
            if (fn = app.routeFns[id]) fn(req, res);
            res.end();
        });
        app.listen(3001);
        console.log('Listening on port 3001');
    }
    // var uri = 'https://www.mydomain.com/callback?id=' + app.routeFns.length;
    uri = 'http://callbacktest1.jloehr.ultrahook.com?id=' + app.routeFns.length;
    app.routeFns.push(callback);
    return uri;
}

Message.Services = Object.freeze ? Object.freeze(Services) : Services;
Message.ContentTypes = Object.freeze ? Object.freeze(ContentTypes) : ContentTypes;
module.exports = Message;
