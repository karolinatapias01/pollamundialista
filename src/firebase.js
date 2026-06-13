import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDgNsfJ8Sfqv2C6oW5KrZaZRQBi_Tq1oYs",
  authDomain: "pollamundialista-9b216.firebaseapp.com",
  projectId: "pollamundialista-9b216",
  storageBucket: "pollamundialista-9b216.firebasestorage.app",
  messagingSenderId: "192789680554",
  appId: "1:192789680554:web:e7e5a6a05c175bd0961bd3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);