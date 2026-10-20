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

## Adding a new artifact (any self-contained HTML page)

1. Make a folder, e.g. `js_course`, and put the page inside it as `index.html`.
   The folder name becomes the URL: `/artifacts/js_course/`, and is where progress is stored, so don't rename it later.
2. In that page's `<head>`, right after the `<meta name="viewport" ...>` line, add:

   ```html
   <script src="../assets/sync.js"></script>
   ```

   This adds the "← All artifacts" bar and sign-in, and saves whatever the page keeps in
   localStorage to the person's account. If the page has its own Firebase login block, delete it.
3. In the root `index.html`, add one line to `ARTIFACTS`:

   ```js
   { folder: "js_course", name: "JavaScript Course", tag: "Apna College · JS", about: "One line about it." },
   ```

4. `git add . && git commit -m "Add JavaScript Course" && git push`. Live in about a minute.

Firebase needs no changes. `_template/` is a starter if you want to write a checklist page from scratch.
