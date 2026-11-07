/* Service worker DCS Manager : fonctionnement hors ligne.
   Pour forcer une mise à jour chez tous les utilisateurs, changez le numéro de VERSION ci-dessous. */
const VERSION = "dcs-manager-v1";
const FICHIERS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(noms => Promise.all(noms.filter(n => n !== VERSION).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

/* Les fichiers de l’application sont servis depuis le cache, puis rafraîchis en arrière-plan. */
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(c =>
      c.match(r, { ignoreSearch: true }).then(enCache => {
        const reseau = fetch(r)
          .then(rep => { if (rep.ok) c.put(r, rep.clone()); return rep; })
          .catch(() => enCache || (r.mode === "navigate" ? c.match("./index.html") : Response.error()));
        return enCache || reseau;
      })
    )
  );
});
