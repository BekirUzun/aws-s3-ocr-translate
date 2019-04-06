import { Injectable } from "@angular/core";
import * as aws from "aws-sdk";
import { config } from "../../shared/config";

@Injectable()
export class S3ServiceProvider {

  upload(image, imageName, accessToken) {
    return new Promise((resolve, reject) => {
      aws.config.region = config.region;
      let loginUrl = "cognito-idp." + config.region +".amazonaws.com/" + config.cognito.UserPoolId;
      aws.config.credentials = new aws.CognitoIdentityCredentials({
        IdentityPoolId: config.cognitoIdentity.identityPoolId,
        Logins: {
          [loginUrl]: accessToken
        }
      });

      var s3 = new aws.S3({
        apiVersion: "2006-03-01",
        params: { Bucket: config.s3.bucketName }
      });

      let buf = new Buffer(image, "base64");

      var data = {
        Bucket: config.s3.bucketName,
        Key: imageName,
        Body: buf,
        ContentEncoding: "base64",
        ContentType: "image/jpeg"
      };

      s3.putObject(data, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }
}
