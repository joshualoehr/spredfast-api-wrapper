var nock = require('nock')('https://qa2api.spredfast.com', {
        reqheaders: { 'Authorization': 'Bearer 2qwpahvu8sjf539uynvxvshr' }
    }),
    path = '/developtment/v1/company/2/folder';

function endpoint(method, end) {
    var methodFn = Object.getOwnPropertyDescriptor(nock, method.name).value;
    methodFn = method.body ? methodFn(path + end, method.body) : methodFn(path + end);

    return methodFn.times(100);
}

endpoint({ name: 'get' }, '/1').reply(200, {
    "data": {
        "sfEntityType": "AssetFolder",
        "id": "1",
        "companyId": "1",
        "name": "Company images",
        "description": "Folder to save company logos",
        "createdDate": "2014-11-06T15:10:20.139+0000"
    },
    "status": {
        "succeeded":"true"
    }
});

var body = {
    "sfEntityType": "AssetFolder",
    "name": "Company images"
};
endpoint({ name: 'put', body: body }, '/1').reply(200, {
    "data": {
        "sfEntityType": "AssetFolder",
        "id": "1",
        "companyId": "1",
        "name": "Company images",
        "description": "Folder to save company logos",
        "createdDate": "2014-11-06T15:10:20.139+0000"
    },
    "status": {
        "succeeded": "true"
    }
});

endpoint({ name: 'get' }, '/1/assets').reply(200, {
    "data": [
        {
            "sfEntityType": "Asset",
            "id": "e8ba06a4-01ae-4628-a3ce-be2af8cb5d3f",
            "companyId": "1",
            "folderId": "1",
            "name": "Company logo",
            "description": "Company main logo for publishing",
            "text": "This is our new company logo",
            "startDate": "2014-11-06T15:10:20.139+0000",
            "endDate": "2014-11-10T15:10:20.139+0000",
            "services": ["FACEBOOK","TWITTER"],
            "intendedForPublishing": true,
            "intendedForModeration": true,
            "createdDate": "2014-11-06T15:10:20.139+0000",
            "originSystem": "Partner 1",
            "originId": "1",
            "contentLabels": ["company","logo"],
            "image": "https://spredfast-download.s3.amazonaws.com/development%2F1%2FIMAGE_ASSET%2F2014-11%2F4b9a1910-c34e-46ad-92f5-987358ecde04_AuocS8FE0go.original.jpg?Expires=1417444830&AWSAccessKeyId=AKIAI5AUS5KNJY7D7SQA&Signature=FE3Ac4jfcODPQg1LxJDFjudjswc%3D",
            "imageMedium": "https://spredfast-download.s3.amazonaws.com/development%2F1%2FIMAGE_ASSET%2F2014-11%2F4b9a1910-c34e-46ad-92f5-987358ecde04_AuocS8FE0go.medium.jpg?Expires=1417444830&AWSAccessKeyId=AKIAI5AUS5KNJY7D7SQA&Signature=Ck3do1u5gLUOqUj3y0DlHT0Yffs%3D",
            "imageThumb": "https://spredfast-download.s3.amazonaws.com/development%2F1%2FIMAGE_ASSET%2F2014-11%2F4b9a1910-c34e-46ad-92f5-987358ecde04_AuocS8FE0go.thumbnail.jpg?Expires=1417444830&AWSAccessKeyId=AKIAI5AUS5KNJY7D7SQA&Signature=RhTrftPOz%2F3kZQLPpFBBttHOVPA%3D"
        }
    ],
    "pagination": {
        "next": "pageSize=20&pageNumber=2",
        "totalItems": "55"
    },
    "status": {
       "succeeded": "true"
    }
});

endpoint({ name: 'get' }, '/1/assets').query(true).reply(200, {
    "data": [
        {
            "sfEntityType": "Asset",
            "id": "e8ba06a4-01ae-4628-a3ce-be2af8cb5d3f",
            "companyId": "1",
            "folderId": "1",
            "name": "Company logo",
            "description": "Company main logo for publishing",
            "text": "This is our new company logo",
            "startDate": "2014-11-06T15:10:20.139+0000",
            "endDate": "2014-11-10T15:10:20.139+0000",
            "services": ["FACEBOOK","TWITTER"],
            "intendedForPublishing": true,
            "intendedForModeration": true,
            "createdDate": "2014-11-06T15:10:20.139+0000",
            "originSystem": "Partner 1",
            "originId": "1",
            "contentLabels": ["company","logo"],
            "image": "https://spredfast-download.s3.amazonaws.com/development%2F1%2FIMAGE_ASSET%2F2014-11%2F4b9a1910-c34e-46ad-92f5-987358ecde04_AuocS8FE0go.original.jpg?Expires=1417444830&AWSAccessKeyId=AKIAI5AUS5KNJY7D7SQA&Signature=FE3Ac4jfcODPQg1LxJDFjudjswc%3D",
            "imageMedium": "https://spredfast-download.s3.amazonaws.com/development%2F1%2FIMAGE_ASSET%2F2014-11%2F4b9a1910-c34e-46ad-92f5-987358ecde04_AuocS8FE0go.medium.jpg?Expires=1417444830&AWSAccessKeyId=AKIAI5AUS5KNJY7D7SQA&Signature=Ck3do1u5gLUOqUj3y0DlHT0Yffs%3D",
            "imageThumb": "https://spredfast-download.s3.amazonaws.com/development%2F1%2FIMAGE_ASSET%2F2014-11%2F4b9a1910-c34e-46ad-92f5-987358ecde04_AuocS8FE0go.thumbnail.jpg?Expires=1417444830&AWSAccessKeyId=AKIAI5AUS5KNJY7D7SQA&Signature=RhTrftPOz%2F3kZQLPpFBBttHOVPA%3D"
        }
    ],
    "pagination": {
        "next": "pageSize=10&pageNumber=4",
        "previous": "pageSize=10&pageNumber=2",
        "totalItems": "55"
    },
    "status": {
       "succeeded": "true"
    }
});
