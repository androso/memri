import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getStorage, Storage } from 'firebase-admin/storage';
import path from 'path';

let app: App;
let storage: Storage;

export function initializeFirebase() {
  // Check if Firebase is already initialized
  if (getApps().length === 0) {
    try {
      // Initialize Firebase Admin SDK with service account key
      // The service account key file should be placed in the server directory
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || 
                                path.join(process.cwd(), 'server', 'firebase-service-account-key.json');
      
      console.log('Initializing Firebase with service account key...');
      
      app = initializeApp({
        credential: cert(serviceAccountPath),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
      });
      
      console.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase Admin SDK:', error);
      throw new Error('Failed to initialize Firebase Admin SDK. Make sure the service account key file exists and is valid.');
    }
  } else {
    app = getApps()[0];
  }

  storage = getStorage(app);
  return { app, storage };
}

export function getFirebaseStorage(): Storage {
  if (!storage) {
    const { storage: firebaseStorage } = initializeFirebase();
    return firebaseStorage;
  }
  return storage;
} 