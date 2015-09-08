
/**
* An error indicating a missing option.
*
* @class OptionError
* @constructor
* @extends Error
*/
function OptionError(message) {
    this.name = 'OptionError';
    this.message = message || 'Invalid options';
    //this.stack = (new Error()).stack;
}
OptionError.prototype = Object.create(Error.prototype);
OptionError.prototype.constructor = OptionError;

/**
* An error indicating a provided option, albeit of correct type, has invalid content.
*
* For example, a function that requires text for a Tweet might throw a ContentError
* if the provided text had more than 140 characters.
*
* @class ContentError
* @constructor
* @extends Error
*/
function ContentError(message) {
    this.name = 'ContentError';
    this.message = message || 'Invalid Message content';
    //this.stack = (new Error()).stack;
}
ContentError.prototype = Object.create(Error.prototype);
ContentError.prototype.constructor = ContentError;

module.exports = {
    OptionError: OptionError,
    ContentError: ContentError
};
