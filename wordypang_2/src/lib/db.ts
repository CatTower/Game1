import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDMzExBoqXRqb-2NTS8ykBiK5VmBeuqOMk",
  authDomain: "game1-7cd2a.firebaseapp.com",
  projectId: "game1-7cd2a",
  storageBucket: "game1-7cd2a.firebasestorage.app",
  messagingSenderId: "157516896033",
  appId: "1:157516896033:web:ad78dba9196d9810075060",
  measurementId: "G-WEGZDFES48"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
