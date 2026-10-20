/* Drop-in account sync for any self-contained page.
 *
 * Add ONE line inside the page's <head> (before its own scripts):
 *   <script src="../assets/sync.js"></script>
 *
 * What it does:
 *  - Adds a slim bar at the top: "← All artifacts" and the sign-in / account chip.
 *    (If the page already has <div id="account">, it uses that instead.)
 *  - Whatever the page saves in localStorage is copied to the signed-in person's account
 *    (Firestore: users/{uid}/apps/{app}) and restored on any device they sign in from.
 *
 * Options (optional attributes on the script tag):
 *   data-app="js_course"   storage id. Defaults to the page's folder name. Never change it later.
 *   data-name="JavaScript Course"   name shown in the sign-in box. Defaults to <title>.
 */
(function () {
  const me = document.currentScript;
  const AUTH_URL = new URL("./auth.js", me.src).href;
  const HOME_URL = new URL("../", me.src).href;
  const parts = location.pathname.split("/").filter(Boolean);
  if (parts.length && /\.[a-z0-9]+$/i.test(parts[parts.length - 1])) parts.pop();
  const APP = (me.dataset.app || parts[parts.length - 1] || "page").replace(/[^\w-]/g, "_");
  const REG = "artifacts:keys:" + APP;            // which localStorage keys belong to this page
  const GUARD = "artifacts:reloaded:" + APP;      // stops reload loops
  const SKIP = /^(firebase|artifacts)/i;          // never sync these

  const ls = window.localStorage;
  const S = Storage.prototype, rawSet = S.setItem, rawRemove = S.removeItem;
  const safe = f => { try { return f(); } catch (_) { return undefined; } };

  let keys = new Set(safe(() => JSON.parse(ls.getItem(REG))) || []);
  const remember = () => safe(() => rawSet.call(ls, REG, JSON.stringify([...keys])));

  let saver = null, timer = null, touched = false, applying = false;

  // Watch the page's own saves.
  S.setItem = function (k, v) {
    rawSet.call(this, k, v);
    if (this === ls && !applying && !SKIP.test(k)) { if (!keys.has(k)) { keys.add(k); remember(); } changed(); }
  };
  S.removeItem = function (k) {
    rawRemove.call(this, k);
    if (this === ls && !applying && keys.has(k)) changed();
  };

  function snapshot() {
    const out = {};
    keys.forEach(k => { const v = safe(() => ls.getItem(k)); if (v != null) out[k] = v; });
    return out;
  }
  function changed() {
    touched = true;
    if (!saver) return;
    clearTimeout(timer); timer = setTimeout(flush, 800);
  }
  async function flush() {
    clearTimeout(timer); timer = null;
    if (!saver) return;
    try { await saver(snapshot()); status("Saved to your account. It follows you to any device."); }
    catch (e) { console.error(e); status("Couldn't save to your account just now. Your progress is kept in this browser."); }
  }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && timer) flush(); });

  // Pages built with a window.TRACKER.setStatus hook get sync messages in their own status line.
  function status(t) { safe(() => window.TRACKER && window.TRACKER.setStatus && window.TRACKER.setStatus(t)); }
  const same = (a, b) => { const ka = Object.keys(a), kb = Object.keys(b); return ka.length === kb.length && ka.every(k => a[k] === b[k]); };

  function reloadOnce() {
    const last = +safe(() => sessionStorage.getItem(GUARD)) || 0;
    if (Date.now() - last < 15000) return false;
    safe(() => sessionStorage.setItem(GUARD, String(Date.now())));
    location.reload(); return true;
  }

  function injectBar() {
    if (document.getElementById("account")) return;
    const st = document.createElement("style");
    st.textContent = `.ab-bar{max-width:880px;margin:0 auto;padding:14px 16px 0;display:flex;justify-content:space-between;align-items:center;gap:12px;min-height:50px;font-family:var(--f-body,system-ui,sans-serif)}
.ab-bar a{font-size:.84rem;color:var(--muted,#6b675c);text-decoration:none}.ab-bar a:hover{color:var(--fg,inherit)}`;
    document.head.appendChild(st);
    const bar = document.createElement("div"); bar.className = "ab-bar";
    bar.innerHTML = `<a href="${HOME_URL}">← All artifacts</a><div id="account"></div>`;
    document.body.prepend(bar);
  }

  async function start() {
    injectBar();
    let A;
    try { A = await import(AUTH_URL); } catch (e) { console.error(e); return; }
    if (!A.configured) return;
    A.mountAuth({
      appName: me.dataset.name || document.title,
      async onSignIn(user) {
        const ref = A.doc(A.db, "users", user.uid, "apps", APP);
        status("Loading your account…");
        let snap;
        try { snap = await A.getDoc(ref); }
        catch (e) { console.error(e); status("Couldn't reach your account. Your progress is kept in this browser."); return; }
        saver = data => A.setDoc(ref, { ls: data, updatedAt: A.serverTimestamp() });
        const local = snapshot();
        if (snap.exists()) {
          const remote = (snap.data() || {}).ls || {};
          if (touched) { await flush(); return; }                 // you changed something while it loaded: yours wins
          if (same(remote, local)) { status("Synced with your account. It follows you to any device."); return; }
          applying = true;
          keys.forEach(k => { if (!(k in remote)) safe(() => rawRemove.call(ls, k)); });
          Object.entries(remote).forEach(([k, v]) => { keys.add(k); safe(() => rawSet.call(ls, k, v)); });
          applying = false; remember();
          if (!reloadOnce()) status("Synced with your account. Reload to see the latest.");
        } else if (Object.keys(local).length) {
          await flush();                                          // first sign-in: keep what you did as a guest
        } else {
          status("Signed in. Your progress now saves to your account.");
        }
      },
      onSignOut() {
        saver = null; clearTimeout(timer);
        applying = true; keys.forEach(k => safe(() => rawRemove.call(ls, k))); applying = false;
        location.reload();                                        // start clean as a guest
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
