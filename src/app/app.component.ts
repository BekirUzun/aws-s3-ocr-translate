import { Component } from '@angular/core';
import { Platform, AlertController} from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Push, PushObject } from '@ionic-native/push';
import { LoginPage } from '../pages/login/login';
import { config } from '../shared/config';
import { state } from "../shared/translation-state"

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage:any = LoginPage;

  constructor(platform: Platform,
    splashScreen: SplashScreen,
    private statusBar: StatusBar,
    public push: Push,
    public alertCtrl: AlertController,
  ) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      
      this.statusBar.backgroundColorByHexString('#3171e0');
      this.statusBar.styleLightContent();
      this.initPushNotification();
      splashScreen.hide();
    });
  }

  initPushNotification() {

    const pushObject: PushObject = this.push.init(config.pushOptions);

    pushObject.on('registration').subscribe((data: any) => {
      console.log('device token:', data.registrationId);

      config.pushRegisterId = data.registrationId;

      // const alert = this.alertCtrl.create({
      //   title: 'device token',
      //   message: data.registrationId,
      //   buttons: ['OK']
      // });
      // alert.present();
    });

    pushObject.on('notification').subscribe( async (data: any) => {
      console.log('recieved notification data: ', JSON.stringify( data));
      let d = data.additionalData;

      console.log(this.rootPage);
      console.log(LoginPage);
      if (!d.foreground && state.progressPercent < 20) {
        // const alert = await this.alertCtrl.create({
        //   title: 'clicked on',
        //   message: 'you clicked on the notification!',
        //   buttons: ['OK']
        // });
        // alert.present();

        //coming from notification click directly show translation
        this.showTranslation(d.imageKey, d.imageDate, d.originalText, d.translatedText);
      }

      state.originalText = d.originalText;
      state.translatedText = d.translatedText;
      state.progressPercent = 100;
      state.progressMessage = "Translation complete.";
    });

    pushObject.on('error').subscribe(error => console.error('Error with Push plugin', error));
  }

  showTranslation(imageKey, imageDate, originalText, translatedText) { 
    console.log("showTranslation() called", imageKey, imageDate, originalText, translatedText);
    
    let alert = this.alertCtrl.create({
      title: "Translation",
      message: "Original text: " + originalText + " - Translation: " + translatedText,
      buttons: ['Ok']
    });

    alert.present();
  }

}

