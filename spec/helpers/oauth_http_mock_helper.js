var nock = require('nock');

var baseUri = 'https://infralogin.spredfast.com';
var oauth_auth = nock(baseUri).get('/v1/oauth/authorize')
    .reply(200, {
        code: '6ffgkgwtzn8bddbrjdjawuka'
    });

var oauth_token = nock(baseUri).get('/v1/oauth/token')
    .reply(200, {
        status: 200,
        body: {
            data: {
                accessToken: '2qwpahvu8sjf539uynvxvshr'
            }
        }
    });
