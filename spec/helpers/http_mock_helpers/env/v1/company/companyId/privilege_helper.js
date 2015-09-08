var nock = require('nock')('https://qa2api.spredfast.com', {
        reqheaders: { 'Authorization': 'Bearer 2qwpahvu8sjf539uynvxvshr' }
    }),
    path = '/development/v1/company/2';

function endpoint(method, end) {
    var methodFn = Object.getOwnPropertyDescriptor(nock, method.name).value;
    methodFn = method.body ? methodFn(path + end, method.body) : methodFn(path + end);

    return methodFn.times(100);
}

endpoint({ name: 'get' }, '/privilege').reply(200, {
    "data": {
        "sfEntityType" : "UserPrivilege",
        "canPublish" : true,
        "canCreateLabels" : true
    },
    "status": {
        "succeeded": true
    }
});
