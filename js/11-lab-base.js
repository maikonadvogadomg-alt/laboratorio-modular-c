/* =========================================================================
   LABORATÓRIO — 11-lab-base.js
   A peça que entende "quem chama quem" dentro do projeto importado.
   Usada pelo Mapa de ligações e pela Prévia.
   - HTML:  <script src>, <link href>, <img src>, <iframe src>, <a href="x.html">
   - JS/TS: import … from 'x', import('x'), require('x'), export … from 'x'
   - CSS:   @import 'x', url(x)
   Caminho do projeto ("./x", "../x", "/x", "@/x") vira arquivo; o resto
   ("react", "lodash") é PACOTE de fora (npm).
   ========================================================================= */
window.Lab = (function () {
  'use strict';
  const EXT_TENTAR = ['', '.js', '.mjs', '.jsx', '.ts', '.tsx', '.css', '.json', '.html', '/index.js', '/index.ts', '/index.tsx', '/index.jsx', '/index.html'];
  const ehBinario = (t) => typeof t !== 'string' || /^\[(Arquivo binário|Erro ao ler)/.test(t);

  const arquivos = () => (typeof Shell !== 'undefined' && Shell.getState('projectFiles')) || {};
  const binarios = () => window.LabBin || {};
  const lista = () => Object.keys(arquivos()).concat(Object.keys(binarios()).filter((p) => !(p in arquivos()))).sort();
  const tipo = (p) => { const m = p.toLowerCase().match(/\.([a-z0-9]+)$/); return m ? m[1] : ''; };
  const pasta = (p) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');

  function normalizar(caminho) {
    const out = [];
    for (const parte of caminho.split('/')) {
      if (!parte || parte === '.') continue;
      if (parte === '..') out.pop(); else out.push(parte);
    }
    return out.join('/');
  }

  // raiz "de verdade" do projeto: se tudo está dentro de uma pasta só, ela conta como raiz para "/x"
  function raizComum() {
    const ps = Object.keys(arquivos());
    if (!ps.length) return '';
    const topo = ps[0].split('/')[0];
    return ps.every((p) => p.startsWith(topo + '/')) ? topo + '/' : '';
  }

  // "./x" a partir de "src/App.tsx" → "src/x.tsx" (tentando as extensões)
  function resolver(de, spec) {
    if (!spec || /^(https?:|data:|blob:|mailto:|tel:|javascript:|#)/i.test(spec) || spec.startsWith('//')) return { externo: true, url: spec };
    const limpo = spec.split('?')[0].split('#')[0];
    let base;
    if (limpo.startsWith('./') || limpo.startsWith('../')) base = normalizar(pasta(de) + '/' + limpo);
    else if (limpo.startsWith('/')) base = normalizar(raizDoArquivo(de) + limpo);
    else if (limpo.startsWith('@/') || limpo.startsWith('~/')) return resolverApelido(limpo.slice(2));
    else if (/\.(html?|css|js|mjs|jsx|tsx?|png|jpe?g|svg|gif|webp|ico|json)$/i.test(limpo) && !limpo.includes('node_modules')) base = normalizar(pasta(de) + '/' + limpo);  // "style.css" sem ./ (comum em HTML)
    else return { pacote: nomePacote(limpo), spec: limpo };
    return achar(base) || { faltando: base };
  }
  function raizDoArquivo(de) {
    // um "/x" dentro de client/index.html normalmente quer dizer client/x (raiz do site)
    const partes = de.split('/');
    for (let i = partes.length - 1; i >= 0; i -= 1) {
      const d = partes.slice(0, i).join('/');
      if (arquivos()[(d ? d + '/' : '') + 'index.html'] != null || arquivos()[(d ? d + '/' : '') + 'package.json'] != null) return d;
    }
    return raizComum().replace(/\/$/, '');
  }
  function resolverApelido(resto) {
    for (const pre of ['src/', 'client/src/', raizComum() + 'src/', raizComum() + 'client/src/']) { const r = achar(normalizar(pre + resto)); if (r) return r; }
    const fim = '/src/' + resto;
    const p = lista().find((x) => EXT_TENTAR.some((e) => x.endsWith(fim + e)));
    return p ? { arquivo: p } : { faltando: '@/' + resto };
  }
  function achar(base) {
    const tem = (p) => p in arquivos() || p in binarios();
    for (const e of EXT_TENTAR) if (tem(base + e)) return { arquivo: base + e };
    return null;
  }
  const nomePacote = (s) => (s.startsWith('@') ? s.split('/').slice(0, 2).join('/') : s.split('/')[0]);

  // tudo o que um arquivo chama
  function referencias(p) {
    const t = arquivos()[p];
    if (ehBinario(t)) return [];
    const achados = [];
    const add = (spec, como) => { if (spec && !achados.some((a) => a.spec === spec)) achados.push({ spec, como }); };
    const x = tipo(p);
    if (x === 'html' || x === 'htm') {
      for (const m of t.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)) add(m[1], 'script');
      for (const m of t.matchAll(/<link\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi)) if (!/rel\s*=\s*["']?(preconnect|dns-prefetch)/i.test(m[0])) add(m[1], 'link');
      for (const m of t.matchAll(/<(?:img|source|iframe|audio|video)\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)) add(m[1], 'mídia');
      for (const m of t.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"'#?]+\.html?)["']/gi)) add(m[1], 'link de página');
      for (const m of t.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) for (const r of refsJS(m[1])) add(r.spec, r.como);
    } else if (['js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'vue', 'svelte'].includes(x)) {
      for (const r of refsJS(t)) add(r.spec, r.como);
    } else if (x === 'css' || x === 'scss') {
      for (const m of t.matchAll(/@import\s+(?:url\()?["']([^"']+)["']/gi)) add(m[1], '@import');
      for (const m of t.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) if (!m[1].startsWith('data:')) add(m[1], 'url()');
    }
    return achados.map((a) => Object.assign(a, resolver(p, a.spec)));
  }
  function refsJS(t) {
    const out = [];
    const semComentario = t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'`])\/\/.*$/gm, '$1');
    for (const m of semComentario.matchAll(/\b(?:import|export)\s+(?:[\w*\s{},$]+?\s+from\s+)?["']([^"']+)["']/g)) out.push({ spec: m[1], como: 'import' });
    for (const m of semComentario.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)) out.push({ spec: m[1], como: 'import()' });
    for (const m of semComentario.matchAll(/\brequire\(\s*["']([^"']+)["']\s*\)/g)) out.push({ spec: m[1], como: 'require' });
    for (const m of semComentario.matchAll(/new\s+URL\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url/g)) out.push({ spec: m[1], como: 'new URL' });
    return out;
  }

  // o mapa inteiro: para cada arquivo, o que ele usa e quem usa ele
  let cache = null, cacheChave = '';
  function mapa() {
    const fs = arquivos();
    const chave = Object.keys(fs).length + ':' + Object.keys(fs).slice(0, 5).join('|');
    if (cache && cacheChave === chave) return cache;
    const usa = {}, usadoPor = {}, pacotes = {}, faltando = {};
    for (const p of lista()) { usa[p] = []; usadoPor[p] = usadoPor[p] || []; }
    for (const p of Object.keys(fs)) {
      for (const r of referencias(p)) {
        if (r.arquivo) { usa[p].push(r.arquivo); (usadoPor[r.arquivo] = usadoPor[r.arquivo] || []).push(p); }
        else if (r.pacote) (pacotes[r.pacote] = pacotes[r.pacote] || []).push(p);
        else if (r.faltando) (faltando[p] = faltando[p] || []).push(r.spec);
      }
    }
    cache = { usa, usadoPor, pacotes, faltando }; cacheChave = chave;
    return cache;
  }
  const limparCache = () => { cache = null; };

  // um arquivo + tudo o que ele precisa (e o que esses precisam…)
  function comTudoQuePrecisa(inicio) {
    const m = mapa(); const vistos = new Set(); const fila = [].concat(inicio);
    while (fila.length) { const p = fila.shift(); if (vistos.has(p)) continue; vistos.add(p); for (const q of m.usa[p] || []) fila.push(q); }
    const pacotes = new Set();
    for (const [pac, quem] of Object.entries(m.pacotes)) if (quem.some((q) => vistos.has(q))) pacotes.add(pac);
    return { arquivos: [...vistos], pacotes: [...pacotes] };
  }

  // versão do pacote no package.json do projeto (para o CDN pegar a mesma)
  function versaoDe(pacote) {
    for (const [p, t] of Object.entries(arquivos())) {
      if (!p.endsWith('package.json') || p.includes('node_modules')) continue;
      try { const j = JSON.parse(t); const v = (j.dependencies || {})[pacote] || (j.devDependencies || {})[pacote]; if (v && !/^(workspace|catalog|file|link):/.test(v)) return v.replace(/^[\^~>=<\s]+/, ''); } catch (e) {}
    }
    return '';
  }

  function baixar(blob, nome) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000); }
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const aviso = (m, t) => (typeof Shell !== 'undefined' && Shell.toast ? Shell.toast(m, t || 'info') : alert(m));

  return { arquivos, binarios, lista, tipo, pasta, ehBinario, resolver, referencias, mapa, limparCache, comTudoQuePrecisa, versaoDe, baixar, esc, aviso, raizComum };
})();
