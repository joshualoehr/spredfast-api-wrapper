var nock = require('nock')('https://qa2api.spredfast.com', {
        reqheaders: { 'Authorization': 'Bearer 2qwpahvu8sjf539uynvxvshr' }
    }),
    path = '/development/v1/company/2';

function endpoint(method, end) {
    var methodFn = Object.getOwnPropertyDescriptor(nock, method.name).value;
    methodFn = method.body ? methodFn(path + end, method.body) : methodFn(path + end);

    return methodFn.times(100);
}

endpoint({ name: 'get'}, '/initiative').reply(200, {
    "data": [
        {
            "sfEntityType": "Initiative",
            "id": 2,
            "name": "Marketing",
            "description": null
        },
        {
            "sfEntityType": "Initiative",
            "id": 3,
            "name": "Support",
            "description": null
        }
    ],
    "status": {
        "succeeded": true
    },
    "pagination": {
        "totalItems": 2
    }
});

endpoint({ name: 'get' }, '/initiative').query(true).reply(200, {
    "data": [
        {
            "sfEntityType": "Initiative",
            "id": 2,
            "name": "Marketing",
            "description": null
        },
        {
            "sfEntityType": "Initiative",
            "id": 3,
            "name": "Support",
            "description": null
        }
    ],
    "status": {
        "succeeded": true
    },
    "pagination": {
        "totalItems": 2
    }
});
