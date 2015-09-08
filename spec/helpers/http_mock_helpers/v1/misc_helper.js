var nock = require('nock')('https://qa2api.spredfast.com', {
        reqheaders: { 'Authorization': 'Bearer 2qwpahvu8sjf539uynvxvshr' }
    }),
    path = '/v1';

function endpoint(method, end) {
    var methodFn = Object.getOwnPropertyDescriptor(nock, method.name).value;
    methodFn = method.body ? methodFn(path + end, method.body) : methodFn(path + end);

    return methodFn.times(100);
}

endpoint({ name: 'get' }, '/error').reply(500, {
    "data": null,
    "status": {
        "succeeded": false
    }
});

endpoint({ name: 'get' }, '/queries').query(true).reply(200, {
    "data": {},
    "status": {
        "succeeded": true
    }
});
