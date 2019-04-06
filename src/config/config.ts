import { PushOptions } from '@ionic-native/push';

// change this options according to your aws account
// this values are randomly generated (excluding region) to let you know what they actually look like 
export var config = {
    region: 'eu-west-2',
    cognito: {
        UserPoolId: 'eu-west-2_Thst8dpEq',
        ClientId: '2rtmee5x1rto4rpnq9bblty1p5'
    },
    cognitoIdentity: {
        identityPoolId: 'eu-west-2:509a12h9-1562-9ao2-hj99-noo512y31k70',
    },
    s3: {
        bucketName: 'bucket-1523'
    },
    pushOptions: <PushOptions> {
        android: {
          senderID: '101262947850'
        }
    },
    pushRegisterId: '', // keep this empty
}