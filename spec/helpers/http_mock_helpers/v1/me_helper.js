var nock = require('nock')('https://qa2api.spredfast.com', {
        reqheaders: { 'Authorization': 'Bearer 2qwpahvu8sjf539uynvxvshr' }
    }),
    path = '/v1';

function endpoint(method, end) {
    var methodFn = Object.getOwnPropertyDescriptor(nock, method.name).value;
    methodFn = method.body ? methodFn(path + end, method.body) : methodFn(path + end);

    return methodFn.times(100);
}

endpoint({ name: 'get'}, '/me').reply(200, {
    "data": {
        "sfEntityType": "User",
        "email": "h.conrad.express@gmail.com",
        "companies": [
            {
                "sfEntityType": "AvailableCompany",
                "id": "2",
                "name": "Planet Express",
                "environment": "Development"
            },
            {
                "sfEntityType": "AvailableCompany",
                "id": "3",
                "name": "Galaxy Express",
                "environment": "development"
            }
        ]
    },
    "status": {
        "succeeded": true
    }
});
