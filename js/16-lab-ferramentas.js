/* =========================================================================
   LABORATÓRIO — 16-lab-ferramentas.js · 🧰 SUAS FERRAMENTAS NUM LUGAR SÓ
   Cada ferramenta abre aqui dentro (e continua guardando os dados dela).
   Versão em módulos: os arquivos ficam em ferramentas/ e kits/.
   Versão de arquivo único: vão embutidos (window.LAB_EMBUTIDO).
   ========================================================================= */
window.LabFerramentas = (function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const E = (s) => Lab.esc(s);
  const FERR = [
    { id: 'faxina', icone: '🧹', nome: 'Faxina de Repetidos', arq: 'faxina.html', desc: 'Tira arquivos repetidos de zips e pastas, dá nome pelo título e separa por tipo.' },
    { id: 'arrumador', icone: '🗃', nome: 'Arrumador de Backups', arq: 'arrumador.html', desc: 'Junta backups (Jurídico, Colador, memórias do Mini SK), separa por projeto/data e exporta para o Mini SK.' },
    { id: 'numerador', icone: '🔢', nome: 'Numerador de Códigos', arq: 'numerador.html', desc: 'Junta muitos HTML, tira repetidos e parecidos, e baixa numerados (1.html, 2.html…) com índice.' },
    { id: 'preparador', icone: '🧰', nome: 'Preparador Universal', arq: 'preparador.html', desc: 'Prepara qualquer projeto (até monorepo do Replit) para .exe, APK e Netlify, com a chance de funcionar.' },
    { id: 'colador', icone: '🔗', nome: 'Colador de Links', arq: 'colador.html', desc: 'Guarda e abre os links das suas versões, com dois visores e exportar em MD.' },
  ];
  // os códigos que você trouxe (feitos pelo Claude antigo) — do jeito que vieram
  const SEUS = [
    { id: 'aistudio', icone: '🤖', nome: 'AI Code Studio', arq: 'ai-code-studio.html', desc: 'Chat com várias IAs (Gemini e outras), memória e editor de código. Coloque a sua chave nele.' },
    { id: 'projetolab', icone: '🧪', nome: 'Projeto Lab', arq: 'projeto-lab.html', desc: 'O laboratório antigo do Claude.' },
    { id: 'replicador', icone: '🧬', nome: 'Replicador de Projeto', arq: 'replicador.html', desc: 'Replica a estrutura de um projeto.' },
    { id: 'iara', icone: '🌊', nome: 'Iara Suite', arq: 'iara-suite.html', desc: 'Code Editor · APK Builder · Site Extractor.' },
    { id: 'juntador', icone: '🧷', nome: 'Juntador de Arquivos', arq: 'juntador.html', desc: 'Junta arquivos.' },
  ];
  const KITS = [
    { icone: '📦', nome: 'Kit do Replit', arq: 'kit-replit.cjs', desc: 'Roda dentro do Replit: relatório, pacote limpo, build. Shell: node kit-replit.cjs 5' },
    { icone: '🟢', nome: 'Servidorzinho', arq: 'servir.py', desc: 'Abre qualquer app montado como o Replit abre. PC ou Termux: python servir.py' },
    { icone: '📱', nome: 'Organizador do Celular', arq: 'organizar.py', desc: 'Termux: acha repetidos no celular inteiro; só apaga quando você escreve APAGAR.' },
    { icone: '🧩', nome: 'Juntar', arq: 'juntar.py', desc: 'Transforma um projeto em pedaços (index + css + js) num HTML único.' },
  ];
  let aberta = '';

  function bytes(arq) {
    const b64 = window.LAB_EMBUTIDO && window.LAB_EMBUTIDO[arq];
    if (!b64) return null;
    const bin = atob(b64); const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) u[i] = bin.charCodeAt(i);
    return u;
  }

  function tela() {
    const el = $('#panel-ferramentas'); if (!el) return;
    if (aberta) { abrirAqui(aberta); return; }
    el.innerHTML = `
      <div class="lab-topo"><h2>🧰 Ferramentas</h2>
        <p class="lab-mut">As suas ferramentas, todas aqui dentro. Cada uma guarda os próprios dados.</p></div>
      <div class="ferr-grade">${FERR.map(cartao).join('')}</div>
      <h3 class="lab-h3 ferr-grupo">📂 Seus códigos (do Claude antigo, do jeito que vieram)</h3>
      <div class="ferr-grade">${SEUS.map(cartao).join('')}</div>
      <h3 class="lab-h3">🧳 Kits para baixar (rodam fora do navegador)</h3>
      <div class="ferr-kits">${KITS.map((k) => `<div class="ferr-kit"><span class="ferr-ic">${k.icone}</span><div><b>${E(k.nome)}</b> <code>${E(k.arq)}</code><br><small class="lab-mut">${E(k.desc)}</small></div><button class="btn btn-secondary" onclick="LabFerramentas.kit('${k.arq}')">⬇ Baixar</button></div>`).join('')}</div>`;
  }

  const cartao = (f) => `<button class="ferr-card" onclick="LabFerramentas.abrir('${f.id}')"><span class="ferr-ic">${f.icone}</span><b>${E(f.nome)}</b><small>${E(f.desc)}</small></button>`;
  const achar = (id) => FERR.concat(SEUS).find((x) => x.id === id);
  function abrirAqui(id) {
    const f = achar(id); if (!f) return;
    aberta = id;
    const el = $('#panel-ferramentas');
    el.innerHTML = `<div class="lab-linha ferr-barra"><button class="btn btn-secondary" onclick="LabFerramentas.voltar()">← Ferramentas</button><b>${f.icone} ${E(f.nome)}</b><button class="lab-chip" style="margin-left:auto" onclick="LabFerramentas.telaPropria('${f.id}')">↗ Tela própria</button></div>
      <iframe id="ferr-quadro" class="ferr-quadro" title="${E(f.nome)}" allow="web-share; clipboard-read; clipboard-write"></iframe>`;
    const q = $('#ferr-quadro');
    const b = bytes(f.arq);
    if (b) q.srcdoc = new TextDecoder().decode(b); else q.src = 'ferramentas/' + f.arq;
  }
  function telaPropria(id) {
    const f = achar(id); const b = bytes(f.arq);
    window.open(b ? URL.createObjectURL(new Blob([b], { type: 'text/html' })) : 'ferramentas/' + f.arq, '_blank');
  }
  function kit(arq) {
    const b = bytes(arq);
    if (b) Lab.baixar(new Blob([b], { type: 'application/octet-stream' }), arq);
    else { const a = document.createElement('a'); a.href = 'kits/' + arq; a.download = arq; document.body.appendChild(a); a.click(); a.remove(); }
    Lab.aviso('⬇ ' + arq + ' (pasta Downloads)', 'success');
  }

  window.addEventListener('shell:navigate', (e) => { if (e.detail && e.detail.moduleId === 'ferramentas') tela(); });
  return { tela, abrir: abrirAqui, voltar: () => { aberta = ''; tela(); }, telaPropria, kit, _lista: FERR, _kits: KITS };
})();
