import { Component } from "@angular/core";
import {
  NavController,
  NavParams,
  Platform,
  LoadingController,
  AlertController
} from "ionic-angular";
import { CognitoServiceProvider } from "../../providers/cognito-service/cognito-service";
import { Camera, CameraOptions } from "@ionic-native/camera";
import { S3ServiceProvider } from "../../providers/s3-service/s3-service";
import { DynamodbServiceProvider } from "../../providers/dynamodb-service/dynamodb-service";
import { config } from "../../config/config";


@Component({
  selector: "page-image-upload",
  templateUrl: "image-upload.html"
})
export class ImageUploadPage {
  public imageData: string;
  public imageView: string;
  public imageId: number;
  public imageName: string;
  public imageDate: string;

  constructor(
    public navCtrl: NavController, public navParams: NavParams, public cognitoService: CognitoServiceProvider,
      public platform: Platform, private camera: Camera, public s3Service: S3ServiceProvider, private loader: AlertController,
      private dynamoService: DynamodbServiceProvider 
  ) {}

  openCamera() {
    this.platform.ready().then(readySource => {
      const options: CameraOptions = {
        quality: 90,
        destinationType: this.camera.DestinationType.DATA_URL,
        encodingType: this.camera.EncodingType.JPEG,
        mediaType: this.camera.MediaType.PICTURE,
        targetHeight: 1920,
        targetWidth: 1920,
        correctOrientation: true
      };

      this.camera.getPicture(options).then(
        imageData => {
          this.imageView = "data:image/jpeg;base64," + imageData;
          this.imageData = imageData;
          let d = new Date();
          this.imageDate = d.toJSON().replace('T', ' ').replace(/\..+/, '');
          this.imageName = d.getTime().toString();
          this.imageId = d.getTime();
        },
        err => {
          alert("An error occurred on camera. ");
          console.log("Error on camera", err);
        }
      );
    });
  }

  uploadPhoto() {
    let loading = this.loader.create({
      title: 'Wait',
      subTitle: 'Uploading photo. Please wait...'
    });
    loading.present();

    this.cognitoService.getLoggedUser().then(userToken => {
      this.dynamoService.insert(userToken, this.imageName + ".jpg", config.pushRegisterId, this.imageDate).then( data => {

        this.s3Service.upload(this.imageData, this.imageName + ".jpg", userToken).then(
          res => {
            loading.dismiss();
            // this.imageName = "";
            // this.imageData = "";
            alert("Photo uploaded. You will recieve a notification when translation proccess is complete.");
          },
          err => {
            loading.dismiss();
            alert("An error occurred when uploading photo.");
            console.log(err);
          }
        );
      }, err => {
        loading.dismiss();
        alert("An error occurred when saving photo information.");
      });

    })
    .catch(err => {
      loading.dismiss();
      console.log(err);
    });
  }
}
