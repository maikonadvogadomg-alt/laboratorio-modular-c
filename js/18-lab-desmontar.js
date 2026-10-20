/* =========================================================================
   LABORATÓRIO — 18-lab-desmontar.js · 🔪 DESMONTAR HTML (para aprender)
   Pega um HTML completo e:
     👁 roda ao lado (com o console)
     🧩 mostra as partes: estilos, códigos, CADA FUNÇÃO (o que faz, quem ela
        chama, quem chama ela, o que usa), botões e ids da tela
     🎨 troca as cores na hora
     ✂️ pica em módulos (index + css + vários js) e TESTA se continua igual
     📋 gera o plano completo, "mastigado", para trazer para a IA / levar ao SK
     ⚠️ acha problemas: nome repetido (trava o app), botão chamando função que
        não existe, id que o código procura e a tela não tem, função gigante
   Usa o acorn (lib/acorn.min.js) para ler o JavaScript de verdade.
   ========================================================================= */
window.LabDesmontar = (function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const E = (s) => Lab.esc(s);
  let nome = '', original = '', atual = '', an = null, aba = 'partes', picado = null;

  // ── ponte do console (o que a página escreve aparece aqui) ──
  const PONTE = `<script>(function(){var P=window.parent;function m(t,a){try{P.postMessage({lab:'desmontar',tipo:t,msg:Array.prototype.map.call(a,function(x){try{return typeof x==='object'?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(' ')},'*')}catch(e){}}
['log','warn','error'].forEach(function(t){var o=console[t];console[t]=function(){m(t,arguments);o.apply(console,arguments)}});
window.addEventListener('error',function(e){m('error',[e.message+(e.lineno?' (linha '+e.lineno+')':'')])});
window.addEventListener('unhandledrejection',function(e){m('error',['Promessa: '+(e.reason&&e.reason.message||e.reason)])});})();<\/script>`;
  const comPonte = (h) => (/<head[^>]*>/i.test(h) ? h.replace(/<head[^>]*>/i, (m) => m + PONTE) : PONTE + h);

  // ── o que cada função FAZ (pelo que ela usa e pelo nome) ──
  const PISTAS = [
    [/\bfetch\(|XMLHttpRequest|axios\./, 'busca na internet/servidor'],
    [/localStorage|sessionStorage/, 'guarda/lê no aparelho (localStorage)'],
    [/indexedDB/, 'guarda/lê no banco do aparelho (IndexedDB)'],
    [/addEventListener|\.onclick\s*=|\.oninput\s*=|\.onchange\s*=/, 'liga botões/eventos'],
    [/innerHTML|insertAdjacentHTML|createElement|appendChild|textContent\s*=/, 'desenha/muda a tela'],
    [/createObjectURL|\.download\s*=|saveAs\(/, 'baixa arquivo'],
    [/navigator\.share/, 'compartilha (Enviar)'],
    [/navigator\.clipboard|execCommand\(['"]copy/, 'copia para a área de transferência'],
    [/speechSynthesis|SpeechSynthesisUtterance/, 'fala em voz alta'],
    [/SpeechRecognition|webkitSpeechRecognition/, 'escuta a voz (ditado)'],
    [/JSZip|\.generateAsync/, 'mexe com zip'],
    [/FileReader|\.arrayBuffer\(\)|\.text\(\)/, 'lê arquivo'],
    [/setInterval|setTimeout/, 'usa tempo (espera/repete)'],
    [/Math\.random/, 'sorteia'],
    [/JSON\.parse|JSON\.stringify/, 'converte dados (JSON)'],
    [/WebSocket/, 'conversa ao vivo (WebSocket)'],
    [/canvas|getContext\(/, 'desenha em canvas'],
    [/pdf|PDF/, 'mexe com PDF'],
  ];
  const PISTAS_NOME = [
    [/^(init|iniciar|start|boot|main|setup|comecar)/i, 'começa o app'],
    [/(render|desenhar|mostrar|exibir|atualizar|update|refresh|draw|pintar)/i, 'mostra/atualiza na tela'],
    [/(salvar|save|guardar|persist|gravar)/i, 'salva'],
    [/(carregar|load|^ler|read|restaurar|restore)/i, 'carrega'],
    [/(apagar|delete|remover|remove|excluir|limpar|clear)/i, 'apaga/limpa'],
    [/(exportar|export|baixar|download)/i, 'exporta/baixa'],
    [/(importar|import|abrir|open|upload)/i, 'importa/abre'],
    [/(validar|valid|check|verificar|conferir)/i, 'confere/valida'],
    [/(calc|calcular|somar|total|contar)/i, 'calcula'],
    [/(format|escape|^esc$|^escHtml|slug|normaliz)/i, 'arruma texto'],
    [/(toast|aviso|alert|notif)/i, 'mostra aviso'],
    [/(modal|dialog|popup|abrirJanela|fechar|close)/i, 'abre/fecha janela'],
    [/(api|chat|gemini|openai|claude|anthropic|groq|perguntar)/i, 'conversa com IA/API'],
    [/(IA|AI)(?![a-z])|^(ia|ai)[A-Z_]/, 'conversa com IA'],
  ];
  function explicar(nomeF, codigo) {
    const o = [];
    for (const [r, t] of PISTAS_NOME) if (r.test(nomeF)) { o.push(t); break; }
    for (const [r, t] of PISTAS) if (r.test(codigo) && !o.includes(t)) o.push(t);
    return o.slice(0, 4).join(' · ') || 'faz uma parte da lógica';
  }

  // ── ler o JavaScript com o acorn ──
  function lerJS(code, ehModulo) {
    const op = (tipo) => ({ ecmaVersion: 'latest', sourceType: tipo, locations: true, allowHashBang: true, allowReturnOutsideFunction: tipo === 'script' });
    const repetidos = [];
    let texto = code;
    for (let volta = 0; volta < 12; volta += 1) {
      try { const ast = window.acorn.parse(texto, op(ehModulo ? 'module' : 'script')); ast.repetidos = repetidos; return ast; }
      catch (e) {
        const m = /Identifier '([^']+)' has already been declared/.exec(e.message);
        if (m && e.pos != null && texto.slice(e.pos, e.pos + m[1].length) === m[1]) {
          // o mesmo nome declarado 2 vezes: anota o problema e "renomeia" só para conseguir ler o resto
          repetidos.push({ nome: m[1], linha: e.loc ? e.loc.line : 0 });
          texto = texto.slice(0, e.pos) + m[1].replace(/./, '_') + texto.slice(e.pos + 1);
          continue;
        }
        if (!ehModulo) { try { const ast = window.acorn.parse(texto, op('module')); ast.repetidos = repetidos; return ast; } catch (e2) {} }
        return { erro: e.message, repetidos };
      }
    }
    return { erro: 'muitos nomes repetidos', repetidos };
  }
  // biblioteca embutida (JSZip, jQuery…): linhas enormes / código "espremido"
  function ehBiblioteca(corpo) {
    const ls = corpo.split('\n'); const media = corpo.length / Math.max(1, ls.length);
    if (corpo.length > 15000 && (media > 300 || ls.length < 15)) return (corpo.slice(0, 800).match(/\b(JSZip|jQuery|React|Vue|pako|acorn|Chart|marked|pdfjs|Babel|highlight|Prism|CodeMirror|xterm|lodash|axios|moment|dayjs|Tesseract|mammoth|docx|html2canvas|jsPDF)\b/) || [])[1] || 'biblioteca';
    return '';
  }
  function nomesDoTopo(ast) {
    // o que cada comando do topo DECLARA (função, variável, classe)
    const out = [];
    for (const st of ast.body) {
      const item = { st, nomes: [], tipo: 'comando', lexico: (st.type === 'VariableDeclaration' && st.kind !== 'var') || st.type === 'ClassDeclaration' };
      if (st.type === 'FunctionDeclaration' && st.id) { item.nomes.push(st.id.name); item.tipo = 'função'; }
      else if (st.type === 'ClassDeclaration' && st.id) { item.nomes.push(st.id.name); item.tipo = 'classe'; }
      else if (st.type === 'VariableDeclaration') {
        for (const d of st.declarations) {
          if (d.id.type === 'Identifier') item.nomes.push(d.id.name);
          const init = d.init;
          if (init && /FunctionExpression|ArrowFunctionExpression/.test(init.type)) item.tipo = 'função';
          else if (init && init.type === 'CallExpression' && /FunctionExpression|ArrowFunctionExpression/.test((init.callee || {}).type)) item.tipo = 'módulo';
          else if (item.tipo !== 'função') item.tipo = st.kind === 'const' ? 'constante' : 'variável';
        }
      } else if ((st.type === 'ExportNamedDeclaration' || st.type === 'ExportDefaultDeclaration') && st.declaration) {
        const d = st.declaration;
        if (d.id) { item.nomes.push(d.id.name); item.tipo = d.type === 'FunctionDeclaration' ? 'função' : 'variável'; }
        else if (d.declarations) for (const x of d.declarations) if (x.id.type === 'Identifier') item.nomes.push(x.id.name);
      }
      out.push(item);
    }
    return out;
  }

  // ── a análise completa ──
  function analisar(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const linhaDe = (idx) => html.slice(0, idx).split('\n').length;
    const r = { tamanho: html.length, linhas: html.split('\n').length, estilos: [], scripts: [], externos: [], funcoes: [], declarados: {}, ids: [], cliques: [], cores: [], secoes: [], problemas: [], globais: [] };
    // estilos e scripts, com a linha onde começam no arquivo
    const reBloco = /<(style|script)\b([^>]*)>([\s\S]*?)<\/\1>/gi; let m;
    while ((m = reBloco.exec(html))) {
      const tag = m[1].toLowerCase(), attrs = m[2], corpo = m[3], linha = linhaDe(m.index);
      if (tag === 'style') r.estilos.push({ linha, tam: corpo.length, linhas: corpo.split('\n').length, corpo });
      else {
        const src = (attrs.match(/\bsrc\s*=\s*["']([^"']+)/i) || [])[1];
        const tipo = ((attrs.match(/\btype\s*=\s*["']([^"']+)/i) || [])[1] || '').toLowerCase();
        if (src) { r.externos.push({ tipo: 'script', url: src }); continue; }
        if (tipo && !/module|javascript|babel|jsx/.test(tipo)) continue;   // json, template etc.
        r.scripts.push({ linha, corpo, modulo: tipo === 'module', babel: /babel|jsx/.test(tipo), linhas: corpo.split('\n').length });
      }
    }
    for (const l of doc.querySelectorAll('link[rel~="stylesheet"][href]')) r.externos.push({ tipo: 'estilo', url: l.getAttribute('href') });

    // cada script: funções, quem chama quem, o que usa
    r.scripts.forEach((s, si) => {
      if (s.babel) { s.erro = 'JSX (React no navegador) — não li as funções'; return; }
      s.biblioteca = ehBiblioteca(s.corpo);
      if (s.biblioteca) return;                                   // não lista as funções de dentro de bibliotecas
      const ast = lerJS(s.corpo, s.modulo);
      for (const rp of ast.repetidos || []) r.problemas.push({ grave: true, principal: true, texto: '"' + rp.nome + '" foi declarado DUAS vezes (a 2ª na linha ' + (s.linha + rp.linha - 1) + '). Isso TRAVA o código inteiro ("already been declared") — nenhum botão funciona. Troque o nome de uma das duas.' });
      if (ast.erro) { s.erro = ast.erro; return; }
      s.topo = nomesDoTopo(ast);
      for (const it of s.topo) for (const n of it.nomes) (r.declarados[n] = r.declarados[n] || []).push({ script: si, linha: s.linha + it.st.loc.start.line - 1, tipo: it.tipo, lexico: it.lexico });
      // seções (comentários de título no topo: // ===== X =====, // ── X ──, /* ### X */)
      const reSec = /^[ \t]*(?:\/\/|\/\*+)\s*[=#─━\-*]{3,}\s*([^\n=#─━*\-][^\n]*?)\s*[=#─━\-*]*\s*(?:\*\/)?$/gm; let ms;
      while ((ms = reSec.exec(s.corpo))) { const t = ms[1].replace(/[=#─━*\-]+$/g, '').trim(); if (t.length > 2) r.secoes.push({ script: si, linha: s.linha + s.corpo.slice(0, ms.index).split('\n').length - 1, titulo: t }); }
      // funções (do topo e as de dentro dos "módulos")
      const funcs = [];
      window.acornWalk.full(ast, (node) => {
        let nomeF = null;
        if (node.type === 'FunctionDeclaration' && node.id) nomeF = node.id.name;
        else if (node.type === 'VariableDeclarator' && node.init && /FunctionExpression|ArrowFunctionExpression/.test(node.init.type) && node.id.type === 'Identifier') { nomeF = node.id.name; node = Object.assign({}, node.init, { loc: node.loc, start: node.start, end: node.end }); }
        else if ((node.type === 'Property' || node.type === 'MethodDefinition') && node.value && /FunctionExpression|ArrowFunctionExpression/.test(node.value.type) && node.key && (node.key.name || node.key.value)) { nomeF = String(node.key.name || node.key.value); node = Object.assign({}, node.value, { loc: node.loc, start: node.start, end: node.end }); }
        if (!nomeF) return;
        const codigo = s.corpo.slice(node.start, node.end);
        const chama = new Set();
        window.acornWalk.simple(node.body || node, { CallExpression(c) { if (c.callee.type === 'Identifier') chama.add(c.callee.name); else if (c.callee.type === 'MemberExpression' && c.callee.property && c.callee.property.name && c.callee.object.type === 'Identifier') chama.add(c.callee.object.name + '.' + c.callee.property.name); } });
        const ids = [...new Set([...codigo.matchAll(/getElementById\(\s*['"]([\w-]+)['"]|querySelector(?:All)?\(\s*['"]#([\w-]+)/g)].map((x) => x[1] || x[2]))];
        funcs.push({ nome: nomeF, script: si, ini: s.linha + node.loc.start.line - 1, fim: s.linha + node.loc.end.line - 1, linhas: node.loc.end.line - node.loc.start.line + 1, chama: [...chama], ids, faz: explicar(nomeF, codigo) });
      });
      r.funcoes.push(...funcs);
      // variáveis do topo usadas por várias funções = "estado global"
      for (const it of s.topo) if (/variável|constante/.test(it.tipo)) for (const n of it.nomes) r.globais.push({ nome: n, script: si, linha: s.linha + it.st.loc.start.line - 1, tipo: it.tipo });
    });
    // quem chama quem (só as funções que existem aqui)
    const nomes = new Set(r.funcoes.map((f) => f.nome));
    for (const f of r.funcoes) { f.chamaAqui = f.chama.filter((c) => nomes.has(c.split('.').pop()) && c !== f.nome).map((c) => c.split('.').pop()); f.chamadaPor = []; }
    for (const f of r.funcoes) for (const c of f.chamaAqui) for (const g of r.funcoes.filter((x) => x.nome === c)) if (!g.chamadaPor.includes(f.nome)) g.chamadaPor.push(f.nome);
    for (const g of r.globais) g.usadaPor = r.funcoes.filter((f) => new RegExp('\\b' + g.nome.replace(/\$/g, '\\$') + '\\b').test(r.scripts[f.script] ? r.scripts[f.script].corpo.split('\n').slice(f.ini - r.scripts[f.script].linha, f.fim - r.scripts[f.script].linha + 1).join('\n') : '')).map((f) => f.nome);

    // a tela: ids e botões (onclick="x()")
    r.ids = [...doc.querySelectorAll('[id]')].map((e) => e.id);
    for (const el of doc.querySelectorAll('*')) for (const at of el.getAttributeNames()) if (/^on/.test(at)) { const v = el.getAttribute(at); const fn = (v.match(/^\s*(?:return\s+)?([A-Za-z_$][\w$]*)(?:\.([A-Za-z_$][\w$]*))?\s*\(/) || []); r.cliques.push({ evento: at, codigo: v.slice(0, 80), fn: fn[1] || '', metodo: fn[2] || '', texto: (el.textContent || el.getAttribute('title') || el.tagName).trim().slice(0, 40) }); }

    // cores
    const css = r.estilos.map((x) => x.corpo).join('\n') + '\n' + [...doc.querySelectorAll('[style]')].map((e) => e.getAttribute('style')).join(';');
    const contagem = {};
    for (const c of css.match(/#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g) || []) { const k = c.toLowerCase(); contagem[k] = (contagem[k] || 0) + 1; }
    const vars = {}; for (const mv of css.matchAll(/(--[\w-]+)\s*:\s*([^;}{]+)/g)) vars[mv[1]] = mv[2].trim();
    r.cores = Object.entries(contagem).sort((a, b) => b[1] - a[1]).slice(0, 40).map(([c, n]) => ({ cor: c, vezes: n, vars: Object.keys(vars).filter((v) => vars[v].toLowerCase() === c) }));

    // problemas
    for (const [n, ds] of Object.entries(r.declarados)) {
      if (ds.length < 2 || ds.some((d) => r.scripts[d.script].modulo)) continue;
      if (ds.some((d) => d.lexico)) r.problemas.push({ grave: true, texto: '"' + n + '" foi declarado ' + ds.length + ' vezes (linhas ' + ds.map((d) => d.linha).join(', ') + ') e uma delas é let/const/class. Isso TRAVA o código ("already been declared"). Troque um dos nomes.' });
      else r.problemas.push({ grave: false, texto: '"' + n + '" existe ' + ds.length + ' vezes (linhas ' + ds.map((d) => d.linha).join(', ') + '). Não trava: vale a ÚLTIMA. Mas confunde — talvez uma das duas seja sobra antiga.' });
    }
    const existe = new Set(Object.keys(r.declarados).concat(r.funcoes.map((f) => f.nome)));
    const OK_GLOBAL = /^(if|for|while|switch|return|void|typeof|new|function|async|await|try|var|let|const|alert|confirm|prompt|console|document|window|location|history|event|this|setTimeout|setInterval|navigator|fetch|open|close|print|scrollTo|parent|top|self|globalThis|Number|String|JSON|Math|Object|Array|Date|encodeURIComponent|decodeURIComponent)$/;
    const leuTudo = r.scripts.every((s) => !s.erro || s.babel);
    if (leuTudo) for (const c of r.cliques) if (c.fn && !existe.has(c.fn) && !OK_GLOBAL.test(c.fn)) r.problemas.push({ grave: true, texto: 'O botão "' + c.texto + '" chama ' + c.fn + (c.metodo ? '.' + c.metodo : '') + '(), que não existe neste arquivo.' });
    const idsTela = new Set(r.ids);
    const faltaId = {}; for (const f of r.funcoes) for (const id of f.ids) if (!idsTela.has(id)) (faltaId[id] = faltaId[id] || []).push(f.nome);
    for (const [id, fs] of Object.entries(faltaId)) r.problemas.push({ grave: false, texto: 'O código procura o id "' + id + '" (em ' + [...new Set(fs)].slice(0, 3).join(', ') + '), mas a tela não tem esse id. Pode ser criado depois pelo código — ou pode ser um erro.' });
    for (const f of r.funcoes) if (f.linhas > 120) r.problemas.push({ grave: false, texto: 'A função ' + f.nome + ' tem ' + f.linhas + ' linhas (linha ' + f.ini + '). Grande demais para entender de uma vez — boa candidata a ser dividida.' });
    r.problemas.sort((a, b) => (b.principal ? 1 : 0) - (a.principal ? 1 : 0));
    for (const s of r.scripts) if (s.erro) r.problemas.push({ grave: !s.babel, texto: 'O código que começa na linha ' + s.linha + (s.babel ? ' é JSX (React no navegador).' : ' tem erro de escrita: ' + s.erro) });
    return r;
  }

  // ── PICAR em módulos ──
  const slug = (t) => (Lab && t ? t : 'parte').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 30) || 'parte';
  function picar(html) {
    const arquivos = {}; const relato = []; let nCss = 0, nJs = 0;
    const pad = (n) => String(n).padStart(2, '0');
    let saida = html.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi, (tudo, attrs, corpo) => {
      if (!corpo.trim()) return tudo;
      nCss += 1; const nomeArq = 'css/' + pad(nCss) + '-' + slug(nomeDoPedaco(corpo, 'estilo')) + '.css';
      arquivos[nomeArq] = corpo.replace(/^\n/, '');
      relato.push('🎨 ' + nomeArq + ' (' + corpo.split('\n').length + ' linhas)');
      return '<link rel="stylesheet" href="' + nomeArq + '">';
    });
    saida = saida.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (tudo, attrs, corpo) => {
      if (/\bsrc\s*=/.test(attrs) || !corpo.trim()) return tudo;
      const tipo = ((attrs.match(/\btype\s*=\s*["']([^"']+)/i) || [])[1] || '').toLowerCase();
      if (tipo && !/module|javascript/.test(tipo)) return tudo;            // json, babel, template: fica
      const modulo = tipo === 'module';
      const pedacos = modulo ? [{ titulo: nomeDoPedaco(corpo, ''), code: corpo }] : dividirScript(corpo);
      return pedacos.map((p) => {
        nJs += 1; const nomeArq = 'js/' + pad(nJs) + '-' + slug(p.titulo || ehBiblioteca(p.code) || 'codigo') + '.js';
        arquivos[nomeArq] = p.code.replace(/^\n/, '');
        relato.push('📜 ' + nomeArq + ' (' + p.code.split('\n').length + ' linhas' + (p.funcoes && p.funcoes.length ? ': ' + p.funcoes.slice(0, 6).join(', ') + (p.funcoes.length > 6 ? '…' : '') : '') + ')' + (modulo ? ' [módulo]' : '') + (ehBiblioteca(p.code) ? ' [📚 ' + ehBiblioteca(p.code) + ']' : '') + (p.aviso ? ' ⚠️ ' + p.aviso : ''));
        return '<script' + (modulo ? ' type="module"' : '') + ' src="' + nomeArq + '"><\/script>';
      }).join('\n');
    });
    arquivos['index.html'] = saida;
    return { arquivos, relato };
  }
  // divide um script grande pelos títulos de seção (só nos limites dos comandos do topo)
  function nomeDoPedaco(code, padrao) {
    const c = code.match(/^\s*\/\*\s*([\w./-]+\.(?:m?js|css))\s*\*\//);           // "/* js/10-ler.js */" (do juntar.py)
    if (c) return c[1].split('/').pop().replace(/\.(m?js|css)$/, '').replace(/^\d+[a-z]?-/, '');
    return padrao;
  }
  // divide um script grande SEM mudar o que ele faz:
  //  - as funções (function x(){}) já existem desde o começo no original ("hoisting") → vão nos primeiros arquivos
  //  - o resto (variáveis, módulos, comandos) vai depois, NA MESMA ORDEM
  function dividirScript(corpo) {
    if (corpo.split('\n').length < 150 || ehBiblioteca(corpo)) return [{ titulo: nomeDoPedaco(corpo, ''), code: corpo }];
    const ast = lerJS(corpo, false);
    if (ast.erro || (ast.repetidos && ast.repetidos.length)) return [{ titulo: nomeDoPedaco(corpo, ''), code: corpo, aviso: 'não dividi: o código tem erro de escrita' }];
    const topo = nomesDoTopo(ast);
    const estrito = ast.body[0] && ast.body[0].directive === 'use strict' ? "'use strict';\n" : '';
    // títulos de seção no topo (entre os comandos, não dentro de função)
    const titulos = []; const reSec = /^[ \t]*(?:\/\/|\/\*+)\s*[=#─━\-*]{3,}\s*([^\n=#─━*\-][^\n]*?)\s*[=#─━\-*]*\s*(?:\*\/)?$/gm; let ms;
    while ((ms = reSec.exec(corpo))) titulos.push({ pos: ms.index, titulo: ms[1].replace(/[=#─━*\-]+$/g, '').trim() });
    const secaoDe = (st) => { let t = ''; for (const x of titulos) { if (x.pos > st.start) break; const k = topo.findIndex((it) => it.st.start >= x.pos); if (k >= 0 && (k === 0 || x.pos >= topo[k - 1].st.end)) t = x.titulo; } return t; };
    // cada comando do topo com os comentários que vêm antes dele
    const pedaco = (k) => corpo.slice(k === 0 ? 0 : topo[k - 1].st.end, topo[k].st.end);
    const funcoes = [], resto = [];
    topo.forEach((it, k) => { if (k === 0 && estrito) return; (it.st.type === 'FunctionDeclaration' ? funcoes : resto).push({ k, it, secao: secaoDe(it.st), texto: pedaco(k) }); });
    const cauda = corpo.slice(topo.length ? topo[topo.length - 1].st.end : 0);
    // agrupa: por seção; se a seção for grande, a cada ~180 linhas
    function agrupar(lista, rotulo) {
      const grupos = []; let g = null;
      for (const x of lista) {
        const ln = x.texto.split('\n').length;
        if (!g || g.secao !== x.secao || g.linhas + ln > 180) { g = { secao: x.secao, linhas: 0, textos: [], nomes: [] }; grupos.push(g); }
        g.textos.push(x.texto); g.linhas += ln; g.nomes.push(...x.it.nomes);
      }
      return grupos.map((gr) => ({ titulo: gr.secao || (rotulo === 'funcoes' ? 'funcoes-' + (gr.nomes[0] || '') : 'inicio'), code: estrito + gr.textos.join('').replace(/^\n+/, '') + '\n', funcoes: gr.nomes }));
    }
    const out = agrupar(funcoes, 'funcoes').concat(agrupar(resto, 'resto'));
    if (cauda.trim() && out.length) out[out.length - 1].code += cauda;
    return out.length > 1 ? out : [{ titulo: nomeDoPedaco(corpo, ''), code: corpo }];
  }

  // ── rodar uma versão (original ou picada) e contar os erros ──
  function rodarEm(iframe, html, arquivos) {
    return new Promise((ok) => {
      const erros = []; const urls = [];
      const ouvir = (e) => { if (e.data && e.data.lab === 'desmontar' && e.source === iframe.contentWindow && e.data.tipo === 'error') erros.push(e.data.msg); };
      window.addEventListener('message', ouvir);
      let pagina = html;
      if (arquivos) {
        pagina = arquivos['index.html'];
        for (const [p, t] of Object.entries(arquivos)) {
          if (p === 'index.html') continue;
          const u = URL.createObjectURL(new Blob([t], { type: p.endsWith('.css') ? 'text/css' : 'text/javascript' })); urls.push(u);
          pagina = pagina.split('"' + p + '"').join('"' + u + '"');
        }
      }
      iframe.srcdoc = comPonte(pagina);
      setTimeout(() => { window.removeEventListener('message', ouvir); urls.forEach((u) => URL.revokeObjectURL(u)); ok(erros); }, 2500);
    });
  }

  // ── o plano "mastigado" ──
  function plano() {
    const r = an; const L = [];
    L.push('# 📋 Plano para entender e modularizar: ' + nome, '', '_Gerado pelo Laboratório em ' + new Date().toLocaleString('pt-BR') + ' — sem IA, lendo o código._', '');
    L.push('## 📊 Resumo', '', '| Item | Quantidade |', '|---|---|', '| Tamanho | ' + Math.round(r.tamanho / 1024) + ' KB · ' + r.linhas + ' linhas |', '| Blocos de estilo | ' + r.estilos.length + ' |', '| Blocos de código | ' + r.scripts.length + ' |', '| Funções | ' + r.funcoes.length + ' |', '| Botões/eventos na tela | ' + r.cliques.length + ' |', '| Cores diferentes | ' + r.cores.length + ' |', '| Bibliotecas de fora | ' + r.externos.length + ' |', '| Problemas | ' + r.problemas.length + ' (' + r.problemas.filter((p) => p.grave).length + ' graves) |', '');
    if (r.problemas.length) { L.push('## ⚠️ Problemas encontrados (resolver primeiro)', ''); for (const p of r.problemas) L.push('- ' + (p.grave ? '🔴 ' : '🟡 ') + p.texto); L.push(''); }
    if (r.externos.length) { L.push('## 🌐 Bibliotecas de fora (CDN)', ''); for (const x of r.externos) L.push('- ' + x.tipo + ': `' + x.url + '`'); L.push(''); }
    if (r.secoes.length) { L.push('## 🗂️ Seções que o próprio código marca', ''); for (const s of r.secoes) L.push('- linha ' + s.linha + ': **' + s.titulo + '**'); L.push(''); }
    L.push('## 🧩 Funções — o que cada uma faz', '', '| Função | Linhas | O que faz | Chama | É chamada por |', '|---|---|---|---|---|');
    for (const f of r.funcoes) L.push('| `' + f.nome + '` | ' + f.ini + '–' + f.fim + ' (' + f.linhas + ') | ' + f.faz + ' | ' + (f.chamaAqui.slice(0, 6).join(', ') || '—') + ' | ' + (f.chamadaPor.slice(0, 6).join(', ') || (r.cliques.some((c) => c.fn === f.nome) ? 'botão da tela' : '—')) + ' |');
    L.push('');
    if (r.cliques.length) { L.push('## 🖱️ Botões da tela → função', ''); for (const c of r.cliques.slice(0, 80)) L.push('- "' + c.texto + '" (' + c.evento + ') → `' + c.codigo + '`'); L.push(''); }
    const compartilhadas = r.globais.filter((g) => g.usadaPor && g.usadaPor.length > 1);
    if (compartilhadas.length) { L.push('## 🔗 Variáveis que várias funções usam (o "estado" do app)', '', 'Ao separar em módulos, essas precisam ficar num lugar que todos enxerguem (ex.: um arquivo `00-estado.js` carregado primeiro).', ''); for (const g of compartilhadas.slice(0, 40)) L.push('- `' + g.nome + '` (linha ' + g.linha + ') — usada por: ' + g.usadaPor.slice(0, 8).join(', ')); L.push(''); }
    if (picado) { L.push('## ✂️ Proposta de módulos (já feita pelo ✂️ Picar)', ''); for (const x of picado.relato) L.push('- ' + x); L.push('', picado.teste ? '**Teste:** ' + picado.teste : '', ''); }
    L.push('## 🛣️ Passo a passo', '', '1. Resolva os 🔴 problemas graves (eles travam o app).', '2. Use o **✂️ Picar** do Laboratório: ele separa estilos e códigos em arquivos, na mesma ordem (não muda o funcionamento) e testa.', '3. Abra a versão picada no Mini SK. Cada arquivo agora é pequeno: dá para ler e mexer um por vez.', '4. Para ir além (módulos "de verdade"), separe por assunto usando a tabela de funções acima: o que mexe na tela, o que salva, o que fala com a IA.', '5. Sempre teste depois de cada mudança (🧪 Prévia ou ⚖️ Comparar com a versão anterior).', '');
    L.push('## 🤖 Pedido pronto para a IA', '', '```', 'Tenho um app HTML chamado "' + nome + '" (' + r.linhas + ' linhas, ' + r.funcoes.length + ' funções). Segue o plano gerado pelo meu Laboratório.', 'Quero transformar em versão MODULAR (index.html + css/ + js/ numerados), sem mudar o que ele faz.', 'Regras: entregue os arquivos inteiros (nunca "troque este pedaço"), explique em português simples, e resolva primeiro os problemas marcados com 🔴.', '```', '');
    return L.join('\n');
  }

  // ── tela ──
  function tela() {
    const el = $('#panel-desmontar'); if (!el) return;
    const htmls = Lab.lista().filter((p) => /\.html?$/i.test(p));
    el.innerHTML = `
      <div class="lab-topo"><h2>🔪 Desmontar HTML</h2>
        <p class="lab-mut">Para <b>aprender</b> como um código funciona: veja cada parte, troque as cores, pique em módulos e gere o plano completo.</p></div>
      <div class="lab-linha">
        ${htmls.length ? `<select id="dm-proj" class="lab-busca" style="flex:1;min-width:180px"><option value="">— um HTML do projeto importado —</option>${htmls.map((p) => `<option value="${E(p)}">${E(p)}</option>`).join('')}</select>` : ''}
        <button class="btn btn-secondary" onclick="document.getElementById('dm-arq').click()">📂 Abrir um .html</button>
        <input type="file" id="dm-arq" accept=".html,.htm,text/html" hidden>
      </div>
      <details class="lab-det"><summary>✍️ Ou colar o código</summary><textarea id="dm-colar" class="lab-area" placeholder="Cole aqui um HTML completo…"></textarea><button class="btn btn-secondary" onclick="LabDesmontar.carregar('colado.html', document.getElementById('dm-colar').value)">🔪 Desmontar o colado</button></details>
      <div id="dm-corpo">${an ? '' : '<p class="lab-mut">Escolha um HTML para começar.</p>'}</div>`;
    if ($('#dm-proj')) $('#dm-proj').onchange = (e) => { const p = e.target.value; if (p) carregar(p, Lab.arquivos()[p]); };
    $('#dm-arq').onchange = async (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) carregar(f.name, await f.text()); };
    if (an) corpo();
  }

  function carregar(n, html) {
    if (!html || !html.trim()) { Lab.aviso('Está vazio', 'warning'); return; }
    if (!window.acorn) { Lab.aviso('Faltou o leitor de código (acorn).', 'error'); return; }
    nome = n; original = html; atual = html; picado = null;
    try { an = analisar(atual); } catch (e) { an = null; Lab.aviso('Não consegui analisar: ' + e.message, 'error'); return; }
    aba = 'partes'; corpo();
  }

  function corpo() {
    const r = an; const el = $('#dm-corpo'); if (!el || !r) return;
    const graves = r.problemas.filter((p) => p.grave).length;
    el.innerHTML = `
      <h3 class="lab-h3">🔪 ${E(nome)} <small class="lab-mut">${Math.round(r.tamanho / 1024)} KB · ${r.linhas} linhas</small></h3>
      <div class="lab-cards">
        <div class="lab-num"><b>${r.funcoes.length}</b><span>funções</span></div>
        <div class="lab-num"><b>${r.cliques.length}</b><span>botões/eventos</span></div>
        <div class="lab-num"><b>${r.cores.length}</b><span>cores</span></div>
        <div class="lab-num ${graves ? 'ruim' : ''}"><b>${r.problemas.length}</b><span>problemas${graves ? ' (' + graves + ' graves)' : ''}</span></div>
      </div>
      <div class="lab-linha">
        ${['partes:🧩 Partes', 'funcoes:⚙️ Funções', 'cores:🎨 Cores', 'problemas:⚠️ Problemas', 'picar:✂️ Picar', 'plano:📋 Plano'].map((x) => { const [k, t] = x.split(':'); return `<button class="lab-chip ${aba === k ? 'on' : ''}" onclick="LabDesmontar.aba('${k}')">${t}</button>`; }).join('')}
      </div>
      <div id="dm-aba"></div>
      <h3 class="lab-h3">👁 Rodando ${atual !== original ? '<small class="lab-mut">(com as suas mudanças)</small>' : ''}</h3>
      <div class="lab-linha"><button class="lab-chip" onclick="LabDesmontar.rodar()">▶ Rodar de novo</button><button class="lab-chip" onclick="LabDesmontar.baixarAtual()">⬇ Baixar este HTML${atual !== original ? ' (com mudanças)' : ''}</button>${atual !== original ? '<button class="lab-chip" onclick="LabDesmontar.desfazer()">↩ Voltar ao original</button>' : ''}</div>
      <div class="lab-moldura cel"><iframe id="dm-quadro" title="Rodando"></iframe></div>
      <div id="dm-console" class="lab-console"><span class="lab-mut">(o que a página escrever, e os erros)</span></div>`;
    mostrarAba(); rodar();
  }

  function mostrarAba() {
    const r = an; const el = $('#dm-aba'); if (!el) return;
    const fdesc = (f) => `<details class="lab-det"><summary><code>${E(f.nome)}</code> <small class="lab-mut">linhas ${f.ini}–${f.fim} · ${f.linhas}</small><br><small>${E(f.faz)}</small></summary>
        <ul class="lab-ul"><li>➡️ chama: ${f.chamaAqui.length ? f.chamaAqui.map((x) => '<code>' + E(x) + '</code>').join(', ') : '—'}</li>
        <li>⬅️ é chamada por: ${f.chamadaPor.length ? f.chamadaPor.map((x) => '<code>' + E(x) + '</code>').join(', ') : r.cliques.some((c) => c.fn === f.nome) ? 'um botão da tela' : '—'}</li>
        ${f.ids.length ? '<li>🖼️ mexe na tela em: ' + f.ids.map((x) => '#' + E(x)).join(', ') + '</li>' : ''}</ul>
        <button class="lab-mini" onclick="LabDesmontar.verFuncao(${r.funcoes.indexOf(f)})">👁️ ver o código dela</button></details>`;
    if (aba === 'partes') {
      el.innerHTML = `
        <h4>🎨 Estilos (${r.estilos.length})</h4><ul class="lab-ul">${r.estilos.map((s) => `<li>linha ${s.linha}: ${s.linhas} linhas de CSS</li>`).join('') || '<li class="lab-mut">nenhum</li>'}</ul>
        <h4>📜 Códigos (${r.scripts.length})</h4><ul class="lab-ul">${r.scripts.map((s) => `<li>linha ${s.linha}: ${s.linhas} linhas${s.modulo ? ' (módulo)' : ''}${s.babel ? ' (JSX)' : ''}${s.biblioteca ? ' — 📚 biblioteca embutida: ' + E(s.biblioteca) : ''}${s.erro ? ' — ⚠️ ' + E(s.erro) : ''}</li>`).join('') || '<li class="lab-mut">nenhum</li>'}</ul>
        ${r.secoes.length ? '<h4>🗂️ Seções que o código marca</h4><ul class="lab-ul">' + r.secoes.map((s) => '<li>linha ' + s.linha + ': <b>' + E(s.titulo) + '</b></li>').join('') + '</ul>' : ''}
        <h4>🌐 Bibliotecas de fora (${r.externos.length})</h4><ul class="lab-ul">${r.externos.map((x) => '<li>' + x.tipo + ': <code>' + E(x.url) + '</code></li>').join('') || '<li class="lab-mut">nenhuma</li>'}</ul>
        <h4>🖱️ Botões e eventos da tela (${r.cliques.length})</h4><ul class="lab-ul">${r.cliques.slice(0, 60).map((c) => '<li>"' + E(c.texto) + '" → <code>' + E(c.codigo) + '</code></li>').join('') || '<li class="lab-mut">nenhum no HTML (o código pode ligar os botões sozinho)</li>'}</ul>`;
    } else if (aba === 'funcoes') {
      el.innerHTML = `<input class="lab-busca" id="dm-busca" placeholder="🔎 procurar função…"><div id="dm-lista-f"></div>`;
      const listar = () => { const q = ($('#dm-busca').value || '').toLowerCase(); $('#dm-lista-f').innerHTML = r.funcoes.filter((f) => !q || f.nome.toLowerCase().includes(q) || f.faz.includes(q)).map(fdesc).join('') || '<p class="lab-mut">Nenhuma função encontrada.</p>'; };
      $('#dm-busca').oninput = listar; listar();
    } else if (aba === 'cores') {
      const hex = (c) => { if (c[0] === '#') { let h = c.slice(1, 7); if (h.length === 3) h = h.split('').map((x) => x + x).join(''); return '#' + h; } const n = c.match(/[\d.]+/g); if (!n || /hsl/.test(c)) return '#888888'; return '#' + n.slice(0, 3).map((x) => Math.round(+x).toString(16).padStart(2, '0')).join(''); };
      el.innerHTML = '<p class="lab-mut">Toque na bolinha e escolha outra cor: muda no código todo e você vê na hora, aqui embaixo.</p><div class="dm-cores">' + r.cores.map((c, i) => `<label class="dm-cor"><input type="color" value="${hex(c.cor)}" data-i="${i}"><span><code>${E(c.cor)}</code><small class="lab-mut"> · ${c.vezes}×${c.vars.length ? ' · ' + E(c.vars.join(', ')) : ''}</small></span></label>`).join('') + '</div>' + (r.cores.length ? '' : '<p class="lab-mut">Não achei cores no CSS.</p>');
      el.querySelectorAll('input[type=color]').forEach((inp) => (inp.onchange = () => trocarCor(+inp.dataset.i, inp.value)));
    } else if (aba === 'problemas') {
      el.innerHTML = r.problemas.length ? '<ul class="lab-ul">' + r.problemas.map((p) => '<li>' + (p.grave ? '🔴 ' : '🟡 ') + E(p.texto) + '</li>').join('') + '</ul>' : '<p class="lab-ok">✅ Não achei problemas.</p>';
    } else if (aba === 'picar') {
      el.innerHTML = `<p class="lab-mut">Separa os estilos e os códigos em arquivos (<code>css/</code> e <code>js/</code>), <b>na mesma ordem</b>. Códigos grandes são divididos pelas seções. Depois roda as duas versões e compara os erros.</p>
        <div class="lab-linha"><button class="btn btn-primary" onclick="LabDesmontar.fazerPicar()">✂️ Picar e testar</button></div><div id="dm-picado"></div>`;
      if (picado) mostrarPicado();
    } else if (aba === 'plano') {
      el.innerHTML = `<p class="lab-mut">O plano completo, para trazer para a IA ou levar para o SK. ${picado ? '' : '(Dica: faça o ✂️ Picar antes — aí o plano já inclui os módulos.)'}</p>
        <div class="lab-linha"><button class="btn btn-primary" onclick="LabDesmontar.baixarPlano()">📄 Baixar o plano (.md)</button><button class="btn btn-secondary" onclick="LabDesmontar.copiarPlano()">📋 Copiar para a IA</button></div>
        <pre class="lab-pre" style="white-space:pre-wrap;max-height:50vh">${E(plano())}</pre>`;
    }
  }

  function trocarCor(i, nova) {
    const c = an.cores[i]; if (!c) return;
    const re = new RegExp(c.cor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    atual = atual.replace(re, nova);
    c.cor = nova.toLowerCase();
    picado = null; rodar();
    Lab.aviso('🎨 Cor trocada em todo o código', 'success');
  }

  let consoleLinhas = [];
  function mostrarConsole() { const c = $('#dm-console'); if (!c) return; c.innerHTML = consoleLinhas.length ? consoleLinhas.slice(-150).map((l) => `<div class="lc-${l.tipo}">${l.tipo === 'error' ? '❌' : l.tipo === 'warn' ? '⚠️' : '›'} ${E(l.msg)}</div>`).join('') : '<span class="lab-mut">(o que a página escrever, e os erros)</span>'; c.scrollTop = c.scrollHeight; }
  function rodar() { const q = $('#dm-quadro'); if (!q) return; consoleLinhas = []; mostrarConsole(); q.srcdoc = comPonte(atual); }
  window.addEventListener('message', (e) => { const q = $('#dm-quadro'); if (e.data && e.data.lab === 'desmontar' && q && e.source === q.contentWindow) { consoleLinhas.push({ tipo: e.data.tipo, msg: e.data.msg }); mostrarConsole(); } });

  async function fazerPicar() {
    const out = $('#dm-picado'); out.innerHTML = '<p class="lab-mut">✂️ Picando e testando as duas versões… (uns segundos)</p>';
    picado = picar(atual);
    const q1 = document.createElement('iframe'), q2 = document.createElement('iframe');
    [q1, q2].forEach((q) => { q.style.cssText = 'position:absolute;left:-9999px;width:400px;height:600px'; document.body.appendChild(q); });
    const [e1, e2] = await Promise.all([rodarEm(q1, atual, null), rodarEm(q2, null, picado.arquivos)]);
    q1.remove(); q2.remove();
    const novos = e2.filter((x) => !e1.includes(x));
    picado.teste = novos.length ? '⚠️ a versão picada deu ' + novos.length + ' erro(s) que a original não dá' : '✅ a versão picada roda igual à original (' + e1.length + ' erro(s) que já existiam antes)';
    picado.errosNovos = novos;
    mostrarPicado();
  }
  function mostrarPicado() {
    const out = $('#dm-picado'); if (!out || !picado) return;
    out.innerHTML = `<p><b>${E(picado.teste)}</b></p>${picado.errosNovos && picado.errosNovos.length ? '<ul class="lab-ul">' + picado.errosNovos.map((x) => '<li class="lc-error">' + E(x) + '</li>').join('') + '</ul>' : ''}
      <h4>📁 Arquivos (${Object.keys(picado.arquivos).length})</h4><ul class="lab-ul"><li>🌐 index.html</li>${picado.relato.map((x) => '<li>' + E(x) + '</li>').join('')}</ul>
      <div class="lab-linha"><button class="btn btn-primary" onclick="LabDesmontar.baixarPicado()">⬇ Baixar a versão picada (.zip)</button><button class="btn btn-secondary" onclick="LabDesmontar.abrirComoProjeto()">🔬 Abrir no Laboratório como projeto</button></div>`;
  }
  async function baixarPicado() {
    const z = new JSZip(); const base = nome.replace(/\.html?$/i, '') + '-modular/';
    for (const [p, t] of Object.entries(picado.arquivos)) z.file(base + p, t);
    z.file(base + 'PLANO.md', plano());
    Lab.baixar(await z.generateAsync({ type: 'blob', compression: 'DEFLATE' }), nome.replace(/\.html?$/i, '') + '-modular.zip');
  }
  function abrirComoProjeto() {
    if (!confirm('Abrir a versão picada como o projeto do Laboratório? (o projeto importado agora sai da tela; ele não é apagado do seu aparelho)')) return;
    const fs = {}; for (const [p, t] of Object.entries(picado.arquivos)) fs[p] = t; fs['PLANO.md'] = plano();
    window.LabBin = {};
    Shell.setState('projectFiles', fs); Shell.setState('projectName', nome.replace(/\.html?$/i, '') + '-modular');
    Lab.limparCache();
    Lab.aviso('🔬 Pronto: veja no 🗺️ Mapa e na 🧪 Prévia', 'success');
    Shell.navigate('mapa');
  }
  function verFuncao(i) {
    const f = an.funcoes[i]; const s = an.scripts[f.script];
    const linhas = s.corpo.split('\n').slice(f.ini - s.linha, f.fim - s.linha + 1).join('\n');
    Shell.openModal('⚙️ ' + f.nome + ' — linhas ' + f.ini + '–' + f.fim, '<p>' + E(f.faz) + '</p><pre class="lab-pre" style="max-height:65vh">' + E(linhas) + '</pre>');
  }
  const baixarPlano = () => Lab.baixar(new Blob([plano()], { type: 'text/markdown;charset=utf-8' }), 'PLANO-' + nome.replace(/\.html?$/i, '') + '.md');
  const copiarPlano = () => navigator.clipboard.writeText(plano()).then(() => Lab.aviso('📋 Plano copiado', 'success'), () => Lab.aviso('Não consegui copiar; use o Baixar', 'warning'));
  const baixarAtual = () => Lab.baixar(new Blob([atual], { type: 'text/html' }), nome.replace(/\.html?$/i, '') + (atual !== original ? '-mudado' : '') + '.html');
  function desfazer() { atual = original; an = analisar(atual); picado = null; corpo(); }

  window.addEventListener('shell:navigate', (e) => { if (e.detail && e.detail.moduleId === 'desmontar') tela(); });
  return { tela, carregar, aba: (k) => { aba = k; corpo(); }, rodar, fazerPicar, baixarPicado, abrirComoProjeto, verFuncao, baixarPlano, copiarPlano, baixarAtual, desfazer, _analisar: analisar, _picar: picar, get analise() { return an; } };
})();
