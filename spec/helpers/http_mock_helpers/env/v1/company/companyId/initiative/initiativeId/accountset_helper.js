var nock = require('nock')('https://qa2api.spredfast.com', {
        reqheaders: { 'Authorization': 'Bearer 2qwpahvu8sjf539uynvxvshr' }
    }),
    path = '/development/v1/company/2/initiative/2';

function endpoint(method, end) {
    var methodFn = Object.getOwnPropertyDescriptor(nock, method.name).value;
    methodFn = method.body ? methodFn(path + end, method.body) : methodFn(path + end);

    return methodFn.times(100);
}

endpoint({ name: 'get' }, '/accountset').reply(200, {
    "data": [
        {
            "sfEntityType": "AccountSet",
            "id": 1,
            "name": "Marketing",
            "description": "",
            "thumbnailUrl": null,
            "accounts": [
                {
                    "sfEntityType": "Account",
                    "id": 1,
                    "service": "TWITTER",
                    "name": "Express_ATX",
                    "accountType": "USER"
                },
                {
                    "sfEntityType": "Account",
                    "id": 2,
                    "service": "FACEBOOK",
                    "name": "Page: Planet Express",
                    "accountType": "PAGE"
                }
            ]
        }
    ],
    "status": {
        "succeeded": true
    },
    "pagination": {
        "totalItems": 1
    }
});

endpoint({ name: 'get' }, '/accountset').query(true).reply(200, {
    "data": [
        {
            "sfEntityType": "AccountSet",
            "id": 1,
            "name": "Marketing",
            "description": "",
            "thumbnailUrl": null,
            "accounts": [
                {
                    "sfEntityType": "Account",
                    "id": 1,
                    "service": "TWITTER",
                    "name": "Express_ATX",
                    "accountType": "USER"
                },
                {
                    "sfEntityType": "Account",
                    "id": 2,
                    "service": "FACEBOOK",
                    "name": "Page: Planet Express",
                    "accountType": "PAGE"
                }
            ]
        }
    ],
    "status": {
        "succeeded": true
    },
    "pagination": {
        "totalItems": 1
    }
});
