var nock = require('nock')('https://qa2api.spredfast.com', {
        reqheaders: { 'Authorization': 'Bearer 2qwpahvu8sjf539uynvxvshr' }
    }),
    path = '/development/v1/company/2/initiative/2';

function endpoint(method, end) {
    var methodFn = Object.getOwnPropertyDescriptor(nock, method.name).value;
    methodFn = method.body ? methodFn(path + end, method.body) : methodFn(path + end);

    return methodFn.times(100);
}

var body = {
    sfEntityType: 'Message',
    service: 'TWITTER',
    targetAccountIds: ['42'],
    content: {
        sfEntityType: 'Status',
        text: 'Here is my tweet text'
    },
    callbacks: [
        "http://foodomain.com/notifyhere",
        "http://goodomain.com/notifyheretoo?somekey=somestate"
    ],
    labels: [
        "foo",
        "bar"
    ]
};
endpoint({ name: 'post', body: body }, '/message').reply(200, {
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
        "status": "PENDING",
        "publicationResults": [
            {
                "sfEntityType": "PublicationResult",
                "accountId": "42",
                "status": "PENDING"
            }
        ],
        "callbacks": [
            "http://foodomain.com/notifyhere",
            "http://goodomain.com/notifyheretoo?somekey=somestate"
        ]
    },
    "status": {
        "succeeded": true
    }
});
