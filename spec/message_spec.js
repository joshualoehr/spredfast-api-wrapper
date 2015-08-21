var spredfast = require('../lib/spredfast.js');
var errors = require('../lib/api/errors.js');
var OptionError = errors.OptionError;
var ContentError = errors.ContentError;

describe('A Message', function() {
    var self = this;

    beforeEach(function() {
        self.options = {};
        self.fn = function() {
            return new spredfast.Message(self.options);
        }
    });

    it('checks for all required options', function() {
        expect(self.fn).toThrowError(OptionError);
        self.options.service = 'TWITTER';
        expect(self.fn).toThrowError(OptionError);
        self.options.content = {
            sfEntityType: 'Status',
            text: 'Here is my tweet text'
        };
        expect(self.fn).toThrowError(OptionError);
        self.options.accounts = ['42'];
        expect(self.fn).not.toThrowError(OptionError);
    });

    it('validates provided options', function() {
        self.options = {
            service: 'TWEETER',
            content: {
                sfEntityType: 'Stasis',
                text: 1234
            },
            accounts: 42
        }
        expect(self.fn).toThrowError(ContentError);
        self.options.service = 'TWITTER';
        expect(self.fn).toThrowError(ContentError);
        self.options.content.sfEntityType = 'Status';
        expect(self.fn).toThrowError(TypeError);
        self.options.content.text = 'This tweet is over 140 characters long.';
        for (var i = 0; i < 140; i++) {
            self.options.content.text += '.';
        }
        expect(self.fn).toThrowError(ContentError);
        self.options.content.text = 'This tweet is less than 140 characters.';
        expect(self.fn).not.toThrowError(ContentError);

        expect(self.fn).toThrowError(TypeError);
        self.options.accounts = [ 42 ];
        expect(self.fn).toThrowError(TypeError);
        self.options.accounts = [ '42' ];
        expect(self.fn).not.toThrowError(TypeError);

    });
});
