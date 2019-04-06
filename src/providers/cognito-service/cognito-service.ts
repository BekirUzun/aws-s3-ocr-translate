import { Injectable } from "@angular/core";
import * as AWSCognito from "amazon-cognito-identity-js";
import { config } from "../../config/config"

@Injectable()
export class CognitoServiceProvider {
  userPool = new AWSCognito.CognitoUserPool(config.cognito);

  signUp(email, password) {
    return new Promise((resolved, reject) => {
      let userAttribute = [];
      userAttribute.push(
        new AWSCognito.CognitoUserAttribute({ Name: "email", Value: email })
      );

      this.userPool.signUp(email, password, userAttribute, null, function(
        err,
        result
      ) {
        if (err) {
          reject(err);
        } else {
          resolved(result);
        }
      });
    });
  }

  confirmUser(verificationCode, userName) {
    return new Promise((resolved, reject) => {
      const cognitoUser = new AWSCognito.CognitoUser({
        Username: userName,
        Pool: this.userPool
      });

      cognitoUser.confirmRegistration(verificationCode, true, function(
        err,
        result
      ) {
        if (err) {
          reject(err);
        } else {
          resolved(result);
        }
      });
    });
  }

  authenticate(email, password) {
    return new Promise((resolved, reject) => {
      const authDetails = new AWSCognito.AuthenticationDetails({
        Username: email,
        Password: password
      });

      const cognitoUser = new AWSCognito.CognitoUser({
        Username: email,
        Pool: this.userPool
      });

      cognitoUser.authenticateUser(authDetails, {
        onSuccess: result => {
          resolved(result.getAccessToken().getJwtToken());
        },
        onFailure: err => {
          reject(err);
        },
        newPasswordRequired: userAttributes => {
          // User was signed up by an admin and must provide new
          // password and required attributes, if any, to complete
          // authentication.

          // the api doesn't accept this field back
          userAttributes.email = email;
          delete userAttributes.email_verified;

          cognitoUser.completeNewPasswordChallenge(password, userAttributes, {
            onSuccess: function(result) {},
            onFailure: function(error) {
              reject(error);
            }
          });
        }
      });
    });
  }

  getLoggedUser() {
    return new Promise((resolved, reject) => {
      var cognitoUser = this.userPool.getCurrentUser();

      if (cognitoUser != null) {
        cognitoUser.getSession(function(err, result) {
          if (result) {
            resolved(result.getIdToken().getJwtToken());
          } else {
            reject(err);
          }
        });
      }
    });
  }
}
