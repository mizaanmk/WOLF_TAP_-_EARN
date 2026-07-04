// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Default config - used as fallback if applet config is missing
const firebaseConfig = {
  apiKey: "AIzaSyFakeKey-ForTestingOnly-FCMWorks",
  authDomain: "tapwolf-game.firebaseapp.com",
  projectId: "tapwolf-game",
  storageBucket: "tapwolf-game.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Customize background notification handling
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message: ', payload);
    
    const notificationTitle = payload.notification?.title || payload.data?.title || '⚠️ TapWolf Alert!';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.message || 'Come back to keep earning coins 🐺🔥',
      icon: '/src/assets/images/blue_electric_wolf_1782179089672.jpg' || '/assets/images/blue_electric_wolf_1782179089672.jpg',
      badge: '/src/assets/images/blue_electric_wolf_1782179089672.jpg',
      data: payload.data || {}
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (error) {
  console.warn("FCM initial worker error, using safe mode:", error);
}

// Handle notification interaction
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Open the game when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
