var nock = require('nock')('https://qa2api.spredfast.com', {
        reqheaders: { 'Authorization': 'Bearer 2qwpahvu8sjf539uynvxvshr' }
    }),
    path = '/development/v1/company/2';

function endpoint(method, end) {
    var methodFn = Object.getOwnPropertyDescriptor(nock, method.name).value;
    methodFn = method.body ? methodFn(path + end, method.body) : methodFn(path + end);

    return methodFn.times(100);
}

endpoint({ name: 'get' }, '/folder').reply(200, {
    "data": [
        {
            "sfEntityType": "AssetFolder",
            "id": "1",
            "companyId": "1",
            "name": "Company images",
            "description": "Folder to save company logos",
            "createdDate": "2014-11-06T15:10:20.139+0000"
        }
    ],
    "pagination": {
        "next": "pageSize=20&pageNumber=2",
        "totalItems": "55"
    },
    "status":{
        "succeeded": "true"
    }
});

endpoint({ name: 'get'}, '/folder').query({pageNumber: 3, pageSize: 10}).reply(200, {
    "data": [
        {
            "sfEntityType": "AssetFolder",
            "id": "1",
            "companyId": "1",
            "name": "Company images",
            "description": "Folder to save company logos",
            "createdDate": "2014-11-06T15:10:20.139+0000"
        }
    ],
    "pagination": {
        "next": "pageSize=10&pageNumber=4",
        "previous": "pageSize=10&pageNumber=2",
        "totalItems": "55"
    },
    "status":{
        "succeeded": "true"
    }
});

var body = {
    "sfEntityType": "AssetFolder",
    "name": "Company images"
};
endpoint({ name: 'post', body: body }, '/folder').reply(200, {
    "data":{
        "sfEntityType": "AssetFolder",
        "id": "1",
        "companyId": "1",
        "name": "Company images",
        "description": "Folder to save company logos",
        "createdDate": "2014-11-06T15:10:20.139+0000"
    },
    "status":{
       "succeeded": "true"
    }
});
