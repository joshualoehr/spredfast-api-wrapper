var nock = require('nock')('https://qa2api.spredfast.com', {
        reqheaders: { 'Authorization': 'Bearer 2qwpahvu8sjf539uynvxvshr' }
    }),
    path = '/development/v1/company/2/initiative/2/message';

function endpoint(method, end) {
    var methodFn = Object.getOwnPropertyDescriptor(nock, method.name).value;
    methodFn = method.body ? methodFn(path + end, method.body) : methodFn(path + end);

    return methodFn.times(100);
}

endpoint({ name: 'get' }, '/X').reply(200, {
    "data": {
        "sfEntityType": "Message",
        "id": "X",
        "content": {
            "sfEntityType": "Status",
            "text": "Here is my tweet text"
        },
        "labels": [
            "foo",
            "bar"
        ],
        "service": "TWITTER",
        "targetAccountIds": [
            "42"
        ],
        "status": "PUBLISHED",
        "publicationResults": [
            {
                "sfEntityType": "PublicationResult",
                "accountId": "42",
                "serviceId": "ABCD",
                "serviceLink": "http://twitter.com/user/ABCD",
                "status": "PUBLISHED",
                "datePublished": "2014-09-19T20:44:40Z"
            }
        ]
    },
    "status": {
        "succeeded": true
    }
});

var body = {
    labels: "api",
    content: {
        sfEntityType: "Status",
        text: "Altered text"
    }
};
endpoint({ name: 'put', body: body }, '/X').reply(200, {
    "data": {
        "sfEntityType": "Message",
        "id": "640",
        "content": {
            "sfEntityType": "Status",
            "text": "Altered text"
        },
        "title": "test message",
        "labels": [
            "api"
        ],
        "service": "TWITTER",
        "targetAccountIds": [
            "452"
        ],
        "status": "DRAFT",
        "publicationResults": [
            {
                "sfEntityType": "PublicationResult",
                "accountId": "452",
                "serviceId": null,
                "serviceLink": null,
                "status": "PENDING",
                "datePublished": null
            }
        ],
        "scheduledPublishDate": "2014-12-17T20:51:58.000+0000",
        "callbacks": null
    },
    "status": {
        "succeeded": true
    }
});
