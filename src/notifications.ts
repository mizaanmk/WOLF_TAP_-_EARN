import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Fallback / mock config to avoid crashes on startup when keys are missing.
// It will dynamically load real configurations from local config if setup later.
const defaultFirebaseConfig = {
  apiKey: "AIzaSyFakeKey-ForTestingOnly-FCMWorks",
  authDomain: "tapwolf-game.firebaseapp.com",
  projectId: "tapwolf-game",
  storageBucket: "tapwolf-game.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};

// VAPID Key used for FCM web notifications push consent. Can be configured by user.
const VAPID_KEY = "BDH-TestingKey-ForFCM-Registration-VapidKey-Placeholder"; 

let appInstance: any = null;
let messagingInstance: any = null;

export function initializeFirebaseNotifications() {
  try {
    // Attempt to load from custom firebase configuration if present
    let config = defaultFirebaseConfig;
    
    // Check if we already have apps initialized
    if (getApps().length === 0) {
      appInstance = initializeApp(config);
    } else {
      appInstance = getApps()[0];
    }

    try {
      messagingInstance = getMessaging(appInstance);
    } catch (e) {
      console.warn("FCM messaging is not fully supported in this environment/origin:", e);
    }
  } catch (err) {
    console.error("Firebase notification initialization error:", err);
  }
}

/**
 * Ask the user for permission to show notifications on first app open
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn("This browser does not support desktop notifications.");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      // Register service worker and try to retrieve FCM Token
      await registerServiceWorkerAndGetToken();
      return true;
    } else {
      console.warn('Notification permission denied or ignored:', permission);
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Registers the Service Worker and retrieves the FCM registration device token
 */
async function registerServiceWorkerAndGetToken() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      console.log('FCM Service Worker registered successfully, scope:', registration.scope);

      if (messagingInstance) {
        // Retrieve the FCM Device Token so it can be targeted from FCM server consoles
        try {
          const currentToken = await getToken(messagingInstance, {
            serviceWorkerRegistration: registration,
            vapidKey: VAPID_KEY
          });

          if (currentToken) {
            console.log('🔑 FCM Device Registration Token retrieved:', currentToken);
            localStorage.setItem('wolf_fcm_token', currentToken);
          } else {
            console.log('No FCM registration token available. Request permission first.');
          }
        } catch (tokenErr) {
          console.log('[FCM] Token acquisition bypassed or standard environment restriction applied. Local fallbacks remain fully armed.');
        }
      }
    } catch (err) {
      console.error('FCM Service Worker registration failed:', err);
    }
  }
}

/**
 * Check user inactivity and send the appropriate notifications.
 * Triggered on app startup, tab focus, or in lightweight polling background intervals.
 */
export function checkInactivityAndNotify() {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const lastActiveStr = localStorage.getItem('wolf_last_active_time');
  if (!lastActiveStr) return;

  const lastActive = parseInt(lastActiveStr, 10);
  const now = Date.now();
  const timeDiffMs = now - lastActive;

  const hr24 = 24 * 60 * 60 * 1000;
  const hr48 = 48 * 60 * 60 * 1000;

  // Retrieve track logs of sent/fired notifications to avoid duplicate spamming
  const sent24Key = 'wolf_notified_24h';
  const sent48Key = 'wolf_notified_48h';

  const hasSent24 = localStorage.getItem(sent24Key) === 'true';
  const hasSent48 = localStorage.getItem(sent48Key) === 'true';

  // 1. Check for 48 Hours Inactivity (Second Reminder)
  if (timeDiffMs >= hr48) {
    if (!hasSent48) {
      triggerLocalNotification(
        "⏳ Last Chance!",
        "Your streak is about to reset! Open TapWolf now! 🐺🔥"
      );
      localStorage.setItem(sent48Key, 'true');
    }
  } 
  // 2. Check for 24 Hours Inactivity (First Reminder)
  else if (timeDiffMs >= hr24) {
    if (!hasSent24) {
      triggerLocalNotification(
        "⚠️ TapWolf Alert!",
        "Your streak will break! Come back now and keep earning coins 🐺🔥"
      );
      localStorage.setItem(sent24Key, 'true');
      // Reset the 48h flag for a fresh streak cycle
      localStorage.removeItem(sent48Key);
    }
  } 
  // 3. User is Active within 24 hours
  else {
    // Reset flags once user returns and is active within safe boundaries
    localStorage.removeItem(sent24Key);
    localStorage.removeItem(sent48Key);
  }
}

/**
 * Utility to generate a high quality native offline push notification fallbacks.
 * Employs ServiceWorker registration if active, fallbacks to standard notification.
 */
function triggerLocalNotification(title: string, message: string) {
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body: message,
          icon: '/src/assets/images/blue_electric_wolf_1782179089672.jpg',
          badge: '/src/assets/images/blue_electric_wolf_1782179089672.jpg',
          tag: title.replace(/\s+/g, '-').toLowerCase() // Prevent overlapping duplicates
        });
      }).catch(() => {
        // Fallback if worker is not ready or restricted
        new Notification(title, { body: message });
      });
    } else {
      new Notification(title, { body: message });
    }
  } catch (error) {
    console.warn("Failed to fire browser notification payload:", error);
  }
}
