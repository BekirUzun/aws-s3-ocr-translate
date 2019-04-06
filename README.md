## Introduction
AWeSome Translate is simple translation app that translates text from photos. This project is simple demonstration of some AWS services. It's developed with Ionic 3 and AWS Nodejs SDK. This repo is a fork of [shamique/s3-image-upload-in-ionic]. It uses below services:

  - [Firebase Cloud Messaging (FCM)][fcm] and [Amazon SNS][sns] for push notifications
  - [S3] for image storage
  - [DynamoDB] for image metadata and translations
  - [Lambda] for connecting all these services
  - [Rekognition] for reading text from image (OCR)
  - [Translate] for translations
  - [IAM] for access management
  - [Cognito] for user management*

**User management is not actually required for a translate app but it is used for demonstration purposes.*

Refer [this][s3-upload-article] article for uploading image to S3 part of project.

## Prerequisites
  - NodeJS
  - Ionic 3 intalled
  - Configured Firebase Cloud Messaging app 
  - **Below AWS services created and configured:**
    + Cognito Identity Pool
    + Cognito User Pool
    + IAM (give access to roles)
    + S3 bucket
    + DynamoDB table
    + Lambda function with required permissions

## How to run?
  - Clone the project to your local machine
  - Add ``google-services.json`` that contains your FCM settings (can be downloaded from [Google Cloud Console](https://console.firebase.google.com/u/0/) > Project > Project Settings
  - Change Android package name in [config.xml](config.xml) with your own package name that is written in google-services.json
  - Change AWS settings in [config.ts](src/shared/config.ts) file with your own AWS settings
  - Create AWS Lambda function with the content of [lambda-function.js](lambda-function.js) and give required permissions to associated role via IAM console
  - **In terminal, run below commands:**
    + ``npm install``
    + ``ionic cordova run android --debug --livereload``

## App Logic Explanation
  - User logins to the app
  - User takes a photo that contains text to translate
  - User uploads photo to S3 and push notification device ID to DynamoDB
  - Lambda function gets triggered when an image added to S3 bucket
  - Lambda function gets uploaded image key
  - Lambda function creates endpoint for notification
  - Lambda function retrieves text from image with Rekognition service
  - Lambda function translates text with Translate service
  - Lambda function stores original and translated text in DynamoDB
  - Lambda function sends a push notification via SNS that contains original and translated text data
  
[fcm]:https://firebase.google.com/products/cloud-messaging/
[sns]:https://aws.amazon.com/sns/
[s3]:https://aws.amazon.com/s3/
[dynamodb]:https://aws.amazon.com/dynamodb/
[lambda]:https://aws.amazon.com/lambda/
[rekognition]:https://aws.amazon.com/rekognition/
[translate]:https://aws.amazon.com/translate/
[iam]:https://aws.amazon.com/iam/
[cognito]:https://aws.amazon.com/cognito/
[shamique/s3-image-upload-in-ionic]:https://github.com/shamique/s3-image-upload-in-ionic
[s3-upload-article]:https://medium.com/@shamique/upload-an-image-to-s3-bucket-in-ionic-app-5dc96b772d48
