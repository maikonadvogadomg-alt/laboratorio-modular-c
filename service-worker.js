// service-worker.js — gerado pelo Mini SK em 20/10/2026, 12:36:30
// Não precisa mexer: ele guarda sozinho o que o app usa.
const PREFIXO = 'sk-laboratorio-modular-c-';
const CACHE = PREFIXO + 'mvguiv8f';
// Lista feita automaticamente (para funcionar sem internet logo após instalar)
const GUARDAR = [
  "./",
  "./css/00-casca.css",
  "./css/02-importar.css",
  "./css/03-dependencias.css",
  "./css/04-analisar.css",
  "./css/05-plano.css",
  "./css/06-scripts.css",
  "./css/07-terminal.css",
  "./css/08-exportar.css",
  "./css/09-integracao.css",
  "./css/10-celular.css",
  "./css/11-lab.css",
  "./electron/main.cjs",
  "./electron/preload.cjs",
  "./favicon.ico",
  "./ferramentas/ai-code-studio.html",
  "./ferramentas/arrumador.html",
  "./ferramentas/colador.html",
  "./ferramentas/faxina.html",
  "./ferramentas/iara-suite.html",
  "./ferramentas/juntador.html",
  "./ferramentas/numerador.html",
  "./ferramentas/preparador.html",
  "./ferramentas/projeto-lab.html",
  "./ferramentas/replicador.html",
  "./hub.html",
  "./hub.webmanifest",
  "./icons/apple-touch-icon.png",
  "./icons/icon-16.png",
  "./icons/icon-32.png",
  "./icons/icon-48.png",
  "./icons/icon-72.png",
  "./icons/icon-96.png",
  "./icons/icon-128.png",
  "./icons/icon-144.png",
  "./icons/icon-152.png",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-384.png",
  "./icons/icon-512.png",
  "./icons/icon.svg",
  "./icons/maskable-192.png",
  "./icons/maskable-512.png",
  "./icons/maskable.svg",
  "./index.html",
  "./js/00-casca.js",
  "./js/02-importar.js",
  "./js/03-dependencias.js",
  "./js/04-analisar.js",
  "./js/05-plano.js",
  "./js/05a-markdown.js",
  "./js/06-scripts.js",
  "./js/06b-scripts-fim.js",
  "./js/07-terminal.js",
  "./js/07a-busca-npm.js",
  "./js/08-exportar.js",
  "./js/09-integracao.js",
  "./js/10-celular.js",
  "./js/11-lab-base.js",
  "./js/12-lab-mapa.js",
  "./js/13-lab-previa.js",
  "./js/14-lab-pesquisa.js",
  "./js/15-lab-comparar.js",
  "./js/15a-tar.js",
  "./js/16-lab-ferramentas.js",
  "./js/17-lab-termux.js",
  "./js/18-lab-desmontar.js",
  "./kits/juntar.py",
  "./kits/kit-replit.cjs",
  "./kits/organizar.py",
  "./kits/servir.py",
  "./LEIA-ME.md",
  "./lib/acorn.min.js",
  "./lib/jszip.min.js",
  "./lib/pako.min.js",
  "./manifest.json",
  "./package.json",
  "./PLANO.md"
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(GUARDAR.map((u) => c.add(u).catch(() => null)))));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k.startsWith(PREFIXO) && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Primeiro a internet (sempre a versão nova); sem internet, a cópia guardada.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); }
      // Igual ao Workbox da Replit: página que não existe (rota do app) abre o index
      if (res.status === 404 && req.mode === 'navigate') return caches.match('./').then((r) => r || fetch('./'));
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || (req.mode === 'navigate' ? caches.match('./') : undefined)))
  );
});
