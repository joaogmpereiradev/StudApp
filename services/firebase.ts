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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const app = firebase.app();
const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

provider.setCustomParameters({
    prompt: 'select_account'
});

// Habilitar persistência offline do Firestore
// Isso permite ler/escrever dados mesmo sem internet
// A sincronização acontece automaticamente quando a rede volta
db.enablePersistence({ synchronizeTabs: true })
    .then(() => {
        console.log("🔥 Firestore Persistence Enabled");
    })
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn("Persistence failed: Multiple tabs open.");
        } else if (err.code == 'unimplemented') {
            console.warn("Persistence not supported by browser.");
        }
    });

// Export Types
export type User = firebase.User;
export type DocumentSnapshot = firebase.firestore.DocumentSnapshot;
export type QuerySnapshot = firebase.firestore.QuerySnapshot;

// Export Instances
export { auth, db, provider };

// Auth Adapters
export const signInWithPopup = (authInstance: any, provider: any) => authInstance.signInWithPopup(provider);
export const signInWithEmailAndPassword = (authInstance: any, e: string, p: string) => authInstance.signInWithEmailAndPassword(e, p);
export const createUserWithEmailAndPassword = (authInstance: any, e: string, p: string) => authInstance.createUserWithEmailAndPassword(e, p);
export const sendPasswordResetEmail = (authInstance: any, e: string) => authInstance.sendPasswordResetEmail(e);
export const signOut = (authInstance: any) => authInstance.signOut();
export const onAuthStateChanged = (authInstance: any, next: (user: User | null) => void) => authInstance.onAuthStateChanged(next);

// Firestore Adapters
export const collection = (dbInstance: any, ...paths: string[]) => {
    return dbInstance.collection(paths.join('/'));
};

export const doc = (parent: any, ...paths: string[]) => {
    return parent.doc(paths.join('/'));
};

// Snapshot Options: includeMetadataChanges: true garante que recebemos eventos
// mesmo quando o dado vem do cache local
export const onSnapshot = (ref: any, next: any, error?: any) => {
    return ref.onSnapshot({ includeMetadataChanges: true }, next, error);
};

export const setDoc = (ref: any, data: any, options?: any) => ref.set(data, options);
export const deleteDoc = (ref: any) => ref.delete();