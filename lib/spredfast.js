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
module.exports.ContentTypes = module.exports.Message.ContentTypes;
module.exports.HttpMethods = module.exports.Connection.HttpMethods;
module.exports.Services = module.exports.Message.Services;
