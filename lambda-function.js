var AWS = require('aws-sdk');
var db = new AWS.DynamoDB();
var sns = new AWS.SNS({ apiVersion: '2010-03-31' });
var rekognition = new AWS.Rekognition();
var translate = new AWS.Translate();

// change this options according to your aws account
// this values are randomly generated to let you know what they actually look like 
var config = {
    dynamodb: {
        tableName: "awsdemo",
        primaryKeyColumn: "photo_s3_key",
    },
    s3: {
        bucket: "bucket-1523"
    },
    translate: {
        sourceLang: "en",
        targetLang: "tr"
    },
    sns: {
        platformApplicationArn: "arn:aws:sns:eu-west-2:548134803581:app/GCM/awsdemo"
    }
};

exports.handler = async(event, context) => {
    console.log("Request received:\n", JSON.stringify(event));
    console.log("Context received:\n", JSON.stringify(context));

    var key;

    if (event.Records) {
        //const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
        key = event.Records[0].s3.object.key.toString();
    } else {
        console.log("Could not find any s3 objects.");
        return;
    }

    console.log("processing: " + key);

    try {
        var deviceId = await getDeviceId(key);
        console.log("success getDeviceId :", deviceId);

        var endpointArn = await createNotificationEndpoint(deviceId);
        console.log("Endpoint created.", endpointArn);


        var originalText = await getTextFromImage(key);
        console.log("OCR completed.", originalText);

        var translatedText = await getTranslation(originalText)
        console.log("Translate succesfull.", translatedText);

        await updateItem(key, originalText, "null-translated")
        console.log("Dynamodb update succesfull.");

        await publishNotification(key, endpointArn, originalText, translatedText)
        console.log("Notification sent.");
        return resp("Lambda function ran succesfully.", 200);
    }
    catch (err) {
        console.log("Error on lambda function: ", err);
        return resp("Error on lambda function.", 500);
    }
}

function getTranslation(originalText) {
    return new Promise((resolve, reject) => {
        var params = {
            SourceLanguageCode: config.translate.sourceLang,
            TargetLanguageCode: config.translate.targetLang,
            Text: originalText,
        };
        translate.translateText(params, function(err, data) {
            if (err) {
                var error = {
                    message: "An error occurred on translation.",
                    response: err
                };
                console.log("error on translate:", err);
                reject(error);
            } // an error occurred
            else {
                console.log(data);
                resolve(data.TranslatedText);
            }
        });
    });

}

function getTextFromImage(key) {
    return new Promise((resolve, reject) => {
        var imgParams = {
            Image: { /* required */
                S3Object: {
                    Bucket: config.s3.bucket,
                    Name: key,
                }
            }
        };
        rekognition.detectText(imgParams, function(err, data) {
            if (err) {
                console.log("error on rekognition:", err);
                reject(err);
            } 
            else {
                var originalText = "null-original";
                if (data.TextDetections && data.TextDetections.length > 0) {
                    originalText = "";
                    data.TextDetections.forEach((item) => {
                        if (item.Type == 'LINE' && item.Confidence > 80) {
                            originalText += item.DetectedText + " ";
                        }
                    });
                }
                resolve(originalText);
            }
        });
    });
}

function resp(message, statusCode) {
    var response = {};

    response.body = JSON.stringify(message);
    response.statusCode = statusCode;

    console.log("response: " + JSON.stringify(response))
    return response;
}

function getDeviceId(key) {
    return new Promise((resolve, reject) => {
        var params = {
            TableName: config.dynamodb.tableName, 
            Key: {
                [config.dynamodb.primaryKeyColumn]: { S: key }
            },
            ProjectionExpression: 'deviceId'
        };

        // Call DynamoDB to read the item from the table
        db.getItem(params, function(err, data) {
            if (err) {
                console.log("Error", err);
                reject(err)
            }
            else if (!data.Item || !data.Item.deviceId || !data.Item.deviceId.S) {
                console.log("Couldn't get device id from data", data);
                reject(data);
            }
            else {
                resolve(data.Item.deviceId.S);
                //console.log("Success", data.Item);
            }
        });
    });
}

function updateItem(key, originalText, translatedText) {
    return new Promise((resolve, reject) => {
        var updateParams = {
            ExpressionAttributeNames: {
                "#OT": "original_text",
                "#T": "translation"
            },
            ExpressionAttributeValues: {
                ":t": {
                    S: translatedText
                },
                ":ot": {
                    S: originalText
                }
            },
            Key: {
                [config.dynamodb.primaryKeyColumn]: {
                    S: key
                }
            },
            TableName: "awsdemo",
            UpdateExpression: "SET #OT = :ot, #T = :t"
        };

        db.updateItem(updateParams, (err, data) => {
            if (err) {
                console.log(err, err.stack);
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}

function createNotificationEndpoint(deviceToken) {
    return new Promise((resolve, reject) => {
        var platformParams = {
            PlatformApplicationArn: config.sns.platformApplicationArn,
            Token: deviceToken,

        };
        sns.createPlatformEndpoint(platformParams, function(err, data) {
            if (err) {
                console.log(err, err.stack);
                reject(err);
            }
            else {
                if (data.ResponseMetadata.EndpointArn) //newly created endpoint
                    resolve(data.ResponseMetadata.EndpointArn);
                else //endpoint already exists
                    resolve(data.EndpointArn);
            }
        });
    });
}

function publishNotification(key, endpointArn, originalText, translatedText) {
    return new Promise((resolve, reject) => {
        var payload = {
            "default": "Translation completed. Click here to see translation.",
            "GCM": JSON.stringify({
                "data": {
                    "title": "Process Complete",
                    "message": "Translation completed. Click here to see translation.",
                    "body": "Translation completed. Click here to see translation.",
                    "imageKey": key,
                    "imageDate": "2019-03-25 12:40:28",
                    "originalText": originalText,
                    "translatedText": translatedText
                }
            })
        }

        var snsParams = {
            Message: JSON.stringify(payload),
            TargetArn: endpointArn,
            MessageStructure: 'json'
        };
        // add some timeout for notification
        // WARNING: this isn't any meaningful in a production application. it's for demo purposes only
        setTimeout(function() {
            sns.publish(snsParams, function(err, data) {
                if (err) {
                    console.log("Sns publish failed", err);
                    reject(err);
                }
                else {
                    resolve(data);
                }
            });
        }, 5000); 
    });
}