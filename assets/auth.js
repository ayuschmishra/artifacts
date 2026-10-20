// Shared sign-in for every page in this repo.
// Usage (in a <script type="module">):
//   import { mountAuth, db, doc, onSnapshot, setDoc } from "../assets/auth.js";
//   mountAuth({ appName: "My tool", onSignIn(user){...}, onSignOut(){...} });
// Puts an account chip into #account (if present) and shows a sign-in dialog when nobody is signed in.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, signOut, updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, onSnapshot, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

export const configured = !String(firebaseConfig.apiKey || "").startsWith("PASTE");
export const app = configured ? initializeApp(firebaseConfig) : null;
export const auth = configured ? getAuth(app) : null;
export const db = configured ? getFirestore(app) : null;
export { doc, getDoc, onSnapshot, setDoc, serverTimestamp };

const GUEST_KEY = "artifacts-guest";
const CSS = `
.au-chip{display:inline-flex;align-items:center;gap:8px;font:500 .84rem var(--f-body,system-ui,sans-serif);color:var(--fg,#1b1f1c)}
.au-chip .au-who{max-width:22ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--muted,#646b65)}
.au-btn{font:500 .84rem var(--f-body,system-ui,sans-serif);color:var(--fg,#1b1f1c);background:var(--surface,#fff);border:1px solid var(--line,#e1e4dd);border-radius:8px;padding:.4rem .7rem;cursor:pointer}
.au-btn.primary{background:var(--fg,#1b1f1c);color:var(--bg,#fff);border-color:var(--fg,#1b1f1c);width:100%;padding:.6rem}
.au-btn.google{width:100%;padding:.6rem;display:flex;align-items:center;justify-content:center;gap:8px}
.au-btn:disabled{opacity:.6;cursor:progress}
.au-back{position:fixed;inset:0;z-index:100;background:rgba(10,12,11,.55);display:none;align-items:center;justify-content:center;padding:16px}
.au-back.open{display:flex}
.au-card{width:100%;max-width:380px;background:var(--surface,#fff);color:var(--fg,#1b1f1c);border:1px solid var(--line,#e1e4dd);border-radius:14px;padding:20px;font:15px/1.5 var(--f-body,system-ui,sans-serif);box-shadow:0 20px 50px rgba(0,0,0,.25);max-height:calc(100vh - 32px);overflow:auto}
.au-card h2{font:800 1.35rem/1.15 var(--f-display,system-ui,sans-serif);margin:0 0 4px}
.au-card p.au-sub{margin:0 0 14px;color:var(--muted,#646b65);font-size:.9rem}
.au-tabs{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--line,#e1e4dd);border-radius:8px;overflow:hidden;margin-bottom:14px}
.au-tabs button{font:500 .88rem var(--f-body,system-ui,sans-serif);border:0;background:transparent;color:var(--fg,#1b1f1c);padding:.5rem;cursor:pointer}
.au-tabs button[aria-selected="true"]{background:var(--fg,#1b1f1c);color:var(--bg,#fff)}
.au-card form{display:grid;gap:10px}
.au-card label{display:grid;gap:4px;font-size:.8rem;font-weight:600;color:var(--muted,#646b65)}
.au-card input{font:15px var(--f-body,system-ui,sans-serif);color:var(--fg,#1b1f1c);background:var(--bg,#f5f6f2);border:1px solid var(--line,#e1e4dd);border-radius:8px;padding:.55rem .65rem;width:100%}
.au-card input:focus-visible,.au-btn:focus-visible,.au-link:focus-visible{outline:2px solid var(--theory,#3a4fb0);outline-offset:2px}
.au-or{display:flex;align-items:center;gap:10px;color:var(--muted,#646b65);font-size:.78rem;margin:12px 0}
.au-or::before,.au-or::after{content:"";flex:1;height:1px;background:var(--line,#e1e4dd)}
.au-msg{font-size:.85rem;min-height:1.2em;margin:0}
.au-msg.err{color:#c0392b}.au-msg.ok{color:var(--vue,#2f9e6e)}
.au-row{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:12px}
.au-link{background:none;border:0;padding:0;color:var(--theory,#3a4fb0);font:500 .84rem var(--f-body,system-ui,sans-serif);cursor:pointer;text-decoration:underline}
.au-hide{display:none!important}
`;

const ERR = {
  "auth/invalid-credential": "Wrong email or password.",
  "auth/wrong-password": "Wrong email or password.",
  "auth/user-not-found": "No account with that email. Create one instead.",
  "auth/email-already-in-use": "That email already has an account. Sign in instead.",
  "auth/weak-password": "Password needs at least 6 characters.",
  "auth/invalid-email": "That email doesn't look right.",
  "auth/missing-password": "Enter your password.",
  "auth/too-many-requests": "Too many tries. Wait a minute and try again.",
  "auth/popup-closed-by-user": "Google sign-in was closed before finishing.",
  "auth/popup-blocked": "Your browser blocked the Google pop-up. Allow pop-ups for this site.",
  "auth/network-request-failed": "No connection. Check your internet.",
  "auth/operation-not-allowed": "This sign-in method isn't enabled in Firebase yet.",
  "auth/unauthorized-domain": "This website isn't in Firebase's authorised domains list yet."
};
const nice = e => ERR[e && e.code] || (e && e.message) || "Something went wrong.";

