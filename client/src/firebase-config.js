// Firebase Modular SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app = null;
let db = null;

// Only initialize if the user has actually provided real keys
if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        console.log("[Firebase] Initialized successfully");
    } catch (e) {
        console.error("[Firebase] Initialization error:", e);
    }
} else {
    console.warn("[Firebase] Config missing! Running in offline fallback mode.");
}

export { app, db };
