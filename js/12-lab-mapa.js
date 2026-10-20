/* =========================================================================
   LABORATÓRIO — 12-lab-mapa.js · 🗺️ MAPA DE LIGAÇÕES
   Escolhe um arquivo e vê: o que ele USA, quem USA ELE e os pacotes de fora.
   📦 Extrair = o arquivo + tudo o que ele precisa, num zip (para guardar a
   lógica boa e levar para outro projeto). Mapa mental em Mermaid (.md).
   ========================================================================= */
window.LabMapa = (function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const E = (s) => Lab.esc(s);
  let escolhido = '';
  let filtro = '';

  const ICONE = { html: '🌐', htm: '🌐', css: '🎨', js: '📜', mjs: '📜', cjs: '📜', jsx: '⚛️', tsx: '⚛️', ts: '📘', json: '🧾', md: '📝', png: '🖼️', jpg: '🖼️', jpeg: '🖼️', svg: '🖼️', gif: '🖼️', webp: '🖼️', ico: '🖼️' };
  const ic = (p) => ICONE[Lab.tipo(p)] || '📄';

  function tela() {
    const el = $('#panel-mapa'); if (!el) return;
    const fs = Lab.lista();
    if (!fs.length) { el.innerHTML = '<div class="card"><div class="card-title">🗺️ Mapa de ligações</div><p class="lab-mut">Importe um projeto primeiro (📦 Importar).</p></div>'; return; }
    const m = Lab.mapa();
    const soltos = fs.filter((p) => !(m.usa[p] || []).length && !(m.usadoPor[p] || []).length && /\.(html?|jsx?|tsx?|mjs|css)$/i.test(p));
    const maisUsados = fs.filter((p) => (m.usadoPor[p] || []).length).sort((a, b) => m.usadoPor[b].length - m.usadoPor[a].length).slice(0, 8);
    const comFalta = Object.keys(m.faltando);
    el.innerHTML = `
      <div class="lab-topo"><h2>🗺️ Mapa de ligações</h2>
        <p class="lab-mut">Toque num arquivo para ver <b>o que ele usa</b> e <b>quem usa ele</b>. Depois extraia o pedaço com tudo que ele precisa.</p></div>
      <div class="lab-cards">
        <div class="lab-num"><b>${fs.length}</b><span>arquivos</span></div>
        <div class="lab-num"><b>${Object.keys(m.pacotes).length}</b><span>pacotes de fora</span></div>
        <div class="lab-num"><b>${soltos.length}</b><span>soltos (ninguém chama)</span></div>
        <div class="lab-num ${comFalta.length ? 'ruim' : ''}"><b>${comFalta.length}</b><span>chamam o que não existe</span></div>
      </div>
      <div class="lab-linha">
        <button class="btn btn-secondary" onclick="LabMapa.mermaid()">🧠 Baixar mapa mental (.md)</button>
        <button class="btn btn-secondary" onclick="LabMapa.relatorio()">📋 Relatório das ligações (.md)</button>
      </div>
      ${maisUsados.length ? '<h3 class="lab-h3">⭐ Mais usados (peças centrais)</h3><div class="lab-chips">' + maisUsados.map((p) => `<button class="lab-chip" onclick="LabMapa.ver('${encodeURIComponent(p)}')">${ic(p)} ${E(p.split('/').pop())} <small>${m.usadoPor[p].length}×</small></button>`).join('') + '</div>' : ''}
      ${comFalta.length ? '<details class="lab-det"><summary>⚠️ Chamam arquivo que não está no projeto (' + comFalta.length + ')</summary><ul>' + comFalta.slice(0, 40).map((p) => `<li><a href="#" onclick="LabMapa.ver('${encodeURIComponent(p)}');return false">${E(p)}</a> → <code>${E(m.faltando[p].join(', '))}</code></li>`).join('') + '</ul></details>' : ''}
      <div class="lab-grade">
        <div class="lab-coluna">
          <input class="lab-busca" id="mapa-busca" placeholder="🔎 procurar arquivo…" value="${E(filtro)}">
          <div id="mapa-lista" class="lab-lista"></div>
        </div>
        <div class="lab-coluna" id="mapa-detalhe"><p class="lab-mut">⬅️ Escolha um arquivo.</p></div>
      </div>`;
    $('#mapa-busca').oninput = (e) => { filtro = e.target.value; listar(); };
    listar();
    if (escolhido && fs.includes(escolhido)) detalhe(escolhido);
  }

  function listar() {
    const m = Lab.mapa();
    const f = filtro.toLowerCase();
    const fs = Lab.lista().filter((p) => !f || p.toLowerCase().includes(f)).slice(0, 400);
    $('#mapa-lista').innerHTML = fs.map((p) => `<button class="lab-item ${p === escolhido ? 'on' : ''}" onclick="LabMapa.ver('${encodeURIComponent(p)}')"><span>${ic(p)} ${E(p)}</span><small>→${(m.usa[p] || []).length} ←${(m.usadoPor[p] || []).length}</small></button>`).join('') || '<p class="lab-mut">Nada encontrado.</p>';
  }

  function detalhe(p) {
    escolhido = p;
    const m = Lab.mapa();
    const refs = Lab.referencias(p);
    const tudo = Lab.comTudoQuePrecisa(p);
    const pacs = refs.filter((r) => r.pacote);
    const falta = refs.filter((r) => r.faltando);
    const link = (q) => `<li><a href="#" onclick="LabMapa.ver('${encodeURIComponent(q)}');return false">${ic(q)} ${E(q)}</a></li>`;
    const podePrevia = /\.(html?|jsx?|tsx?|mjs)$/i.test(p);
    $('#mapa-detalhe').innerHTML = `
      <h3 class="lab-h3">${ic(p)} ${E(p)}</h3>
      <div class="lab-linha">
        <button class="btn btn-primary" onclick="LabMapa.extrair()">📦 Extrair com tudo que precisa (${tudo.arquivos.length} arquivo${tudo.arquivos.length > 1 ? 's' : ''})</button>
        ${podePrevia ? '<button class="btn btn-secondary" onclick="LabMapa.previa()">🧪 Ver na prévia</button>' : ''}
        <button class="btn btn-secondary" onclick="LabMapa.verCodigo()">👁️ Ver código</button>
        ${/\.html?$/i.test(p) ? '<button class="btn btn-secondary" onclick="LabMapa.desmontar()">🔪 Desmontar</button>' : ''}
      </div>
      <h4>➡️ Usa (${(m.usa[p] || []).length})</h4><ul class="lab-ul">${(m.usa[p] || []).map(link).join('') || '<li class="lab-mut">nada do projeto</li>'}</ul>
      <h4>⬅️ É usado por (${(m.usadoPor[p] || []).length})</h4><ul class="lab-ul">${(m.usadoPor[p] || []).map(link).join('') || '<li class="lab-mut">ninguém — é ponta (página inicial, ou pedaço solto)</li>'}</ul>
      <h4>📦 Pacotes de fora (${pacs.length})</h4><ul class="lab-ul">${pacs.map((r) => `<li><code>${E(r.spec)}</code> ${Lab.versaoDe(r.pacote) ? '<small>v' + E(Lab.versaoDe(r.pacote)) + '</small>' : ''} <button class="lab-mini" onclick="LabMapa.pesquisar('${E(r.pacote)}')">🔎 pesquisar / CDN</button></li>`).join('') || '<li class="lab-mut">nenhum</li>'}</ul>
      ${falta.length ? '<h4>⚠️ Chama o que não existe</h4><ul class="lab-ul">' + falta.map((r) => `<li><code>${E(r.spec)}</code></li>`).join('') + '</ul>' : ''}
      <h4>🌳 Árvore (o que vai junto ao extrair)</h4><pre class="lab-pre">${E(arvore(p))}</pre>`;
    listar();
    if (window.matchMedia('(max-width: 760px)').matches) $('#mapa-detalhe').scrollIntoView({ behavior: 'smooth' });
  }

  function arvore(p, nivel, vistos) {
    nivel = nivel || 0; vistos = vistos || new Set();
    const pre = '  '.repeat(nivel) + (nivel ? '└ ' : '');
    if (vistos.has(p)) return pre + p.split('/').pop() + '  (já listado)\n';
    vistos.add(p);
    let s = pre + p + '\n';
    if (nivel > 12) return s;
    for (const q of Lab.mapa().usa[p] || []) s += arvore(q, nivel + 1, vistos);
    return s;
  }

  async function extrair() {
    const p = escolhido; if (!p) return;
    const tudo = Lab.comTudoQuePrecisa(p);
    const z = new JSZip();
    const fs = Lab.arquivos(), bin = Lab.binarios();
    for (const q of tudo.arquivos) { if (q in bin) z.file(q, bin[q]); else if (!Lab.ehBinario(fs[q])) z.file(q, fs[q]); }
    const pk = tudo.pacotes.map((n) => '- `' + n + '`' + (Lab.versaoDe(n) ? ' v' + Lab.versaoDe(n) : '') + ' — CDN: https://esm.sh/' + n + (Lab.versaoDe(n) ? '@' + Lab.versaoDe(n) : '')).join('\n');
    z.file('LEIA-ESTE-PEDACO.md', '# Pedaço extraído: ' + p + '\n\nTirado do projeto **' + (Shell.getState('projectName') || '') + '** em ' + new Date().toLocaleString('pt-BR') + ' pelo Laboratório.\n\n## Arquivos (' + tudo.arquivos.length + ')\n' + tudo.arquivos.map((q) => '- ' + q).join('\n') + '\n\n## Pacotes de fora que ele usa (' + tudo.pacotes.length + ')\n' + (pk || '_nenhum_') + '\n\n## Árvore\n```\n' + arvore(p) + '```\n');
    const blob = await z.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    Lab.baixar(blob, 'pedaco-' + p.split('/').pop().replace(/\.[^.]+$/, '') + '.zip');
    Lab.aviso('📦 Extraído: ' + tudo.arquivos.length + ' arquivo(s) + ' + tudo.pacotes.length + ' pacote(s) anotados', 'success');
  }

  function mermaid() {
    const m = Lab.mapa();
    const ids = {}; let n = 0; const id = (p) => (ids[p] = ids[p] || 'n' + (++n));
    const L = ['# 🧠 Mapa mental do projeto: ' + (Shell.getState('projectName') || ''), '', 'Abra num visualizador de Mermaid (ex.: Mini SK, GitHub, mermaid.live).', '', '```mermaid', 'graph LR'];
    for (const [p, alvos] of Object.entries(m.usa)) for (const q of alvos) L.push(`  ${id(p)}["${p.split('/').pop().replace(/"/g, '')}"] --> ${id(q)}["${q.split('/').pop().replace(/"/g, '')}"]`);
    for (const [pac, quem] of Object.entries(m.pacotes)) for (const q of quem.slice(0, 6)) L.push(`  ${id(q)}["${q.split('/').pop().replace(/"/g, '')}"] -.-> ${id('pkg:' + pac)}(("📦 ${pac.replace(/"/g, '')}"))`);
    L.push('```', '');
    Lab.baixar(new Blob([L.join('\n')], { type: 'text/markdown;charset=utf-8' }), 'mapa-mental.md');
  }

  function relatorio() {
    const m = Lab.mapa();
    const L = ['# 🗺️ Ligações do projeto: ' + (Shell.getState('projectName') || ''), '', 'Gerado pelo Laboratório em ' + new Date().toLocaleString('pt-BR'), ''];
    L.push('## 📦 Pacotes de fora', '', '| Pacote | Versão | Usado em |', '|---|---|---|');
    for (const [pac, quem] of Object.entries(m.pacotes).sort((a, b) => b[1].length - a[1].length)) L.push('| `' + pac + '` | ' + (Lab.versaoDe(pac) || '—') + ' | ' + quem.length + ' arquivo(s) |');
    L.push('', '## 📄 Cada arquivo', '');
    for (const p of Lab.lista()) {
      const u = m.usa[p] || [], up = m.usadoPor[p] || [];
      if (!u.length && !up.length) continue;
      L.push('### ' + p, '- usa: ' + (u.join(', ') || '—'), '- é usado por: ' + (up.join(', ') || '—'), '');
    }
    if (Object.keys(m.faltando).length) { L.push('## ⚠️ Chamam o que não existe', ''); for (const [p, s] of Object.entries(m.faltando)) L.push('- ' + p + ' → ' + s.join(', ')); }
    Lab.baixar(new Blob([L.join('\n')], { type: 'text/markdown;charset=utf-8' }), 'ligacoes.md');
  }

  function verCodigo() {
    const t = Lab.arquivos()[escolhido];
    Shell.openModal ? Shell.openModal('👁️ ' + escolhido, '<pre class="lab-pre" style="max-height:70vh">' + E(Lab.ehBinario(t) ? '(arquivo binário)' : t) + '</pre>') : alert(t);
  }
  function desmontar() { if (window.LabDesmontar) { Shell.navigate('desmontar'); LabDesmontar.carregar(escolhido, Lab.arquivos()[escolhido]); } }
  function previa() { if (window.LabPrevia) { Shell.navigate('previa'); LabPrevia.abrir(escolhido); } }
  function pesquisar(pac) { Shell.navigate('terminal'); if (typeof Terminal !== 'undefined') { Terminal.init(); setTimeout(() => Terminal.runCmd('info ' + pac), 1400); } }

  function ver(pEnc) { const p = decodeURIComponent(pEnc); detalhe(p); }

  window.addEventListener('shell:navigate', (e) => { if (e.detail && e.detail.moduleId === 'mapa') { Lab.limparCache(); tela(); } });
  return { tela, ver, extrair, mermaid, relatorio, verCodigo, previa, pesquisar, desmontar };
})();
