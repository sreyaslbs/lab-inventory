/**
 * Firebase Configuration
 * Replace the config values with your Firebase project credentials
 */

const firebaseConfig = {
    apiKey: "AIzaSyAFn8hmm5EfGWxH8kawmIVYyww-bMfC_nw",
    authDomain: "uc-lab-inventory.firebaseapp.com",
    databaseURL: "https://uc-lab-inventory-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "uc-lab-inventory",
    storageBucket: "uc-lab-inventory.firebasestorage.app",
    messagingSenderId: "412883513524",
    appId: "1:412883513524:web:1610477af8d3f2bf46a7e1"
};

// Initialize Firebase
let app, db, auth;

try {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    auth = firebase.auth();
    console.log("✅ Firebase initialized successfully");
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
    alert("Firebase configuration error. Please check firebase-config.js");
}
