import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  onValue,
  onDisconnect,
  remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDxIl1zm08N1WJyTSo79u3waAgUEWuDCg8",
  authDomain: "tic-tac-toe-online-spidy.firebaseapp.com",
  databaseURL: "https://tic-tac-toe-online-spidy-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tic-tac-toe-online-spidy",
  storageBucket: "tic-tac-toe-online-spidy.firebasestorage.app",
  messagingSenderId: "1026610760923",
  appId: "1:1026610760923:web:236a051b59642f770290fe",
  measurementId: "G-CNLQMTPSDC"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export {
  db,
  ref,
  set,
  get,
  update,
  onValue,
  onDisconnect,
  remove
};