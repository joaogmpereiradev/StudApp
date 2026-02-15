import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail,
    onAuthStateChanged, 
    signOut,
    User
} from "firebase/auth";
import { 
    getFirestore, 
    collection, 
    doc, 
    onSnapshot, 
    setDoc, 
    deleteDoc, 
    enableIndexedDbPersistence 
} from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDePhtSOpebsAze9HoGmW61yylX7Mk1Vyg",
    authDomain: "estudosapp.firebaseapp.com",
    projectId: "estudosapp",
    storageBucket: "estudosapp.firebasestorage.app",
    messagingSenderId: "894303176020",
    appId: "1:894303176020:web:8e56cd9c789c459d2034c1",
    measurementId: "G-5QXRGT6ZK5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Enable offline persistence
try { 
    enableIndexedDbPersistence(db).catch(() => {
        // Fail silently if not supported
    }); 
} catch (e) { 
    console.error(e); 
}

export { 
    auth, 
    db, 
    provider, 
    collection, 
    doc, 
    onSnapshot, 
    setDoc, 
    deleteDoc, 
    signInWithPopup, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    sendPasswordResetEmail, 
    onAuthStateChanged, 
    signOut,
    type User
};