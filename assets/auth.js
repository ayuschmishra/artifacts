// Shared sign-in + database for every page in this repo.
// Usage (in a <script type="module">):
//   import { mountAuth, db, doc, onSnapshot, setDoc } from "../assets/auth.js";
//   mountAuth({ appName: "My tool", onSignIn(user){...}, onSignOut(){...} });
// The sign-in UI lives in auth-core.js; this file adds Firestore.

import {
  getFirestore, doc, getDoc, onSnapshot, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { app, configured } from "./auth-core.js";

export * from "./auth-core.js";
export const db = configured ? getFirestore(app) : null;
export { doc, getDoc, onSnapshot, setDoc, serverTimestamp };
