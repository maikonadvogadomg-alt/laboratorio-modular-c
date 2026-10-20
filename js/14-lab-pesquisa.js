/* =========================================================================
   LABORATÓRIO — 14-lab-pesquisa.js · 🔎 PESQUISA DE VERDADE NO TERMINAL
   Comandos novos (precisam de internet; usam os sites públicos do npm e do jsDelivr):
     pesquisar <palavras>     → acha pacotes (também: npm search)
     info <pacote>            → versão, tamanho, licença, downloads, dependências (também: npm view)
     cdn <pacote>             → como usar SEM instalar (jsDelivr / esm.sh / unpkg)
     comparar <a> <b> [c]     → lado a lado: tamanho, downloads, dependências, licença
     alternativas <pacote>    → outros pacotes que fazem a mesma coisa
     substitutos              → para CADA pacote do projeto importado: tem CDN? quanto pesa?
   ========================================================================= */
window.LabComandos = (function () {
  'use strict';
  const W = (t, c) => Terminal.writeLine(t, c);
  const kb = (n) => (n == null ? '—' : n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(0) + ' KB' : (n / 1048576).toFixed(1).replace('.', ',') + ' MB');
  const mil = (n) => (n == null ? '—' : Number(n).toLocaleString('pt-BR'));
  const cache = {};
  async function json(url) {
    if (cache[url]) return cache[url];
    const r = await fetch(url);
    if (r.status === 404) throw new Error('não existe');
    if (!r.ok) throw new Error('o site respondeu ' + r.status);
    return (cache[url] = await r.json());
  }
  const enc = (n) => n;   // @escopo/nome funciona direto nos endereços do npm
  const semInternet = (e) => W(/Failed to fetch|NetworkError|Load failed/i.test(e.message) ? '❌ Sem internet (ou o site bloqueou). A pesquisa precisa de internet.' : '❌ ' + e.message, 'err');

  async function dados(nome) {
    const [ult, dl] = await Promise.all([
      json('https://registry.npmjs.org/' + enc(nome) + '/latest'),
      json('https://api.npmjs.org/downloads/point/last-week/' + enc(nome)).catch(() => ({})),
    ]);
    return { nome, versao: ult.version, desc: ult.description || '', licenca: typeof ult.license === 'string' ? ult.license : (ult.license && ult.license.type) || '—', deps: Object.keys(ult.dependencies || {}), tamanho: ult.dist && ult.dist.unpackedSize, semana: dl.downloads, site: ult.homepage || '', palavras: ult.keywords || [], tipos: !!(ult.types || ult.typings) };
  }

  async function pesquisar(args) {
    const q = args.join(' ').trim();
    if (!q) { W('Use: pesquisar <palavras>   (ex.: pesquisar gerar pdf)', 'warn'); return; }
    W('🔎 Procurando "' + q + '" no npm…', 'info');
    try {
      const r = await json('https://registry.npmjs.org/-/v1/search?size=12&text=' + encodeURIComponent(q));
      if (!r.objects || !r.objects.length) { W('Nada encontrado.', 'warn'); return; }
      for (const o of r.objects) {
        const p = o.package; const sem = o.downloads && o.downloads.weekly;
        W('📦 ' + p.name + '@' + p.version + (sem != null ? '   ⬇ ' + mil(sem) + '/semana' : ''), 'success');
        if (p.description) W('    ' + p.description.slice(0, 140), 'dim');
      }
      W('💡 Detalhes: info <nome>   ·   comparar <a> <b>', 'dim');
    } catch (e) { semInternet(e); }
  }

  async function info(args) {
    const n = args[0]; if (!n) { W('Use: info <pacote>', 'warn'); return; }
    W('📋 ' + n + '…', 'info');
    try {
      const d = await dados(n);
      W('📦 ' + d.nome + '@' + d.versao, 'success');
      if (d.desc) W('    ' + d.desc, 'out');
      W('    Tamanho: ' + kb(d.tamanho) + '   ·   Downloads/semana: ' + mil(d.semana) + '   ·   Licença: ' + d.licenca, 'out');
      W('    Depende de ' + d.deps.length + ' pacote(s)' + (d.deps.length ? ': ' + d.deps.slice(0, 10).join(', ') + (d.deps.length > 10 ? '…' : '') : '') + (d.tipos ? '   ·   tem tipos (TS)' : ''), 'out');
      const v = window.Lab && Lab.versaoDe(n);
      if (v) W('    No seu projeto: v' + v + (v.split('.')[0] !== d.versao.split('.')[0] ? '  ⚠️ versão grande diferente da mais nova' : ''), 'highlight');
      if (d.site) W('    Site: ' + d.site, 'dim');
      W('💡 Usar sem instalar: cdn ' + n + '   ·   parecidos: alternativas ' + n, 'dim');
    } catch (e) { e.message === 'não existe' ? W('❌ O pacote "' + n + '" não existe no npm.', 'err') : semInternet(e); }
  }

  async function cdn(args) {
    const n = args[0]; if (!n) { W('Use: cdn <pacote>', 'warn'); return; }
    W('🌐 Endereços para usar ' + n + ' SEM instalar…', 'info');
    try {
      const vp = (window.Lab && Lab.versaoDe(n)) || '';
      const res = await json('https://data.jsdelivr.com/v1/packages/npm/' + n + '/resolved?specifier=' + encodeURIComponent(vp || 'latest'));
      const v = res.version;
      if (!v) { W('❌ O jsDelivr não achou esse pacote.', 'err'); return; }
      let ent = {};
      try { ent = (await json('https://data.jsdelivr.com/v1/packages/npm/' + n + '@' + v + '/entrypoints')).entrypoints || {}; } catch (e) {}
      W('✅ ' + n + '@' + v + (vp ? ' (a versão do seu projeto)' : ' (a mais nova)'), 'success');
      if (ent.js) W('  Script comum:  <script src="https://cdn.jsdelivr.net/npm/' + n + '@' + v + ent.js.file + '"></script>', 'highlight');
      if (ent.css) W('  Estilo:        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/' + n + '@' + v + ent.css.file + '">', 'highlight');
      W('  Módulo (import): import x from "https://esm.sh/' + n + '@' + v + '"', 'highlight');
      W('  unpkg:          https://unpkg.com/' + n + '@' + v + '/', 'dim');
      if (!ent.js && !ent.css) W('  ⚠️ Sem arquivo pronto para <script>. Use a forma "Módulo (import)" (esm.sh).', 'warn');
      W('💡 A 🧪 Prévia já faz isso sozinha para os pacotes do projeto.', 'dim');
    } catch (e) { semInternet(e); }
  }

  async function comparar(args) {
    const ns = args.filter(Boolean).slice(0, 4);
    if (ns.length < 2) { W('Use: comparar <a> <b>   (ex.: comparar axios ky)', 'warn'); return; }
    W('⚖️ Comparando ' + ns.join(' × ') + '…', 'info');
    try {
      const ds = await Promise.all(ns.map((n) => dados(n).catch(() => null)));
      const col = (s, w) => String(s).slice(0, w).padEnd(w);
      W(col('', 16) + ds.map((d, i) => col(d ? d.nome : ns[i] + ' (?)', 18)).join(''), 'highlight');
      const linha = (rot, f) => W(col(rot, 16) + ds.map((d) => col(d ? f(d) : '—', 18)).join(''), 'out');
      linha('Versão', (d) => d.versao);
      linha('Tamanho', (d) => kb(d.tamanho));
      linha('Downloads/sem', (d) => mil(d.semana));
      linha('Dependências', (d) => d.deps.length);
      linha('Licença', (d) => d.licenca);
      linha('Tipos (TS)', (d) => (d.tipos ? 'sim' : 'não'));
      const ok = ds.filter(Boolean);
      if (ok.length > 1) {
        const leve = ok.reduce((a, b) => ((a.tamanho || 9e15) <= (b.tamanho || 9e15) ? a : b));
        const pop = ok.reduce((a, b) => ((a.semana || 0) >= (b.semana || 0) ? a : b));
        W('', 'dim');
        W('🪶 Mais leve: ' + leve.nome + '   ·   👥 Mais usado: ' + pop.nome, 'success');
        W('💡 Mais leve = carrega mais rápido no celular. Mais usado = mais exemplos e menos bugs escondidos.', 'dim');
      }
    } catch (e) { semInternet(e); }
  }

  async function alternativas(args) {
    const n = args[0]; if (!n) { W('Use: alternativas <pacote>', 'warn'); return; }
    W('🔄 Procurando o que faz o mesmo que ' + n + '…', 'info');
    try {
      const d = await dados(n);
      const pal = d.palavras.filter((k) => k.length > 2).slice(0, 3);
      const q = pal.length ? pal.map((k) => 'keywords:' + k).join(' ') : (d.desc || n).split(/\s+/).slice(0, 5).join(' ');
      const r = await json('https://registry.npmjs.org/-/v1/search?size=15&text=' + encodeURIComponent(q));
      const outros = (r.objects || []).map((o) => o).filter((o) => o.package.name !== n).slice(0, 10);
      if (!outros.length) { W('Não achei parecidos.', 'warn'); return; }
      W('Parecidos com ' + n + (pal.length ? ' (pelas palavras: ' + pal.join(', ') + ')' : '') + ':', 'out');
      for (const o of outros) W('  📦 ' + o.package.name + (o.downloads && o.downloads.weekly != null ? '   ⬇ ' + mil(o.downloads.weekly) + '/sem' : '') + (o.package.description ? '  — ' + o.package.description.slice(0, 90) : ''), 'out');
      W('💡 Compare: comparar ' + n + ' ' + outros[0].package.name, 'dim');
    } catch (e) { e.message === 'não existe' ? W('❌ O pacote "' + n + '" não existe no npm.', 'err') : semInternet(e); }
  }

  async function substitutos() {
    if (!window.Lab) return;
    const pacs = Object.keys(Lab.mapa().pacotes);
    if (!pacs.length) { W('O projeto importado não usa pacotes de fora (ou ainda não importou).', 'warn'); return; }
    W('🧩 ' + pacs.length + ' pacotes que o código usa. Vendo se dá para usar pelo CDN…', 'info');
    let i = 0;
    for (const n of pacs.slice(0, 40)) {
      i += 1;
      try {
        const v = Lab.versaoDe(n);
        const res = await json('https://data.jsdelivr.com/v1/packages/npm/' + n + '/resolved?specifier=' + encodeURIComponent(v || 'latest'));
        W((res.version ? '  ✅ ' : '  ❌ ') + n + (res.version ? '@' + res.version + '  → esm.sh/' + n + '@' + res.version : '  (não achei no CDN)'), res.version ? 'success' : 'err');
      } catch (e) { if (i === 1) { semInternet(e); return; } W('  ❓ ' + n + ' (' + e.message + ')', 'warn'); }
    }
    if (pacs.length > 40) W('  … e mais ' + (pacs.length - 40), 'dim');
  }

  function ajuda() {
    W('', 'dim');
    W('🔎 PESQUISA DE VERDADE (precisa de internet):', 'info');
    W('  pesquisar <palavras>    acha pacotes no npm', 'out');
    W('  info <pacote>           versão, tamanho, downloads, licença', 'out');
    W('  cdn <pacote>            como usar SEM instalar', 'out');
    W('  comparar <a> <b>        lado a lado (até 4)', 'out');
    W('  alternativas <pacote>   outros que fazem o mesmo', 'out');
    W('  substitutos             os pacotes do projeto pelo CDN', 'out');
  }

  return { pesquisar, buscar: pesquisar, info, cdn, comparar, alternativas, substitutos, _ajuda: ajuda };
})();
