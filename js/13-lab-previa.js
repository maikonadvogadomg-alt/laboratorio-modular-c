/* =========================================================================
   LABORATÓRIO — 13-lab-previa.js · 🧪 PRÉVIA DE VÁRIOS ARQUIVOS
   Escolhe a página (ou o main.tsx/jsx/js) e ela monta TUDO que a página usa:
   - CSS, JS, imagens e módulos do projeto (cada um vira um endereço "blob")
   - .jsx/.tsx/.ts → convertidos na hora (Sucrase; reserva: Babel)
   - pacotes npm ("react", "lodash"…) → pelo CDN esm.sh, na versão do projeto
   - Tailwind → pelo CDN quando o projeto usa (v3 ou v4)
   - import.meta.env e process.env → valores de teste
   - console da prévia aparece aqui embaixo (erros em vermelho)
   E dá para JUNTAR arquivos soltos (um .html + um .css + um .js) e ver juntos.
   ========================================================================= */
window.LabPrevia = (function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const E = (s) => Lab.esc(s);
  const CDN = {
    sucrase: 'https://esm.sh/sucrase@3.35.0',
    babel: 'https://unpkg.com/@babel/standalone@7.26.4/babel.min.js',
    esm: 'https://esm.sh/',
    tw3: 'https://cdn.tailwindcss.com/3.4.16',
    tw4: 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.1.11',
  };
  const op = { tailwind: true, converter: true, cdn: true };
  let entrada = '', extras = [], largura = 'cel', log = [], consoleLinhas = [], urls = [];

  // ── converter JSX/TS ───────────────────────────────────────
  let conversor = null;
  async function pegarConversor() {
    if (conversor) return conversor;
    try {
      const m = await import(CDN.sucrase);
      conversor = (code, nome) => m.transform(code, { transforms: /\.tsx$/i.test(nome) ? ['typescript', 'jsx'] : /\.ts$/i.test(nome) ? ['typescript'] : ['jsx'], jsxRuntime: 'automatic', production: true, filePath: nome }).code;
      log.push('🔧 Conversor de JSX/TS: Sucrase (leve)');
    } catch (e) {
      await new Promise((ok, falha) => { const s = document.createElement('script'); s.src = CDN.babel; s.onload = ok; s.onerror = () => falha(new Error('sem internet para baixar o conversor')); document.head.appendChild(s); });
      conversor = (code, nome) => window.Babel.transform(code, { filename: nome, presets: [['react', { runtime: 'automatic' }]].concat(/\.tsx?$/i.test(nome) ? [['typescript', { isTSX: /\.tsx$/i.test(nome), allExtensions: true }]] : []) }).code;
      log.push('🔧 Conversor de JSX/TS: Babel (reserva)');
    }
    return conversor;
  }
  const temJSX = (t) => /(^|[=(,:?&|]\s*|return\s+)<([A-Z][\w.]*|[a-z][\w-]*)(\s[^<>]*)?\/?>/m.test(t) && /<\/[\w.-]*>|\/>/.test(t);

  // ── pacotes de fora → CDN ──────────────────────────────────
  let versaoReact = '';
  function urlPacote(spec) {
    const nome = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
    const resto = spec.slice(nome.length);
    const v = Lab.versaoDe(nome);
    const deps = versaoReact && !/^react(-dom)?$/.test(nome) ? '?deps=react@' + versaoReact + ',react-dom@' + versaoReact : '';
    return CDN.esm + nome + (v ? '@' + v : '') + resto + deps;
  }

  // ── cada arquivo do projeto vira um endereço que o navegador entende ──
  let feitos = {}, fazendo = new Set(), precisaTailwind = 0;
  function blobURL(texto, tipo) { const u = URL.createObjectURL(new Blob([texto], { type: tipo })); urls.push(u); return u; }
  function urlBinario(p) { const b = Lab.binarios()[p]; if (!b) return null; const u = URL.createObjectURL(b); urls.push(u); return u; }

  async function urlDe(p) {
    if (feitos[p]) return feitos[p];
    const x = Lab.tipo(p);
    if (/^(png|jpe?g|gif|webp|svg|ico|bmp|avif|woff2?|ttf|otf|mp3|mp4|webm|wav|ogg)$/.test(x)) {
      const u = urlBinario(p) || (x === 'svg' && typeof Lab.arquivos()[p] === 'string' && !Lab.ehBinario(Lab.arquivos()[p]) ? blobURL(Lab.arquivos()[p], 'image/svg+xml') : null);
      return (feitos[p] = u || p);
    }
    if (fazendo.has(p)) { log.push('⚠️ Ligação em círculo: ' + p + ' (pode faltar algo)'); return blobURL('export {};', 'text/javascript'); }
    fazendo.add(p);
    const t = Lab.arquivos()[p] || '';
    let u;
    if (x === 'css' || x === 'scss') u = blobURL('const s=document.createElement("style");' + (ehTailwindCSS(t) ? 's.type="text/tailwindcss";' : '') + 's.textContent=' + JSON.stringify(await prepararCSS(p, t)) + ';document.head.appendChild(s);export default {};', 'text/javascript');
    else if (x === 'json') { let j = 'null'; try { j = JSON.stringify(JSON.parse(t)); } catch (e) {} u = blobURL('export default ' + j + ';', 'text/javascript'); }
    else if (['js', 'mjs', 'jsx', 'ts', 'tsx', 'cjs'].includes(x)) u = blobURL(await prepararJS(p, t), 'text/javascript');
    else if (x === 'html' || x === 'htm') u = blobURL(t, 'text/html');
    else u = blobURL('export default ' + JSON.stringify(p) + ';', 'text/javascript');
    fazendo.delete(p);
    return (feitos[p] = u);
  }

  async function prepararJS(p, t) {
    let code = t;
    const x = Lab.tipo(p);
    if (op.converter && (x === 'tsx' || x === 'ts' || x === 'jsx' || ((x === 'js' || x === 'mjs') && temJSX(t)))) {
      try { code = (await pegarConversor())(code, p); log.push('⚛️ Convertido: ' + p); }
      catch (e) { log.push('❌ Não converti ' + p + ': ' + e.message); }
    }
    return reescreverImports(p, code);
  }

  async function reescreverImports(de, code) {
    const re = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(["'])([^"'\n]+)\2/g;
    const trocas = []; let m;
    while ((m = re.exec(code))) trocas.push({ i: m.index, len: m[0].length, pre: m[1], q: m[2], spec: m[3] });
    let out = '', fim = 0;
    for (const tr of trocas) {
      const r = Lab.resolver(de, tr.spec);
      let novo = tr.spec;
      if (r.arquivo) novo = await urlDe(r.arquivo);
      else if (r.pacote && op.cdn) { novo = urlPacote(tr.spec); if (!log.includes('📦 ' + tr.spec + ' → ' + novo)) log.push('📦 ' + tr.spec + ' → ' + novo); }
      else if (r.faltando) log.push('⚠️ ' + de + ' chama "' + tr.spec + '", que não está no projeto');
      out += code.slice(fim, tr.i) + tr.pre + tr.q + novo + tr.q; fim = tr.i + tr.len;
    }
    out += code.slice(fim);
    if (/import\.meta\.env/.test(out)) out = 'import.meta.env = Object.assign({ MODE: "development", DEV: true, PROD: false, BASE_URL: "/" }, window.__LAB_ENV || {});\n' + out;
    return out;
  }

  const ehTailwindCSS = (t) => /@tailwind\b|@apply\b|@import\s+["']tailwindcss/.test(t);
  async function prepararCSS(p, t) {
    if (ehTailwindCSS(t)) precisaTailwind = Math.max(precisaTailwind, /@import\s+["']tailwindcss/.test(t) ? 4 : 3);
    let css = t.replace(/@import\s+["']tailwindcss[^;]*;/g, '');
    // @import de outro CSS do projeto → junta aqui
    const imps = [...css.matchAll(/@import\s+(?:url\()?["']([^"']+)["']\)?[^;]*;/g)];
    for (const im of imps) { const r = Lab.resolver(p, im[1]); if (r.arquivo && !Lab.ehBinario(Lab.arquivos()[r.arquivo])) css = css.replace(im[0], await prepararCSS(r.arquivo, Lab.arquivos()[r.arquivo])); }
    // url(imagem/fonte) → endereço blob
    const us = [...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)];
    for (const u of us) { const r = Lab.resolver(p, u[1]); if (r.arquivo) { const nu = await urlDe(r.arquivo); css = css.split(u[0]).join('url("' + nu + '")'); } }
    return css;
  }

  // ── montar a página ────────────────────────────────────────
  const PONTE = `<script>(function(){var P=window.parent;function m(t,a){try{P.postMessage({lab:'console',tipo:t,msg:Array.prototype.map.call(a,function(x){try{return typeof x==='object'?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(' ')},'*')}catch(e){}}
['log','info','warn','error'].forEach(function(t){var o=console[t];console[t]=function(){m(t,arguments);o.apply(console,arguments)}});
window.addEventListener('error',function(e){m('error',[e.message+(e.filename?' ('+e.filename.slice(-40)+':'+e.lineno+')':'')])});
window.addEventListener('unhandledrejection',function(e){m('error',['Promessa: '+(e.reason&&e.reason.message||e.reason)])});
window.process=window.process||{env:{NODE_ENV:'development'}};window.global=window.global||window;})();<\/script>`;

  async function montarPagina() {
    feitos = {}; fazendo = new Set(); precisaTailwind = 0; log = [];
    urls.forEach((u) => URL.revokeObjectURL(u)); urls = [];
    versaoReact = Lab.versaoDe('react');
    const fs = Lab.arquivos();
    let html;
    if (/\.html?$/i.test(entrada)) html = fs[entrada];
    else {
      html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><div id="app"></div><script type="module" src="./' + entrada.split('/').pop() + '"><\/script></body></html>';
      log.push('📄 Página criada para rodar ' + entrada);
    }
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const base = /\.html?$/i.test(entrada) ? entrada : entrada;

    for (const s of [...doc.querySelectorAll('script[src]')]) {
      const r = Lab.resolver(base, s.getAttribute('src'));
      if (!r.arquivo) continue;
      const ehModulo = s.type === 'module' || /\.(tsx?|jsx|mjs)$/i.test(r.arquivo) || /^\s*(import|export)\s/m.test(fs[r.arquivo] || '');
      if (ehModulo) { s.type = 'module'; s.src = await urlDe(r.arquivo); }
      else { let c = fs[r.arquivo] || ''; if (op.converter && temJSX(c)) { try { c = (await pegarConversor())(c, r.arquivo.replace(/\.js$/, '.jsx')); } catch (e) {} } s.src = blobURL(c, 'text/javascript'); }
    }
    for (const s of [...doc.querySelectorAll('script:not([src])')]) {
      if (s.type === 'module') s.textContent = await reescreverImports(base, s.textContent);
      if (s.type === 'text/babel') precisaBabelInline = true;
    }
    for (const l of [...doc.querySelectorAll('link[href]')]) {
      const rel = (l.getAttribute('rel') || '').toLowerCase();
      if (rel === 'manifest' || rel === 'modulepreload' || rel === 'preload') { l.remove(); continue; }
      const r = Lab.resolver(base, l.getAttribute('href'));
      if (rel.includes('stylesheet') && r.arquivo && !Lab.ehBinario(fs[r.arquivo])) {
        const st = doc.createElement('style'); const css = fs[r.arquivo];
        if (ehTailwindCSS(css)) st.type = 'text/tailwindcss';
        st.textContent = await prepararCSS(r.arquivo, css); l.replaceWith(st);
      } else if (r.arquivo) l.setAttribute('href', await urlDe(r.arquivo));
    }
    for (const el of [...doc.querySelectorAll('img[src],source[src],audio[src],video[src],link[rel~="icon"][href]')]) {
      const at = el.hasAttribute('src') ? 'src' : 'href';
      const r = Lab.resolver(base, el.getAttribute(at)); if (r.arquivo) el.setAttribute(at, await urlDe(r.arquivo));
    }
    for (const st of [...doc.querySelectorAll('style')]) if (ehTailwindCSS(st.textContent)) { st.type = 'text/tailwindcss'; precisaTailwind = Math.max(precisaTailwind, /@import\s+["']tailwindcss/.test(st.textContent) ? 4 : 3); st.textContent = st.textContent.replace(/@import\s+["']tailwindcss[^;]*;/g, ''); }

    // arquivos soltos que você escolheu para juntar
    for (const p of extras) {
      const t = fs[p]; if (Lab.ehBinario(t)) continue;
      if (/\.css$/i.test(p)) { const st = doc.createElement('style'); st.textContent = await prepararCSS(p, t); doc.head.appendChild(st); }
      else if (/\.(m?js|jsx|tsx?)$/i.test(p)) { const sc = doc.createElement('script'); if (/^\s*(import|export)\s/m.test(t) || /\.(tsx?|jsx)$/i.test(p)) { sc.type = 'module'; sc.src = await urlDe(p); } else sc.src = blobURL(t, 'text/javascript'); doc.body.appendChild(sc); }
      else if (/\.html?$/i.test(p)) { const corpo = new DOMParser().parseFromString(t, 'text/html').body; doc.body.insertAdjacentHTML('beforeend', corpo.innerHTML); }
      log.push('➕ Juntado: ' + p);
    }

    // Tailwind: pelo CSS, pelo package.json, ou pelas classes da página
    if (op.tailwind) {
      const v = Lab.versaoDe('tailwindcss') || Lab.versaoDe('@tailwindcss/vite');
      if (v) precisaTailwind = Math.max(precisaTailwind, /^4/.test(v) ? 4 : 3);
      if (!precisaTailwind && (doc.querySelectorAll('[class*="px-"],[class*="flex"],[class*="text-"],[class*="bg-"]').length > 4 || /className=["'][^"']*\b(px|py|mt|mb|bg|text|flex|grid)-/.test(Object.values(fs).filter((x) => typeof x === 'string').join('').slice(0, 2e6)))) precisaTailwind = 3;
      if (precisaTailwind && !/tailwindcss\.com|@tailwindcss\/browser/.test(html)) {
        const s = doc.createElement('script'); s.src = precisaTailwind === 4 ? CDN.tw4 : CDN.tw3; doc.head.insertBefore(s, doc.head.firstChild);
        log.push('🎨 Tailwind v' + precisaTailwind + ' pelo CDN');
      }
    }
    if (precisaBabelInline && !/babel/.test(html)) { const s = doc.createElement('script'); s.src = CDN.babel; doc.head.appendChild(s); log.push('🔧 Babel para <script type="text/babel">'); }
    precisaBabelInline = false;
    if (/fetch\(\s*[`'"]\/api\//.test(Object.values(fs).filter((x) => typeof x === 'string').join('').slice(0, 3e6))) log.push('ℹ️ O app chama o servidor (/api). Na prévia isso não responde — para testar com servidor use o Servidorzinho no PC.');
    doc.head.insertAdjacentHTML('afterbegin', PONTE);
    log.unshift('✅ Página montada: ' + Object.keys(feitos).length + ' arquivo(s) do projeto ligados' + (extras.length ? ' + ' + extras.length + ' juntado(s)' : ''));
    return '<!doctype html>\n' + doc.documentElement.outerHTML;
  }
  let precisaBabelInline = false;

  // ── tela ───────────────────────────────────────────────────
  function candidatos() {
    const ps = Lab.lista();
    const htmls = ps.filter((p) => /\.html?$/i.test(p) && !/node_modules/.test(p));
    const mains = ps.filter((p) => /(^|\/)(main|index|app)\.(tsx|jsx|ts|js|mjs)$/i.test(p) && !/node_modules|server|electron|api\//i.test(p));
    return htmls.concat(mains);
  }

  function tela() {
    const el = $('#panel-previa'); if (!el) return;
    const ps = Lab.lista();
    const cs = candidatos();
    if (!entrada || !ps.includes(entrada)) entrada = cs[0] || '';
    el.innerHTML = `
      <div class="lab-topo"><h2>🧪 Prévia</h2>
        <p class="lab-mut">Escolha a página. Ela junta sozinha o CSS, o JS, as imagens e os módulos que a página usa. JSX/TSX são convertidos e os pacotes vêm pelo CDN.</p></div>
      ${ps.length ? '' : '<p class="lab-aviso">Importe um projeto primeiro, ou cole um código em "✍️ Colar código".</p>'}
      <div class="lab-linha">
        <select id="pv-entrada" class="lab-busca" style="flex:1;min-width:200px">${cs.map((p) => `<option ${p === entrada ? 'selected' : ''} value="${E(p)}">${E(p)}</option>`).join('') || '<option value="">(nenhuma página no projeto)</option>'}</select>
        <button class="btn btn-primary" onclick="LabPrevia.rodar()">▶ Rodar</button>
      </div>
      <div class="lab-linha">
        <label class="lab-op"><input type="checkbox" id="pv-tw" ${op.tailwind ? 'checked' : ''}> 🎨 Tailwind automático</label>
        <label class="lab-op"><input type="checkbox" id="pv-cv" ${op.converter ? 'checked' : ''}> ⚛️ Converter JSX/TS</label>
        <label class="lab-op"><input type="checkbox" id="pv-cdn" ${op.cdn ? 'checked' : ''}> 📦 Pacotes pelo CDN</label>
      </div>
      <details class="lab-det"><summary>➕ Juntar arquivos soltos (${extras.length} escolhido${extras.length === 1 ? '' : 's'})</summary>
        <p class="lab-mut">Para ver juntos pedaços que não se chamam: um .html + um .css + um .js…</p>
        <input class="lab-busca" id="pv-busca-extra" placeholder="🔎 procurar…">
        <div class="lab-lista" id="pv-extras" style="max-height:220px"></div>
      </details>
      <details class="lab-det"><summary>✍️ Colar código (ver na hora, sem projeto)</summary>
        <textarea id="pv-colar" class="lab-area" placeholder="Cole aqui um HTML completo (ou só um pedaço)…"></textarea>
        <button class="btn btn-secondary" onclick="LabPrevia.rodarColado()">▶ Rodar o colado</button>
      </details>
      <div class="lab-linha">
        <button class="lab-chip ${largura === 'cel' ? 'on' : ''}" onclick="LabPrevia.largura('cel')">📱 Celular</button>
        <button class="lab-chip ${largura === 'largo' ? 'on' : ''}" onclick="LabPrevia.largura('largo')">💻 Largo</button>
        <button class="lab-chip" onclick="LabPrevia.telaCheia()">↗ Abrir em tela própria</button>
        <button class="lab-chip" onclick="LabPrevia.baixarMontado()">⬇ Baixar a página montada</button>
      </div>
      <div class="lab-moldura ${largura}"><iframe id="pv-quadro" title="Prévia"></iframe></div>
      <h3 class="lab-h3">🖥️ Console da prévia</h3>
      <div id="pv-console" class="lab-console"><span class="lab-mut">(aparece aqui o que a página escrever, e os erros)</span></div>
      <details class="lab-det" open><summary>🧾 O que eu fiz para a página rodar</summary><ul id="pv-log" class="lab-ul"></ul></details>`;
    $('#pv-entrada').onchange = (e) => { entrada = e.target.value; };
    $('#pv-tw').onchange = (e) => { op.tailwind = e.target.checked; };
    $('#pv-cv').onchange = (e) => { op.converter = e.target.checked; };
    $('#pv-cdn').onchange = (e) => { op.cdn = e.target.checked; };
    $('#pv-busca-extra').oninput = () => listarExtras();
    listarExtras(); mostrarLog(); mostrarConsole();
  }
  function listarExtras() {
    const f = ($('#pv-busca-extra') || {}).value || '';
    const ps = Lab.lista().filter((p) => /\.(html?|css|m?js|jsx|tsx?)$/i.test(p) && (!f || p.toLowerCase().includes(f.toLowerCase()))).slice(0, 300);
    $('#pv-extras').innerHTML = ps.map((p) => `<label class="lab-item"><span><input type="checkbox" ${extras.includes(p) ? 'checked' : ''} data-p="${E(p)}"> ${E(p)}</span></label>`).join('');
    $('#pv-extras').querySelectorAll('input').forEach((c) => (c.onchange = () => { const p = c.dataset.p; extras = c.checked ? extras.concat(p) : extras.filter((x) => x !== p); }));
  }
  function mostrarLog() { const ul = $('#pv-log'); if (ul) ul.innerHTML = log.map((l) => '<li>' + E(l) + '</li>').join('') || '<li class="lab-mut">(ainda não rodou)</li>'; }
  function mostrarConsole() {
    const c = $('#pv-console'); if (!c) return;
    c.innerHTML = consoleLinhas.length ? consoleLinhas.slice(-200).map((l) => `<div class="lc-${l.tipo}">${l.tipo === 'error' ? '❌' : l.tipo === 'warn' ? '⚠️' : '›'} ${E(l.msg)}</div>`).join('') : '<span class="lab-mut">(aparece aqui o que a página escrever, e os erros)</span>';
    c.scrollTop = c.scrollHeight;
  }

  let ultimo = '';
  async function rodar() {
    if (!entrada) { Lab.aviso('Escolha uma página', 'warning'); return; }
    consoleLinhas = []; mostrarConsole();
    try { ultimo = await montarPagina(); }
    catch (e) { log.push('❌ ' + e.message); mostrarLog(); return; }
    $('#pv-quadro').srcdoc = ultimo;
    mostrarLog();
  }
  function rodarColado() {
    const t = $('#pv-colar').value; if (!t.trim()) return;
    consoleLinhas = []; mostrarConsole();
    const ehPagina = /<html|<body|<head/i.test(t);
    ultimo = ehPagina ? t.replace(/<head[^>]*>/i, (m) => m + PONTE) : '<!doctype html><html><head><meta charset="utf-8">' + PONTE + (op.tailwind && /class=["'][^"']*\b(px|py|flex|bg|text)-/.test(t) ? '<script src="' + CDN.tw3 + '"><\/script>' : '') + '</head><body>' + t + '</body></html>';
    log = ['✍️ Código colado' + (ehPagina ? '' : ' (coloquei dentro de uma página)')]; mostrarLog();
    $('#pv-quadro').srcdoc = ultimo;
  }
  function telaCheia() { if (!ultimo) return; const u = URL.createObjectURL(new Blob([ultimo], { type: 'text/html' })); window.open(u, '_blank'); }
  function baixarMontado() { if (!ultimo) { Lab.aviso('Rode primeiro', 'warning'); return; } Lab.baixar(new Blob([ultimo], { type: 'text/html' }), 'previa-' + (entrada.split('/').pop() || 'pagina').replace(/\.[^.]+$/, '') + '.html'); Lab.aviso('Atenção: os endereços "blob:" só valem enquanto o Laboratório está aberto', 'info'); }
  function definirLargura(l) { largura = l; const m = document.querySelector('.lab-moldura'); if (m) m.className = 'lab-moldura ' + l; document.querySelectorAll('#panel-previa .lab-chip').forEach((b) => b.classList.toggle('on', (l === 'cel' && /Celular/.test(b.textContent)) || (l === 'largo' && /Largo/.test(b.textContent)))); }

  window.addEventListener('message', (e) => { if (e.data && e.data.lab === 'console') { consoleLinhas.push({ tipo: e.data.tipo, msg: e.data.msg }); mostrarConsole(); } });
  window.addEventListener('shell:navigate', (e) => { if (e.detail && e.detail.moduleId === 'previa') tela(); });

  function abrir(p) { entrada = p; tela(); rodar(); }
  return { tela, rodar, rodarColado, abrir, largura: definirLargura, telaCheia, baixarMontado, _montar: montarPagina };
})();
