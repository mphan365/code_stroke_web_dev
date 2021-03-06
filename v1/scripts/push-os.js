/* Push Notification Handler */

const DOM_Push = {};

const TEMP_Push = {}
TEMP_Push.button = ({ status }) => `Notifications &nbsp <img src="icons/button/switch-${status}.png" />`;

//iitialise push notification check on windows load
$( window ).bind("load", function() {
    DOM_Push.button = $("#js-push-button");

//if push notifications are supported initialise UI
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        console.log('Service Worker and Push is supported')

        initializeUI();

    } else {
        disableBtn("Error: Push Messaging not supported in your current browser");
        console.warn('Push messaging is not supported');
    }

});

function initializeUI() {

    OneSignal.push(function() {
        OneSignal.sendTags({
            role: API.login.signoff.signoff_role,
        }).then(function(tagsSent) {
            console.log('tag sent');
        });
    });


    DOM_Push.button.removeClass("disabled");

    DOM_Push.button.click(function() {
        DOM_Push.button.html(TEMP_Push.button({status: "wait"}))
        getSubscriptionState().then(function(state) {

//if already subscribed mute Notifications
          if (state.isPushEnabled) {
              OneSignal.push(function() {
                  OneSignal.setSubscription(false);
              });

              DOM_Push.button.html(TEMP_Push.button({status: "off"}))
              console.log('User is no longer subscribed');
          } else {

//if notifications currently muted, reactivate Notifications
              if (state.isOptedOut) {
                  OneSignal.push(function() {
                      OneSignal.setSubscription(true);
                  });
                  DOM_Push.button.html(TEMP_Push.button({status: "on"}));
                  console.log('User is now subscribed');
              } else {

//if neither muted nor enabled, service worker may not have been registered, so register service Worker
                  OneSignal.push(function() {
                    OneSignal.registerForPushNotifications();
                    OneSignal.setSubscription(true);
                  });
                  DOM_Push.button.html(TEMP_Push.button({status: "on"}));
                  console.log('User has been registered for push notifications');
              }
          }
      });

      event.preventDefault();
    })

    updateBtn();
    notiflisten();
    notifdismiss();

}


//Event Listener for notification click
function notiflisten(){
    OneSignal.push(["addListenerForNotificationOpened", function(data) {
      console.log("Received Notification");
      API.putacknowledge(data.data);
      notiflisten();
    }]);
}

//Event if notification is dismissed
function notifdismiss(){
    try{
        OneSignal.on('notificationDismiss', function (event) {
        	console.warn('OneSignal notification dismissed:', event);
            API.putacknowledge(data.data)
         });
    }
    catch{
        console.log("notifdismiss error")        
    }
}



//use OneSignal API to check if service worker is Subscribed
function getSubscriptionState() {
    return Promise.all([
      OneSignal.isPushNotificationsEnabled(),
      OneSignal.isOptedOut()
    ]).then(function(result) {
        var isPushEnabled = result[0];
        var isOptedOut = result[1];

        return {
            isPushEnabled: isPushEnabled,
            isOptedOut: isOptedOut
        };
    });
}


function updateBtn() {
  getSubscriptionState().then(function(state) {
      if (state.isPushEnabled) {
          DOM_Push.button.html(TEMP_Push.button({status: "on"}))
          console.log('User is currently subscribed');
      } else {
          if (state.isOptedOut) {
              DOM_Push.button.html(TEMP_Push.button({status: "off"}))
              console.log('User is not currently subscribed');
          } else {
                OneSignal.push(function() {
                    OneSignal.registerForPushNotifications();
                    OneSignal.setSubscription(true);
                });
                console.log('user has been subscribed')
              }
          }

  });

}

function disableBtn(message) {
    DOM_Push.button.html(TEMP_Push.button({status: "disabled"}));
    DOM_Push.button.addClass("disabled");

    DOM_Push.button.prop("title", message);

    DOM_Push.button.off();
}
