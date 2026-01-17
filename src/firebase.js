import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAPfA_NAJE5E7sNIV9fviNyBT4IpfnMZP4",
  authDomain: "girlpower-thrift.firebaseapp.com",
  projectId: "girlpower-thrift",
  storageBucket: "girlpower-thrift.firebasestorage.app",
  messagingSenderId: "495000860812",
  appId: "1:495000860812:web:3e8f4295e265593dcd23a9",
  measurementId: "G-XCVBV9ZLN8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);