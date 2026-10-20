# Adding a new artifact

Live site: https://ayuschmishra.github.io/artifacts/
Local repo: `C:\Users\ASUS\Desktop\artifacts`

Any self-contained HTML page works. Sign-in and saving to each person's account come from one shared file (`assets/sync.js`), so Firebase never needs changing.

---

## The 4 steps

### 1. Make a folder and put the page in it

```
artifacts/
└── dl_course/          ← new folder
    └── index.html      ← your HTML file, renamed to index.html
```

- The folder name becomes the page's address: `ayuschmishra.github.io/artifacts/dl_course/`
- Use lowercase, no spaces (underscores or dashes are fine).
- **Never rename the folder later.** Each person's saved progress is stored under the folder name, so renaming it loses their progress.

### 2. Add one line to the page

Open `dl_course/index.html`. Find this line near the top, inside `<head>`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

Paste this right under it:

```html
<script src="../assets/sync.js"></script>
```

That adds the "← All artifacts" bar, the sign-in button, and saving to the account.

**If the file has its own Firebase login section, delete it.** It usually looks like:

- a `<script type="module">` block containing `firebaseConfig` / `PASTE_YOUR_API_KEY`, and
- a `<div class="acct" id="acct">` block with "Sign in with Google" / "Sign out" buttons.

Optional: change `<title>...</title>` to the name you want in the browser tab.

### 3. Add the card to the home page

Open the root `index.html`, find the `ARTIFACTS` list, and add one line:

```js
const ARTIFACTS = [
  { folder: "mad2-tracker", name: "MAD-II study tracker", tag: "IIT Madras · MAD-II", about: "..." },
  { folder: "js_course",    name: "JavaScript Course",    tag: "Apna College · JS",   about: "..." },
  { folder: "dl_course",    name: "Deep Learning Course", tag: "IIT Madras · DL",     about: "One line about it." },
];
```

| Field   | What it is                                     | Required |
|---------|------------------------------------------------|----------|
| `folder`| Exact folder name from step 1                  | yes      |
| `name`  | Title shown on the card                        | yes      |
| `tag`   | Small grey label above the title               | no       |
| `about` | One line under the title                       | no       |

Keep the comma at the end of each line.

### 4. Push

```powershell
cd C:\Users\ASUS\Desktop\artifacts
git pull --rebase
git add .
git commit -m "Add Deep Learning Course"
git push
```

Wait about a minute, then open the site and press **Ctrl+F5** (or clear the cache on your phone).

---

## Check it works

- [ ] The new card shows on the home page and opens the page
- [ ] The page has "← All artifacts" and your name/avatar at the top
- [ ] Tick something, reload: still ticked
- [ ] Open it on another device signed in: same ticks

---

## If something goes wrong

| Problem | Fix |
|---|---|
| Card opens a 404 page | `folder` in `ARTIFACTS` doesn't match the folder name, or the file isn't named `index.html` |
| No sign-in bar on the page | The `<script src="../assets/sync.js"></script>` line is missing or misspelled |
| Two sign-in areas on the page | Delete the page's own Firebase login section (step 2) |
| Progress doesn't follow to other devices | The page doesn't save to localStorage, so there's nothing to sync. Ask for the page to save its state in localStorage |
| `git push` says "rejected (fetch first)" | Run `git pull --rebase`, then `git push` again |
| Old version still showing | Press Ctrl+F5; GitHub Pages can take 1–2 minutes |

---

## Good to know

- Firebase project: `artifacts-8f8d0`. People who sign up: **Security → Authentication → Users**. Saved progress: **Databases & Storage → Firestore → Data**, under `users/{id}/apps/{folder}`.
- Each person can only see their own progress (set by the Firestore rules).
- Signing in on a device replaces that device's guest ticks with the account's saved progress. Guest ticks are only carried over on the first sign-in, when the account has nothing saved for that page yet.
- When asking Claude (or anyone) to make a new page for this site, say: *"Self-contained single HTML file, save progress in localStorage, no login or Firebase code."* Then it drops straight in with the steps above.
