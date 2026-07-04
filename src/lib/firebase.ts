import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User as FirebaseUser,
  Auth
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId?: string;
  appId: string;
}

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseDb: Firestore | null = null;

// Check if credentials are valid
export function isValidFirebaseConfig(config: FirebaseConfig): boolean {
  return !!(config.apiKey && config.projectId && config.appId);
}

// Fetch config from Express server with retry support to handle cold starts and transient network errors
export async function fetchFirebaseConfig(): Promise<FirebaseConfig> {
  const maxRetries = 5;
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const res = await fetch("/api/firebase-config");
      if (!res.ok) {
        throw new Error(`Failed to fetch Firebase config from backend custom server, status: ${res.status}`);
      }
      return await res.json();
    } catch (error) {
      attempt++;
      console.warn(`Attempt ${attempt} to fetch Firebase config failed:`, error);
      if (attempt >= maxRetries) {
        console.error("Error fetching Firebase config (all attempts exhausted):", error);
        return {
          apiKey: "",
          authDomain: "",
          projectId: "",
          storageBucket: "",
          messagingSenderId: "",
          appId: "",
        };
      }
      // Wait before retrying (linear backoff: 600ms, 1200ms, 1800ms, 2400ms)
      await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
    }
  }
  return {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
  };
}

// Lazy initialize Firebase App, Auth, and Firestore
export function getFirebase(config: FirebaseConfig): { app: FirebaseApp; auth: Auth; db: Firestore } {
  if (!isValidFirebaseConfig(config)) {
    throw new Error("API_KEY, PROJECT_ID, and APP_ID must be fully configured to initialize Firebase.");
  }

  if (getApps().length > 0) {
    firebaseApp = getApp();
  } else {
    firebaseApp = initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
    });
  }

  if (!firebaseAuth) {
    firebaseAuth = getAuth(firebaseApp);
  }

  if (!firebaseDb) {
    firebaseDb = getFirestore(firebaseApp);
  }

  return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb };
}

// Helper to trigger popup-based Google Authentication
export async function loginWithGoogle(auth: Auth): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider();
  // Always use prompt=select_account to let users switch accounts smoothly
  provider.setCustomParameters({ prompt: "select_account" });
  
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (err: any) {
    console.error("Google login failed:", err);
    throw err;
  }
}

// Helper to log out
export async function logoutUser(auth: Auth): Promise<void> {
  try {
    await signOut(auth);
  } catch (err: any) {
    console.error("Sign out failed:", err);
    throw err;
  }
}
