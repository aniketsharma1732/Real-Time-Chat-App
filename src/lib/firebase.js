import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "reactchat-c36fb.firebaseapp.com",
  projectId: "reactchat-c36fb",
  storageBucket: "reactchat-c36fb.appspot.com",  // ✅ fix typo here too
  messagingSenderId: "797681833049",
  appId: "1:797681833049:web:699d7e675cf8ac2149cd48"
};

const app = initializeApp(firebaseConfig);

// ✅ Always pass the app instance
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
