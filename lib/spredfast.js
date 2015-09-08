/**
* Provides the base Spredfast API module.
*
* @module Spredfast
*/
module.exports = {
    Connection: require('./api/connection.js'),
    Message: require('./api/message.js'),
    OAuth: require('./api/oauth.js')
};
module.exports.services = module.exports.Message.services;
module.exports.contentTypes = module.exports.Message.contentTypes;
