import { Component, ViewChild } from "@angular/core";
import {
  NavController,
  NavParams,
  Platform,
  LoadingController,
  AlertController
} from "ionic-angular";
import { CognitoServiceProvider } from "../../providers/cognito-service/cognito-service";
import { Camera, CameraOptions } from "@ionic-native/camera";
import { AngularCropperjsComponent } from 'angular-cropperjs';
import { S3ServiceProvider } from "../../providers/s3-service/s3-service";
import { DynamodbServiceProvider } from "../../providers/dynamodb-service/dynamodb-service";
import { config } from "../../shared/config";
import { state } from "../../shared/translation-state"


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
  public progressPercent = 0;
  public progressMsg = "";
  public state;
  cropperOptions: any;

  @ViewChild('angularCropper') public angularCropper: AngularCropperjsComponent;
  
  constructor(
    public navCtrl: NavController, public navParams: NavParams, public cognitoService: CognitoServiceProvider,
      public platform: Platform, private camera: Camera, public s3Service: S3ServiceProvider, private loader: AlertController,
      private dynamoService: DynamodbServiceProvider
  ) { 
    this.state = state;
    this.cropperOptions = {
      dragMode: 'move',
      viewMode: 1,
      movable: true,
      zoomable: true,
      scalable: true,
      
    };
  }

  openCamera() {
    // this.setProgress(56, 'Getting translation token.');
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
          console.log();
          
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
    // let loading = this.loader.create({
    //   title: 'Wait',
    //   subTitle: 'Uploading photo. Please wait...'
    // });
    // loading.present();
    

    let croppedView: string = this.angularCropper.cropper.getCroppedCanvas().toDataURL('image/jpeg', (100 / 100));
    let croppedData = croppedView.substr(croppedView.indexOf("base64,") + 7);

    this.setProgress(5, 'Getting translation token.');

    this.cognitoService.getLoggedUser().then(userToken => {

      this.setProgress(10, 'Storing photo metadata.');
      this.dynamoService.insert(userToken, this.imageName + ".jpg", config.pushRegisterId, this.imageDate).then( data => {

        this.setProgress(25, 'Uploading photo.');
        this.s3Service.upload(croppedData, this.imageName + ".jpg", userToken).then(
          res => {
            // loading.dismiss();
            // this.imageName = "";
            // this.imageData = "";
            this.setProgress(50, 'Processing photo. You will recieve a notification when its complete.');
            // alert("Photo uploaded. You will recieve a notification when translation proccess is complete.");
          },
          err => {
            // loading.dismiss();
            alert("An error occurred when uploading photo.");
            console.log(err);
          }
        );
      }, err => {
        // loading.dismiss();
        alert("An error occurred when saving photo information.");
      });

    })
    .catch(err => {
      // loading.dismiss();
      console.log(err);
    });
  }

  setProgress(percent, message) {
    state.progressPercent = percent;
    state.progressMessage = message;
  }

  rotate() {
    this.angularCropper.cropper.rotate(90);
  }
 
  zoom(zoomIn: boolean) {
    let factor = zoomIn ? 0.1 : -0.1;
    this.angularCropper.cropper.zoom(factor);
  }
  
  cropperTouchStart(event){
    event.stopPropagation();
    event.preventDefault(); //Most important
  }
}
