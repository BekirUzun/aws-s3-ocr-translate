import { Injectable } from '@angular/core';
import * as aws from "aws-sdk";
import { config } from "../../config/config";


@Injectable()
export class DynamodbServiceProvider {

  constructor() {
    console.log('Hello DynamodbServiceProvider Provider');
  }

  insert(accessToken, key: string, pushRegisterId: string, time: string){
    return new Promise( async (resolve, reject) => {
      aws.config.region = config.region;
      let loginUrl = "cognito-idp." + config.region +".amazonaws.com/" + config.cognito.UserPoolId;
      aws.config.credentials = new aws.CognitoIdentityCredentials({
        IdentityPoolId: config.cognitoIdentity.identityPoolId,
        Logins: {
          [loginUrl]: accessToken
        },
      });

      var db = new aws.DynamoDB();

      var item = {
        "TableName": "awsdemo",
        "Item": {
          "photo_s3_key": {
            "S": key
          },
          "time": {
            "S": time
          },
          "deviceId": {
            "S": pushRegisterId
          }
        }
      };

      console.log(item.Item);

      await db.putItem(item, function(err, data) {
        if (err) {
          reject(err);
          console.log('ERROR: Dynamo failed: ', err);
        }
        else {
          resolve(data);
          console.log('Dynamo Success: ', data);
        }
    });


    });
  }

}
