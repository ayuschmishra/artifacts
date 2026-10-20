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

1. Copy the `_template` folder and rename the copy, e.g. `dl-tracker`. The folder name becomes the URL: `/artifacts/dl-tracker/`.
2. In `dl-tracker/index.html`, change the four commented spots:
   1. `<title>`
   2. the heading and the line under it
   3. `APP_ID` (unique, never change it later, e.g. `"dl-tracker"`)
   4. `SECTIONS`: your weeks/topics and items, each with a short permanent `id`
3. In the root `index.html`, copy the MAD-II card and point it at `dl-tracker/`.
4. `git add . && git commit -m "Add DL tracker" && git push`. Live in about a minute.

Sign-in, per-user saving and the black/green look come with the template. Firebase needs no changes.