export function mountAuth({ appName = "Artifacts", required = true, onSignIn = () => {}, onSignOut = () => {} } = {}) {
  const style = document.createElement("style"); style.textContent = CSS; document.head.appendChild(style);

  // Account chip
  const chipHost = document.getElementById("account");
  const chip = document.createElement("div"); chip.className = "au-chip";
  chip.innerHTML = `<span class="au-who"></span><button type="button" class="au-btn" data-act></button>`;
  if (chipHost) chipHost.appendChild(chip);
  const who = chip.querySelector(".au-who"), act = chip.querySelector("[data-act]");

  // Dialog
  const back = document.createElement("div"); back.className = "au-back";
  back.innerHTML = `
  <div class="au-card" role="dialog" aria-modal="true" aria-labelledby="au-title">
    <h2 id="au-title">Sign in</h2>
    <p class="au-sub">Your progress in <strong></strong> is saved to your account, so it's there on any device.</p>
    <div class="au-tabs" role="tablist">
      <button type="button" role="tab" data-tab="in" aria-selected="true">Sign in</button>
      <button type="button" role="tab" data-tab="up" aria-selected="false">Create account</button>
    </div>
    <form novalidate>
      <label class="au-name au-hide">Name<input name="displayName" autocomplete="name" maxlength="60"></label>
      <label>Email<input name="email" type="email" autocomplete="email" required></label>
      <label class="au-pw">Password<input name="password" type="password" autocomplete="current-password" minlength="6" required></label>
      <p class="au-msg" aria-live="polite"></p>
      <button class="au-btn primary" type="submit">Sign in</button>
    </form>
    <div class="au-or">or</div>
    <button class="au-btn google" type="button" data-google>
      <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
      Continue with Google
    </button>
    <div class="au-row">
      <button type="button" class="au-link" data-forgot>Forgot password?</button>
      <button type="button" class="au-link" data-guest>Use without an account</button>
    </div>
  </div>`;
  document.body.appendChild(back);
  back.querySelector(".au-sub strong").textContent = appName;

  const form = back.querySelector("form"), msg = back.querySelector(".au-msg"), submit = form.querySelector("[type=submit]");
  const title = back.querySelector("#au-title"), nameRow = back.querySelector(".au-name"), pwRow = back.querySelector(".au-pw");
  let mode = "in"; // in | up | reset

  function setMsg(t, kind = "err") { msg.textContent = t || ""; msg.className = "au-msg " + (t ? kind : ""); }
  function setMode(m) {
    mode = m; setMsg("");
    back.querySelectorAll("[data-tab]").forEach(b => b.setAttribute("aria-selected", String(b.dataset.tab === m)));
    nameRow.classList.toggle("au-hide", m !== "up");
    pwRow.classList.toggle("au-hide", m === "reset");
    form.password.autocomplete = m === "up" ? "new-password" : "current-password";
    title.textContent = m === "up" ? "Create your account" : m === "reset" ? "Reset password" : "Sign in";
    submit.textContent = m === "up" ? "Create account" : m === "reset" ? "Send reset link" : "Sign in";
  }
  const open = () => { if (!configured) return; back.classList.add("open"); setTimeout(() => form.email.focus(), 30); };
  const close = () => back.classList.remove("open");
  const busy = on => back.querySelectorAll("button").forEach(b => b.disabled = on);

  back.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => setMode(b.dataset.tab)));
  back.querySelector("[data-forgot]").addEventListener("click", () => setMode("reset"));
  back.querySelector("[data-guest]").addEventListener("click", () => {
    try { localStorage.setItem(GUEST_KEY, "1"); } catch (_) {}
    close();
  });
  back.addEventListener("keydown", e => { if (e.key === "Escape" && !required) close(); });

  form.addEventListener("submit", async e => {
    e.preventDefault(); setMsg("");
    const email = form.email.value.trim(), pw = form.password.value;
    busy(true);
    try {
      if (mode === "reset") {
        await sendPasswordResetEmail(auth, email);
        setMsg("Reset link sent. Check your inbox (and spam).", "ok");
      } else if (mode === "up") {
        const cred = await createUserWithEmailAndPassword(auth, email, pw);
        const name = form.displayName.value.trim();
        if (name) { await updateProfile(cred.user, { displayName: name }); who.textContent = name; }
      } else {
        await signInWithEmailAndPassword(auth, email, pw);
      }
    } catch (err) { setMsg(nice(err)); }
    busy(false);
  });
  back.querySelector("[data-google]").addEventListener("click", async () => {
    setMsg(""); busy(true);
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (err) { setMsg(nice(err)); }
    busy(false);
  });

  act.addEventListener("click", async () => {
    if (auth && auth.currentUser) { await signOut(auth); }
    else { setMode("in"); open(); }
  });

  if (!configured) {
    who.textContent = "Accounts not set up yet";
    act.classList.add("au-hide");
    console.warn("[auth] Fill in assets/firebase-config.js to turn on accounts.");
    return { open: () => {}, signOut: () => {} };
  }

  let wasSignedIn = false;
  onAuthStateChanged(auth, user => {
    if (user) {
      wasSignedIn = true;
      try { localStorage.removeItem(GUEST_KEY); } catch (_) {}
      who.textContent = user.displayName || user.email || "Signed in";
      act.textContent = "Sign out";
      close(); form.reset(); setMode("in");
      onSignIn(user);
    } else {
      who.textContent = "Not signed in";
      act.textContent = "Sign in";
      if (wasSignedIn) onSignOut();
      wasSignedIn = false;
      let guest = false; try { guest = localStorage.getItem(GUEST_KEY) === "1"; } catch (_) {}
      if (required && !guest) open();
    }
  });

  return { open, signOut: () => signOut(auth) };
}
