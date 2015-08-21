function OptionError(message) {
    this.name = 'OptionError';
    this.message = message || 'Invalid options';
    this.stack = (new Error()).stack;
}
OptionError.prototype = Object.create(Error.prototype);
OptionError.prototype.constructor = OptionError;

function ContentError(message) {
    this.name = 'ContentError';
    this.message = message || 'Invalid Message content';
    this.stack = (new Error()).stack;
}
ContentError.prototype = Object.create(Error.prototype);
ContentError.prototype.constructor = ContentError;

module.exports = {
    OptionError: OptionError,
    ContentError: ContentError
};
