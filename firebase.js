// Firebase SDK imports (using CDN modules via import map in index.html)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDeN0v3nT5SmMeM0SS24kpTjQ9Jv6RiYOM",
    authDomain: "taskify-b2058.firebaseapp.com",
    projectId: "taskify-b2058",
    storageBucket: "taskify-b2058.firebasestorage.app",
    messagingSenderId: "817435652149",
    appId: "1:817435652149:web:9ccd225e87c0e67399017c",
    measurementId: "G-CBP9EF6EKJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firestore
export const db = getFirestore(app);
