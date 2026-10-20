# artifacts

Small study tools, hosted free on GitHub Pages, with accounts and saved progress from Firebase (Auth + Firestore).

```
index.html                 hub page listing every tool
assets/auth.js             shared sign-in / sign-up / Google / reset-password dialog
assets/firebase-config.js  your Firebase web config (paste it here once)
mad2-tracker/index.html    MAD-II study tracker
firestore.rules            security rules: each user can only touch users/{their uid}/...
firebase.json              only needed if you deploy rules with the Firebase CLI
```

Data lives at `users/{uid}/apps/{appId}` in Firestore, one document per tool per person.

## Adding another tool

1. Make a folder, e.g. `dl-tracker/index.html`.
2. Put `<div id="account"></div>` where the sign-in chip should go.
3. Add a module script:

```html
<script type="module">
import { mountAuth, db, doc, onSnapshot, setDoc } from "../assets/auth.js";
mountAuth({
  appName: "DL tracker",
  onSignIn(user) {
    const ref = doc(db, "users", user.uid, "apps", "dl-tracker");
    onSnapshot(ref, snap => { /* render snap.data() */ });
    // save with: setDoc(ref, yourState)
  },
  onSignOut() { /* clear the page */ }
});
</script>
```

4. Add a card for it in the root `index.html`.
