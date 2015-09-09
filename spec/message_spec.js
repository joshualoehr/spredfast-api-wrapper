var spredfast = require('../lib/spredfast.js'),
    errors = require('../lib/api/errors.js'),
    OptionError = errors.OptionError,
    ContentError = errors.ContentError,
    util = require('../lib/api/util.js');



describe('A Message', function() {
    var self = this;

    beforeEach(function() {
        self.options = {};
        self.fn = function() {
            return new spredfast.Message(self.options);
        }
    });

    it('checks that all required options exist', function() {
        expect(self.fn).toThrowError(OptionError);
        self.options.company = {};
        expect(self.fn).toThrowError(OptionError);
        self.options.initiative = {};
        expect(self.fn).toThrowError(OptionError);
        self.options.service = '';
        expect(self.fn).toThrowError(OptionError);
        self.options.content = {};
        expect(self.fn).toThrowError(OptionError);
        self.options.accounts = [];
        expect(self.fn).not.toThrowError(OptionError);
    });

    it('checks that all options are of correct type', function() {
        self.options = {
            company: true,
            initiative: true,
            service: true,
            content: true,
            accounts: true
        };

        this.setAndCheck(self.options, 'company', 'object', self.fn);
        this.setAndCheck(self.options, 'initiative', 'object', self.fn);
        this.setAndCheck(self.options, 'service', 'string', self.fn);
        this.setAndCheck(self.options, 'accounts', '[object]', self.fn);
        this.setAndCheck(self.options, 'content', 'object', self.fn);
        this.setAndCheck(self.options, 'labels', 'undefined||[string]', self.fn);
        this.setAndCheck(self.options, 'callbacks', 'undefined||[string]||[function]||[multi]', self.fn);
        this.setAndCheck(self.options.content, 'sfEntityType', 'string', self.fn);
        this.setAndCheck(self.options.content, 'text', 'undefined||string', self.fn);
        this.setAndCheck(self.options.content, 'imagePath', 'undefined||string', self.fn);
        this.setAndCheck(self.options.content, 'caption', 'undefined||string', self.fn);
        this.setAndCheck(self.options.content, 'temporaryImageUrl', 'undefined||string', self.fn);
        this.setAndCheck(self.options.content, 'temporaryThumbnailUrl', 'undefined||string', self.fn);
    });

    it('checks that all options are valid', function() {
        // Status type
        self.options = {
            company: {},
            initiative: {},
            service: '',
            accounts: [{}],
            content: {
                sfEntityType: ''
            }
        }

        expect(self.fn).toThrowError(ContentError, /options.company/);
        self.options.company.id = 2;
        expect(self.fn).toThrowError(ContentError, /options.company/);
        self.options.company.environment = 'development';
        expect(self.fn).not.toThrowError(ContentError, /options.company/);

        expect(self.fn).toThrowError(ContentError, /options.initiative/);
        self.options.initiative.id = 2;
        expect(self.fn).not.toThrowError(ContentError, /options.initiative/);

        expect(self.fn).toThrowError(ContentError, /options\.service/);
        self.options.service = spredfast.services.FACEBOOK;
        expect(self.fn).not.toThrowError(ContentError, /options\.service/);

        expect(self.fn).toThrowError(ContentError, /target accounts/);
        self.options.accounts[0] = {
            "sfEntityType": "Account",
            "id": 40,
            "service": "FACEBOOK",
            "name": "Express_ATX",
            "accountType": "USER"
        };
        expect(self.fn).not.toThrowError(ContentError, /target accounts/);

        expect(self.fn).toThrowError(ContentError, /options\.content\.sfEntityType/);
        self.options.content.sfEntityType = '';
        expect(self.fn).toThrowError(ContentError, /options\.content\.sfEntityType/);
        self.options.content.sfEntityType = spredfast.contentTypes.STATUS;
        expect(self.fn).not.toThrowError(ContentError, /options\.content\.sfEntityType/);

        expect(self.fn).toThrowError(OptionError, /text/);
        self.options.content.text = 'Status text';
        expect(self.fn).not.toThrowError(OptionError, /text/);
        expect(self.fn).not.toThrow();

        // Tweet Status type
        self.options.service = spredfast.services.TWITTER;
        self.options.accounts.forEach(function(account) {
            account.service = spredfast.services.TWITTER;
        });
        self.options.content.text = 'This tweet is over 140 characters.';
        for (var i = self.options.content.text.length; i <= 140; i++) {
            self.options.content.text += '.';
        }
        expect(self.fn).toThrowError(ContentError, /Tweet text/);
        self.options.content.text = 'This tweet is under 140 characters.';
        expect(self.fn).not.toThrowError(ContentError, /Tweet text/);
        expect(self.fn).not.toThrow();

        // ImageShare type
        self.options.content.sfEntityType = spredfast.contentTypes.IMAGE;
        self.options.content.text = undefined;
        expect(self.fn).toThrowError(OptionError, /imagePath/);
        self.options.content.imagePath = '/Users/jloehr/Downloads/image.jpg';
        expect(self.fn).not.toThrowError(OptionError, /imagePath/);
        self.options.content.caption = new Array(141).join('.');
        expect(self.fn).toThrowError(ContentError, /Tweet text/);
        self.options.content.caption = new Array(118).join('.');
        expect(self.fn).not.toThrowError(ContentError, /Tweet text/);
        expect(self.fn).not.toThrow();
    });
});
