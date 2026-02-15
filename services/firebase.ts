import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDePhtSOpebsAze9HoGmW61yylX7Mk1Vyg",
    authDomain: "estudosapp.firebaseapp.com",
    projectId: "estudosapp",
    storageBucket: "estudosapp.firebasestorage.app",
    messagingSenderId: "894303176020",
    appId: "1:894303176020:web:8e56cd9c789c459d2034c1",
    measurementId: "G-5QXRGT6ZK5"
};

// Initialize Firebase
// Check if already initialized to avoid "Firebase App named '[DEFAULT]' already exists" error
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

// Enable offline persistence
try { 
    db.enablePersistence().catch((err) => {
        // Fail silently if not supported or already enabled
        console.error("Persistence failed:", err);
    }); 
} catch (e) { 
    console.error(e); 
}

// Export Types
export type User = firebase.User;

// Auth Adapters
export const signInWithPopup = (authInstance: firebase.auth.Auth, provider: firebase.auth.AuthProvider) => authInstance.signInWithPopup(provider);
export const signInWithEmailAndPassword = (authInstance: firebase.auth.Auth, e: string, p: string) => authInstance.signInWithEmailAndPassword(e, p);
export const createUserWithEmailAndPassword = (authInstance: firebase.auth.Auth, e: string, p: string) => authInstance.createUserWithEmailAndPassword(e, p);
export const sendPasswordResetEmail = (authInstance: firebase.auth.Auth, e: string) => authInstance.sendPasswordResetEmail(e);
export const signOut = (authInstance: firebase.auth.Auth) => authInstance.signOut();
export const onAuthStateChanged = (authInstance: firebase.auth.Auth, next: (user: firebase.User | null) => void) => authInstance.onAuthStateChanged(next);

// Firestore Adapters
export const collection = (dbInstance: firebase.firestore.Firestore, ...paths: string[]) => dbInstance.collection(paths.join('/'));

export const doc = (parent: firebase.firestore.Firestore | firebase.firestore.CollectionReference, ...paths: string[]) => {
    // If it's a Firestore instance or CollectionReference, it has .doc()
    // We join paths because v9 doc() allows multiple segments
    return (parent as any).doc(paths.join('/'));
};

export const onSnapshot = (ref: any, next: any) => ref.onSnapshot(next);
export const setDoc = (ref: any, data: any, options?: any) => ref.set(data, options);
export const deleteDoc = (ref: any) => ref.delete();

export { 
    auth, 
    db, 
    provider 
};