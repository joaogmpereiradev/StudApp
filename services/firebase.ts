import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

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
// Use namespaced syntax which is compatible with v8 and v9 compat
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const app = firebase.app();
const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

// Force account selection to avoid auto-login loops or stuck states
provider.setCustomParameters({
    prompt: 'select_account'
});

// Enable offline persistence with synchronizeTabs to improve reliability
try { 
    db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
        // Fail silently if not supported (e.g. privacy mode)
        console.log("Persistence disabled/failed:", err);
    }); 
} catch (e) { 
    console.log("Persistence not available in this environment"); 
}

// Export Types
export type User = firebase.User;
export type DocumentSnapshot = firebase.firestore.DocumentSnapshot;
export type QuerySnapshot = firebase.firestore.QuerySnapshot;

// Export Instances
export { auth, db, provider };

// Auth Adapters - Mantém a compatibilidade com o resto do app que usa sintaxe v9
export const signInWithPopup = (authInstance: any, provider: any) => authInstance.signInWithPopup(provider);
export const signInWithEmailAndPassword = (authInstance: any, e: string, p: string) => authInstance.signInWithEmailAndPassword(e, p);
export const createUserWithEmailAndPassword = (authInstance: any, e: string, p: string) => authInstance.createUserWithEmailAndPassword(e, p);
export const sendPasswordResetEmail = (authInstance: any, e: string) => authInstance.sendPasswordResetEmail(e);
export const signOut = (authInstance: any) => authInstance.signOut();
export const onAuthStateChanged = (authInstance: any, next: (user: User | null) => void) => authInstance.onAuthStateChanged(next);

// Firestore Adapters - Mantém a compatibilidade com o resto do app que usa sintaxe v9
export const collection = (dbInstance: any, ...paths: string[]) => {
    // Adapter: v9 collection(db, 'path') -> v8 db.collection('path')
    return dbInstance.collection(paths.join('/'));
};

export const doc = (parent: any, ...paths: string[]) => {
    // Adapter: v9 doc(db, 'path') -> v8 db.doc('path')
    // Adapter: v9 doc(coll, 'id') -> v8 coll.doc('id')
    return parent.doc(paths.join('/'));
};

export const onSnapshot = (ref: any, next: any, error?: any) => ref.onSnapshot(next, error);
export const setDoc = (ref: any, data: any, options?: any) => ref.set(data, options);
export const deleteDoc = (ref: any) => ref.delete();