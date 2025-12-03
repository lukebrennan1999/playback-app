import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDplncGoDxqyYLaMTT_6OgVDY7Ef1ZxMas", 
  authDomain: "playback-app-520ee.firebaseapp.com",
  projectId: "playback-app-520ee",
  storageBucket: "playback-app-520ee.firebasestorage.app",
  messagingSenderId: "500338792466",
  appId: "1:500338792466:web:ceb7ffdb7a0c5cda3da0cb"
};

// Initialize variables
let app;
let db;
let storage;
let auth;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
} catch (error) {
    console.error("CRITICAL: Firebase failed to initialize", error);
}

export { db, storage, auth };
export default app;