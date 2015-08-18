var nock = require('nock');

var baseUri = 'https://qa2api.spredfast.com';
var header = { reqheaders: { 'Authorization': 'Bearer 2qwpahvu8sjf539uynvxvshr' } };
var num = 100; // Number of times to repeat the mocked http response,
               // since nock only mocks the first response by default

var getCurrentUser = nock(baseUri, header).get('/v1/me')
.times(num).reply(200, {
    status: 200,
    body: {
        data: {
            sfEntityType: "User",
            email: "h.conrad.express@gmail.com",
            companies: [
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
                    "environment": "Development"
                }
            ]
        },
        status: {
            succeeded: true
        }
    }
});

var endpoint = '/Development/v1/company/2/initiative';
var getInitiatives = nock(baseUri, header).get(endpoint)
.query(true)
.times(num).reply(200, {
    status: 200,
    body: {
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
    }
});

endpoint = '/Development/v1/company/2/initiative/2/accountset';
var getAccounts = nock(baseUri, header).get(endpoint)
.query(true)
.times(num).reply(200, {
    status: 200,
    body: {
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
    }
});

var error = nock(baseUri, header).get('/v1/error')
.times(num).reply(500, {
    status: 500,
    body: null
});

var queries = nock(baseUri, header).get('/v1/queries')
.times(num).query(true)
.reply(200, {
    status: 200,
    body: {
        query: true
    }
});
