/* =========================================================================
   LABORATÓRIO — 15-lab-comparar.js · ⚖️ COMPARAR A × B
   3 jeitos:
     📁 Dois arquivos do projeto importado
     ✍️ Colar dois códigos
     📦 Projeto importado × outro projeto (zip / tar.gz): quais arquivos
        só existem num, quais mudaram, e o que mudou em cada um
   Mostra linha por linha: ➕ verde (entrou), ➖ vermelho (saiu).
   📄 Baixar as diferenças em .md — pronto para levar para a IA ("mastigado").
   ========================================================================= */
window.LabComparar = (function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const E = (s) => Lab.esc(s);
  let modo = 'arquivos', ignorarEspacos = true;
  let projB = null, nomeB = '';           // { caminho: texto }
  let ultimo = null;                       // { nomeA, nomeB, partes }

  // ── diferença linha a linha (Myers) ───────────────────────
  function diff(a, b) {
    const norm = (l) => (ignorarEspacos ? l.replace(/\s+/g, ' ').trim() : l);
    const A = a.split('\n'), B = b.split('\n');
    const na = A.map(norm), nb = B.map(norm);
    // corta o começo e o fim iguais (deixa rápido em arquivos grandes)
    let ini = 0; while (ini < na.length && ini < nb.length && na[ini] === nb[ini]) ini += 1;
    let fa = na.length, fb = nb.length; while (fa > ini && fb > ini && na[fa - 1] === nb[fb - 1]) { fa -= 1; fb -= 1; }
    const X = na.slice(ini, fa), Y = nb.slice(ini, fb);
    const N = X.length, M = Y.length, MAX = N + M;
    const ops = [];
    if (MAX > 40000) return { muitoGrande: true };
    const v = new Int32Array(2 * MAX + 2); const trilha = [];
    let fim = -1;
    for (let d = 0; d <= MAX; d += 1) {
      trilha.push(v.slice());
      for (let k = -d; k <= d; k += 2) {
        let x = (k === -d || (k !== d && v[MAX + k - 1] < v[MAX + k + 1])) ? v[MAX + k + 1] : v[MAX + k - 1] + 1;
        let y = x - k;
        while (x < N && y < M && X[x] === Y[y]) { x += 1; y += 1; }
        v[MAX + k] = x;
        if (x >= N && y >= M) { fim = d; break; }
      }
      if (fim >= 0) break;
      if (d > 4000) return { muitoDiferente: true };
    }
    // volta pela trilha montando as operações
    let x = N, y = M;
    for (let d = fim; d > 0; d -= 1) {
      const vv = trilha[d]; const k = x - y;
      const kAnt = (k === -d || (k !== d && vv[MAX + k - 1] < vv[MAX + k + 1])) ? k + 1 : k - 1;
      const xAnt = vv[MAX + kAnt], yAnt = xAnt - kAnt;
      while (x > xAnt && y > yAnt) { ops.push(['=', ini + x - 1, ini + y - 1]); x -= 1; y -= 1; }
      if (x === xAnt) ops.push(['+', -1, ini + y - 1]); else ops.push(['-', ini + x - 1, -1]);
      x = xAnt; y = yAnt;
    }
    while (x > 0 && y > 0) { ops.push(['=', ini + x - 1, ini + y - 1]); x -= 1; y -= 1; }
    ops.reverse();
    const linhas = [];
    for (let i = 0; i < ini; i += 1) linhas.push({ t: '=', a: i + 1, b: i + 1, s: A[i] });
    for (const [t, i, j] of ops) linhas.push(t === '+' ? { t, b: j + 1, s: B[j] } : t === '-' ? { t, a: i + 1, s: A[i] } : { t, a: i + 1, b: j + 1, s: B[j] });
    for (let i = fa, j = fb; i < A.length; i += 1, j += 1) linhas.push({ t: '=', a: i + 1, b: j + 1, s: A[i] });
    return { linhas, mais: linhas.filter((l) => l.t === '+').length, menos: linhas.filter((l) => l.t === '-').length };
  }

  // só mostra os trechos que mudaram (com 3 linhas de contexto)
  function trechos(linhas, ctx) {
    ctx = ctx == null ? 3 : ctx;
    const marca = linhas.map((l) => l.t !== '=');
    const mostrar = new Array(linhas.length).fill(false);
    marca.forEach((m, i) => { if (m) for (let j = Math.max(0, i - ctx); j <= Math.min(linhas.length - 1, i + ctx); j += 1) mostrar[j] = true; });
    const out = []; let grupo = null;
    linhas.forEach((l, i) => { if (mostrar[i]) { if (!grupo) { grupo = []; out.push(grupo); } grupo.push(l); } else grupo = null; });
    return out;
  }

  function htmlDiff(r) {
    if (r.muitoGrande) return '<p class="lab-aviso">Arquivos grandes demais para comparar linha a linha aqui.</p>';
    if (r.muitoDiferente) return '<p class="lab-aviso">São tão diferentes que comparar linha a linha não ajuda: praticamente outro arquivo.</p>';
    if (!r.mais && !r.menos) return '<p class="lab-ok">✅ Iguais' + (ignorarEspacos ? ' (sem contar espaços)' : '') + '.</p>';
    const gs = trechos(r.linhas);
    return '<p><b class="cmp-mais">➕ ' + r.mais + ' linha(s) entraram</b> · <b class="cmp-menos">➖ ' + r.menos + ' saíram</b></p>' +
      gs.map((g) => '<div class="cmp-bloco"><div class="cmp-onde">linha ' + (g[0].a || g[0].b) + '</div>' + g.map((l) => '<div class="cmp-l cmp-' + (l.t === '+' ? 'mais' : l.t === '-' ? 'menos' : 'igual') + '"><span class="cmp-n">' + (l.t === '+' ? '' : l.a) + '</span><span class="cmp-n">' + (l.t === '-' ? '' : l.b) + '</span><span class="cmp-s">' + (l.t === '+' ? '+ ' : l.t === '-' ? '− ' : '  ') + E(l.s) + '</span></div>').join('') + '</div>').join('');
  }
  function mdDiff(nomeA, nomeB2, r) {
    if (!r || !r.linhas) return '';
    const L = ['### ' + nomeA + '  →  ' + nomeB2, '', '➕ ' + r.mais + ' entraram · ➖ ' + r.menos + ' saíram', '', '```diff'];
    for (const g of trechos(r.linhas)) { L.push('@@ linha ' + (g[0].a || g[0].b) + ' @@'); for (const l of g) L.push((l.t === '+' ? '+' : l.t === '-' ? '-' : ' ') + l.s); }
    L.push('```', '');
    return L.join('\n');
  }

  // ── telas ──────────────────────────────────────────────────
  function tela() {
    const el = $('#panel-comparar'); if (!el) return;
    el.innerHTML = `
      <div class="lab-topo"><h2>⚖️ Comparar A × B</h2>
        <p class="lab-mut">Veja exatamente o que mudou entre duas versões. Verde = entrou · vermelho = saiu. Depois baixe as diferenças em .md para levar para a IA.</p></div>
      <div class="lab-linha">
        <button class="lab-chip ${modo === 'arquivos' ? 'on' : ''}" onclick="LabComparar.modo('arquivos')">📁 Dois arquivos</button>
        <button class="lab-chip ${modo === 'colar' ? 'on' : ''}" onclick="LabComparar.modo('colar')">✍️ Colar dois códigos</button>
        <button class="lab-chip ${modo === 'projetos' ? 'on' : ''}" onclick="LabComparar.modo('projetos')">📦 Dois projetos</button>
      </div>
      <label class="lab-op"><input type="checkbox" id="cmp-esp" ${ignorarEspacos ? 'checked' : ''}> Não contar diferença só de espaço</label>
      <div id="cmp-entrada"></div>
      <div id="cmp-resultado"></div>`;
    $('#cmp-esp').onchange = (e) => { ignorarEspacos = e.target.checked; };
    entrada();
  }

  function opcoes(sel) { return Lab.lista().filter((p) => !Lab.ehBinario(Lab.arquivos()[p])).map((p) => `<option ${p === sel ? 'selected' : ''} value="${E(p)}">${E(p)}</option>`).join(''); }

  function entrada() {
    const el = $('#cmp-entrada');
    if (modo === 'arquivos') {
      if (!Lab.lista().length) { el.innerHTML = '<p class="lab-aviso">Importe um projeto primeiro (📦 Importar), ou use "✍️ Colar dois códigos".</p>'; return; }
      el.innerHTML = `<label class="lab-mut">Versão A (antiga)</label><select id="cmp-a" class="lab-busca">${opcoes()}</select>
        <label class="lab-mut">Versão B (nova)</label><select id="cmp-b" class="lab-busca">${opcoes(Lab.lista()[1])}</select>
        <div class="lab-linha"><button class="btn btn-primary" onclick="LabComparar.arquivos()">⚖️ Comparar</button></div>`;
    } else if (modo === 'colar') {
      el.innerHTML = `<label class="lab-mut">Código A (antigo)</label><textarea id="cmp-ta" class="lab-area" placeholder="Cole o código A…"></textarea>
        <label class="lab-mut">Código B (novo)</label><textarea id="cmp-tb" class="lab-area" placeholder="Cole o código B…"></textarea>
        <div class="lab-linha"><button class="btn btn-primary" onclick="LabComparar.colados()">⚖️ Comparar</button></div>`;
    } else {
      el.innerHTML = `<p class="lab-mut">A = o projeto importado (<b>${E(Shell.getState('projectName') || 'nenhum')}</b>). B = escolha outro projeto (.zip ou .tar.gz):</p>
        <div class="lab-linha"><button class="btn btn-secondary" onclick="document.getElementById('cmp-arqB').click()">📂 Escolher o projeto B</button><span class="lab-mut" id="cmp-nomeB">${E(nomeB || 'nenhum escolhido')}</span></div>
        <input type="file" id="cmp-arqB" hidden accept=".zip,.tar,.gz,.tgz,.taz">
        <div class="lab-linha"><button class="btn btn-primary" onclick="LabComparar.projetos()">⚖️ Comparar os projetos</button></div>`;
      $('#cmp-arqB').onchange = async (e) => {
        const f = e.target.files[0]; e.target.value = ''; if (!f) return;
        $('#cmp-nomeB').textContent = '⏳ Abrindo ' + f.name + '…';
        try {
          const z = window.AbrirTar && AbrirTar.ehTar(f.name) ? await AbrirTar.abrir(f) : await JSZip.loadAsync(f);
          projB = {};
          for (const n of Object.keys(z.files)) { const e2 = z.files[n]; if (e2.dir || /(^|\/)(node_modules|\.git)\//.test(n)) continue; if (/\.(html?|css|m?js|cjs|jsx|tsx?|json|md|txt|ya?ml|svg|xml|py|sh|bat|toml|env\.example)$/i.test(n)) projB[n] = await e2.async('string'); else projB[n] = null; }
          nomeB = f.name; $('#cmp-nomeB').textContent = '✅ ' + f.name + ' (' + Object.keys(projB).length + ' arquivos)';
        } catch (er) { $('#cmp-nomeB').textContent = '❌ Não abri: ' + er.message; }
      };
    }
  }

  function mostrar(nomeA, nomeB2, r) {
    ultimo = { partes: [{ nomeA, nomeB: nomeB2, r }] };
    $('#cmp-resultado').innerHTML = '<div class="lab-linha"><button class="btn btn-secondary" onclick="LabComparar.baixarMD()">📄 Baixar as diferenças (.md)</button><button class="btn btn-secondary" onclick="LabComparar.copiarMD()">📋 Copiar para a IA</button></div>' +
      '<h3 class="lab-h3">' + E(nomeA) + ' → ' + E(nomeB2) + '</h3>' + htmlDiff(r);
  }
  function arquivos() {
    const a = $('#cmp-a').value, b = $('#cmp-b').value;
    if (a === b) { Lab.aviso('Escolha dois arquivos diferentes', 'warning'); return; }
    mostrar(a, b, diff(Lab.arquivos()[a] || '', Lab.arquivos()[b] || ''));
  }
  function colados() { mostrar('Código A', 'Código B', diff($('#cmp-ta').value, $('#cmp-tb').value)); }

  // dois projetos: tira a pasta de cima (ex.: "projeto-v2/") para casar os caminhos
  function semTopo(lista) {
    const ps = lista.filter(Boolean); if (!ps.length) return (p) => p;
    const t = ps[0].split('/')[0];
    return ps.length > 1 && ps.every((p) => p.startsWith(t + '/')) ? (p) => p.slice(t.length + 1) : (p) => p;
  }
  function projetos() {
    if (!projB) { Lab.aviso('Escolha o projeto B primeiro', 'warning'); return; }
    const fa = Lab.arquivos(); const ta = semTopo(Object.keys(fa)), tb = semTopo(Object.keys(projB));
    const A = {}, B = {};
    for (const [p, t] of Object.entries(fa)) A[ta(p)] = Lab.ehBinario(t) ? null : t;
    for (const [p, t] of Object.entries(projB)) B[tb(p)] = t;
    const todos = [...new Set(Object.keys(A).concat(Object.keys(B)))].sort();
    const soA = todos.filter((p) => !(p in B)), soB = todos.filter((p) => !(p in A));
    const mudou = [], iguais = [], naoDeu = [];
    const partes = [];
    for (const p of todos.filter((x) => x in A && x in B)) {
      if (A[p] == null || B[p] == null) { naoDeu.push(p); continue; }
      const r = diff(A[p], B[p]);
      if (r.mais || r.menos || r.muitoGrande || r.muitoDiferente) { mudou.push({ p, r }); partes.push({ nomeA: p, nomeB: p, r }); } else iguais.push(p);
    }
    ultimo = { partes, soA, soB, iguais: iguais.length, naoDeu, nomeA: Shell.getState('projectName') || 'A', nomeB };
    $('#cmp-resultado').innerHTML = `
      <div class="lab-cards">
        <div class="lab-num"><b>${mudou.length}</b><span>mudaram</span></div>
        <div class="lab-num"><b>${soB.length}</b><span>só no B (novos)</span></div>
        <div class="lab-num"><b>${soA.length}</b><span>só no A (sumiram)</span></div>
        <div class="lab-num"><b>${iguais.length}</b><span>iguais</span></div>
      </div>
      <div class="lab-linha"><button class="btn btn-secondary" onclick="LabComparar.baixarMD()">📄 Baixar o relatório (.md)</button><button class="btn btn-secondary" onclick="LabComparar.copiarMD()">📋 Copiar para a IA</button></div>
      ${mudou.length ? '<h3 class="lab-h3">✏️ Mudaram</h3>' + mudou.map((m, i) => `<details class="lab-det"><summary>${E(m.p)} <small>${m.r.mais != null ? '➕' + m.r.mais + ' ➖' + m.r.menos : ''}</small></summary><div id="cmp-d${i}"></div></details>`).join('') : ''}
      ${soB.length ? '<details class="lab-det"><summary>🆕 Só no B (' + soB.length + ')</summary><ul class="lab-ul">' + soB.slice(0, 200).map((p) => '<li>' + E(p) + '</li>').join('') + '</ul></details>' : ''}
      ${soA.length ? '<details class="lab-det"><summary>🗑️ Só no A (' + soA.length + ')</summary><ul class="lab-ul">' + soA.slice(0, 200).map((p) => '<li>' + E(p) + '</li>').join('') + '</ul></details>' : ''}
      ${naoDeu.length ? '<details class="lab-det"><summary>🖼️ Não dá para comparar o texto (imagens e outros binários: ' + naoDeu.length + ')</summary><ul class="lab-ul">' + naoDeu.slice(0, 200).map((p) => '<li>' + E(p) + '</li>').join('') + '</ul></details>' : ''}`;
    mudou.forEach((m, i) => { const d = document.querySelector('#cmp-d' + i).parentElement; d.addEventListener('toggle', () => { if (d.open && !d.dataset.ok) { d.dataset.ok = 1; document.querySelector('#cmp-d' + i).innerHTML = htmlDiff(m.r); } }); });
  }

  function textoMD() {
    if (!ultimo) return '';
    const L = ['# ⚖️ Comparação — ' + new Date().toLocaleString('pt-BR'), ''];
    if (ultimo.soA) {
      L.push('**A:** ' + ultimo.nomeA + ' · **B:** ' + ultimo.nomeB, '', '- Mudaram: ' + ultimo.partes.length + ' · Só no B: ' + ultimo.soB.length + ' · Só no A: ' + ultimo.soA.length + ' · Iguais: ' + ultimo.iguais + ' · Binários (não comparados): ' + ultimo.naoDeu.length, '');
      if (ultimo.soB.length) L.push('## 🆕 Só no B', '', ...ultimo.soB.map((p) => '- ' + p), '');
      if (ultimo.soA.length) L.push('## 🗑️ Só no A', '', ...ultimo.soA.map((p) => '- ' + p), '');
      L.push('## ✏️ O que mudou', '');
    }
    for (const pt of ultimo.partes) L.push(pt.r.linhas ? mdDiff(pt.nomeA, pt.nomeB, pt.r) : '### ' + pt.nomeA + '\n\n(grande ou diferente demais para mostrar linha a linha)\n');
    return L.join('\n');
  }
  function baixarMD() { if (!ultimo) return; Lab.baixar(new Blob([textoMD()], { type: 'text/markdown;charset=utf-8' }), 'comparacao.md'); }
  function copiarMD() { if (!ultimo) return; navigator.clipboard.writeText(textoMD()).then(() => Lab.aviso('📋 Copiado', 'success'), () => Lab.aviso('Não consegui copiar; use o Baixar', 'warning')); }

  window.addEventListener('shell:navigate', (e) => { if (e.detail && e.detail.moduleId === 'comparar') tela(); });
  return { tela, modo: (m) => { modo = m; tela(); }, arquivos, colados, projetos, baixarMD, copiarMD, _diff: diff };
})();
