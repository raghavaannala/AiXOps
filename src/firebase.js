import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyB4qlOrr88XUE9vSQ1jYY1ZzAEBjjkjyaU",
    authDomain: "smartagrox-c8990.firebaseapp.com",
    projectId: "smartagrox-c8990",
    storageBucket: "smartagrox-c8990.firebasestorage.app",
    messagingSenderId: "1040204518562",
    appId: "1:1040204518562:web:4660e0cba69a6d04a0f3fb",
    measurementId: "G-LTNHC1QHP6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Request additional scopes for Gmail and GitHub
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.modify');
