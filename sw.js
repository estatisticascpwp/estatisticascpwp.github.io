/* SCP Stat · Service worker
   - guarda todos os ficheiros da app no dispositivo (funciona sem internet)
   - guarda as fontes da Google na primeira utilização com rede
   - uma versão nova só é ativada quando o utilizador carrega em "Atualizar agora" */
const VERSION = '522f419a6e';
const APP_CACHE = 'scp-stat-app-' + VERSION;
const FONT_CACHE = 'scp-stat-fonts';
const PRECACHE = [
 "./",
 "index.html",
 "estatistica_individual.html",
 "remates.html",
 "jogadores.html",
 "guarda_redes.html",
 "estatistica_coletiva.html",
 "tabela_tempo_jogo.html",
 "exclusoes.html",
 "interpretacao.html",
 "definicoes.html",
 "css/scp_stat.css",
 "javascript/core.js",
 "javascript/inicio.js",
 "javascript/estatistica_individual.js",
 "javascript/remates.js",
 "javascript/jogadores.js",
 "javascript/guarda_redes.js",
 "javascript/estatistica_coletiva.js",
 "javascript/tabela_tempo_jogo.js",
 "javascript/exclusoes.js",
 "javascript/interpretacao.js",
 "javascript/definicoes.js",
 "manifest.webmanifest",
 "icons/apple-touch-icon.png",
 "icons/favicon-32.png",
 "icons/favicon.svg",
 "icons/icon-192.png",
 "icons/icon-512.png",
 "icons/icon-maskable-192.png",
 "icons/icon-maskable-512.png",
 "icons/shortcut-exclusoes.png",
 "icons/shortcut-individual.png",
 "icons/shortcut-tempo.png"
];
// fontes e biblioteca do Firebase (versão fixa no endereço, por isso a cache é segura)
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'www.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(APP_CACHE).then(c => c.addAll(PRECACHE.map(u => new Request(u, { cache: 'reload' })))));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('scp-stat-app-') && k !== APP_CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // fontes: cache primeiro, rede como recurso (e guardar para usar offline)
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(caches.open(FONT_CACHE).then(async cache => {
      const hit = await cache.match(req);
      if (hit) return hit;
      try { const res = await fetch(req); if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; }
      catch (e) { return new Response('', { status: 504 }); }
    }));
    return;
  }
  if (url.origin !== self.location.origin) return;

  // ficheiros da app: cache primeiro (a versão muda com cada atualização da app)
  event.respondWith((async () => {
    const cache = await caches.open(APP_CACHE);
    let hit = await cache.match(req, { ignoreSearch: true });
    if (!hit && req.mode === 'navigate') {
      const scope = new URL(self.registration.scope);
      hit = (url.pathname === scope.pathname) ? await cache.match('./') : null;
      if (!hit) {
        try { return await fetch(req); } catch (e) { return (await cache.match('./index.html')) || Response.error(); }
      }
    }
    if (hit) return hit;
    try { return await fetch(req); } catch (e) { return Response.error(); }
  })());
});
