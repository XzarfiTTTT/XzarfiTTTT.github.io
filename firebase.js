// Firebase configuration for multiplayer
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, push, set, onValue, remove, get, child, onDisconnect } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC6GoSYb_wCSlGxvw48ETD6cJnvBJISNLA",
  authDomain: "xzarfitttt.firebaseapp.com",
  projectId: "xzarfitttt",
  storageBucket: "xzarfitttt.firebasestorage.app",
  messagingSenderId: "1006659868459",
  appId: "1:1006659868459:web:0f09e7a9650ca5e682576e"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, push, set, onValue, remove, get, child, onDisconnect };
