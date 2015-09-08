var nock = require('nock')('https://qa2api.spredfast.com', {
        reqheaders: { 'Authorization': 'Bearer 2qwpahvu8sjf539uynvxvshr' }
    }),
    path = '/v1/oauth';

function endpoint(method, end) {
    var methodFn = Object.getOwnPropertyDescriptor(nock, method.name).value;
    methodFn = method.body ? methodFn(path + end, method.body) : methodFn(path + end);

    return methodFn.times(100);
}

endpoint({ name: 'get'}, '/authorize').query(true).reply(200,
    {
        code: '6ffgkgwtzn8bddbrjdjawuka'
    }
);

var body = {
    clientId: 'e65a9f746vt63vqxnu5r87c7',
    clientSecret: 'sSJAgVj9ZQ',
    redirectUri: 'http://localhost:3000/callback',
    code: '6ffgkgwtzn8bddbrjdjawuka'
};
endpoint({ name: 'post', body: body}, '/token').reply(200, {
    "data": {
        "sfEntityType": "Token",
        "accessToken": "SlAV32hkKG",
        "expiryTime": "2014-09-03T15:23:34Z"
    },
    "status": {
        "succeeded": true
    }
});
