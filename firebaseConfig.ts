import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: "claims-similarity-finder.firebaseapp.com",
  projectId: "claims-similarity-finder",
  storageBucket: "claims-similarity-finder.firebasestorage.app",
  messagingSenderId: "269345057327",
  appId: "1:269345057327:web:aaefe6ec5668aee9a434da"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);