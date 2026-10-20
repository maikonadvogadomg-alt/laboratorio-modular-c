/* =========================================================================
   LABORATÓRIO — 17-lab-termux.js · 📱 TERMINAL DE VERDADE (Termux)
   A mesma ponte do Mini SK (que já funciona), trazida para cá:
   - liga o Laboratório ao Termux do celular (ttyd: ws://127.0.0.1:7681/ws)
   - ⬆ manda o projeto importado para ~/laboratorio/NOME no Termux
   - ⬇ traz de volta o que o terminal criou (ex.: a pasta dist depois do build)
   Só o próprio celular enxerga (127.0.0.1) e a ponte de arquivos pede um código.
   ========================================================================= */
window.LabTermux = (function () {
  'use strict';
  const XTERM = 'https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0';
  const FIT = 'https://cdn.jsdelivr.net/npm/@xterm/addon-fit@0.10.0/lib/addon-fit.js';
  const PADRAO = 'ws://127.0.0.1:7681/ws';
  const CMD_INSTALAR = 'pkg install -y ttyd';
  const CMD_LIGAR = 'ttyd -W -i 127.0.0.1 -p 7681 bash';
  const PONTE = 'http://127.0.0.1:7683';
  const enc = new TextEncoder(), dec = new TextDecoder();
  let box = null, ws = null, term = null, fit = null, simples = false, abriu = false, saindo = false, montado = false;

  const pref = {
    get(k, d) { try { const v = localStorage.getItem('lab:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('lab:' + k, JSON.stringify(v)); } catch (e) {} },
  };
  const $ = (s) => (box ? box.querySelector(s) : null);
  const E = (s) => Lab.esc(s);
  function status(t, tipo) { const el = $('#tx-status'); if (!el) return; el.textContent = t; el.className = 'tx-status ' + (tipo || ''); }
  function carregarScript(src, pronto) { return new Promise((ok, erro) => { if (pronto()) return ok(); const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => erro(new Error('sem internet')); document.head.appendChild(s); }); }
  function carregarCss(href) { if (document.querySelector('link[href="' + href + '"]')) return; const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); }

  // ── tela: xterm (bonito) ou modo simples ──
  async function prepararTela() {
    if (term || simples) return;
    try {
      carregarCss(XTERM + '/css/xterm.css');
      // o terminal do ProjetoLens também se chama "Terminal": guardamos o nosso com outro nome
      if (!window.XTermTerminal) {
        const antes = window.Terminal;
        await carregarScript(XTERM + '/lib/xterm.js', () => false);
        window.XTermTerminal = window.Terminal; window.Terminal = antes;
      }
      await carregarScript(FIT, () => !!window.FitAddon);
      term = new window.XTermTerminal({ fontSize: pref.get('termFonte', 13), cursorBlink: true, theme: { background: '#07110d', foreground: '#d7f5e3' } });
      fit = new window.FitAddon.FitAddon(); term.loadAddon(fit);
      term.open($('#tx-term'));
      try { fit.fit(); } catch (e) {}
      term.onData((d) => enviar(d));
      try { let lw = 0, lh = 0, t = 0; new ResizeObserver((ents) => { const r = ents[0].contentRect; if (Math.abs(r.width - lw) < 4 && Math.abs(r.height - lh) < 4) return; lw = r.width; lh = r.height; clearTimeout(t); t = setTimeout(() => { try { fit.fit(); tamanho(); } catch (e) {} }, 200); }).observe($('#tx-term')); } catch (e) {}
    } catch (e) {
      simples = true;
      $('#tx-term').innerHTML = '<pre id="tx-pre" class="tx-pre"></pre><div class="lab-linha"><input id="tx-in" class="lab-busca" style="flex:1" placeholder="Digite o comando e toque em ⏎" autocapitalize="off" autocorrect="off" spellcheck="false"><button class="btn btn-primary" id="tx-ok">⏎</button></div>';
      const ir = () => { const i = $('#tx-in'); enviar(i.value + '\r'); i.value = ''; };
      $('#tx-ok').onclick = ir;
      $('#tx-in').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); ir(); } });
    }
  }
  function escreverTela(bytes) {
    if (term) { term.write(bytes); return; }
    const pre = $('#tx-pre'); if (!pre) return;
    pre.textContent += dec.decode(bytes).replace(/\x1b\[[0-9;?]*[ -\/]*[@-~]|\x1b\][^\x07]*\x07|\x1b[()][A-Z0-9]|\r(?!\n)/g, '');
    if (pre.textContent.length > 60000) pre.textContent = pre.textContent.slice(-40000);
    pre.scrollTop = pre.scrollHeight;
  }

  // ── o "idioma" do ttyd ──
  function enviar(texto) { if (ws && ws.readyState === 1) ws.send(enc.encode('0' + texto)); }
  function tamanho() { if (ws && ws.readyState === 1 && term) ws.send(enc.encode('1' + JSON.stringify({ columns: term.cols, rows: term.rows }))); }

  async function conectar() {
    const url = (($('#tx-url') && $('#tx-url').value) || PADRAO).trim();
    pref.set('termuxUrl', url);
    if (!/^wss?:\/\//.test(url)) return status('O endereço precisa começar com ws://', 'erro');
    await prepararTela();
    desconectar(true);
    abriu = false; saindo = false;
    status('Chamando o Termux…');
    try { ws = new WebSocket(url, ['tty']); } catch (e) { return status('Endereço inválido: ' + e.message, 'erro'); }
    ws.binaryType = 'arraybuffer';
    ws.onopen = () => {
      abriu = true;
      ws.send(enc.encode(JSON.stringify({ AuthToken: '', columns: term ? term.cols : 80, rows: term ? term.rows : 24 })));
      status('✅ Ligado no Termux. Pode digitar.', 'ok');
      $('#tx-con').hidden = true; $('#tx-des').hidden = false;
      if (term) term.focus(); else if ($('#tx-in')) $('#tx-in').focus();
    };
    ws.onmessage = (ev) => {
      const d = typeof ev.data === 'string' ? enc.encode(ev.data) : new Uint8Array(ev.data);
      if (d.length && String.fromCharCode(d[0]) === '0') escreverTela(d.subarray(1));
    };
    ws.onclose = (ev) => {
      if ($('#tx-con')) { $('#tx-con').hidden = false; $('#tx-des').hidden = true; }
      if (!abriu) status('❌ O Termux não respondeu. O Termux está aberto? Rodou o comando 2 (com -W)? Se o navegador perguntar sobre "dispositivos da rede local", toque em Permitir.', 'erro');
      else status(saindo || ev.code === 1000 ? 'Desligado.' : 'A conexão caiu (o Android pode ter fechado o Termux). Abra o Termux e toque em Conectar de novo.', saindo || ev.code === 1000 ? '' : 'erro');
      ws = null;
    };
    ws.onerror = () => {};
  }
  function desconectar(quieto) { saindo = true; if (ws) { try { ws.close(1000); } catch (e) {} ws = null; } if (!quieto) status('Desligado.'); }
  async function copiar(t) { try { await navigator.clipboard.writeText(t); Lab.aviso('Copiado. Cole no Termux.', 'success'); } catch (e) { prompt('Copie este comando:', t); } }

  // ── ponte de arquivos (Node no Termux) ──
  const PONTE_JS = "// Ponte de arquivos do Laboratório — roda no Termux.\nconst http=require('http'),fs=require('fs'),path=require('path'),os=require('os');\nconst CODIGO=process.argv[2]||'',PORTA=Number(process.argv[3]||7683);\nconst BASE=path.join(os.homedir(),'laboratorio');\nconst PULAR=/(^|\\/)(node_modules|\\.git|\\.cache)(\\/|$)/;\nfs.mkdirSync(BASE,{recursive:true});\nconst nome=(n)=>String(n||'projeto').replace(/[^\\w.\\- ]+/g,'_').replace(/^\\.+/,'').slice(0,60)||'projeto';\nfunction dentro(proj,rel){const raiz=path.resolve(BASE,nome(proj));const p=path.resolve(raiz,String(rel||''));if(p!==raiz&&!p.startsWith(raiz+path.sep))throw new Error('caminho inválido: '+rel);return{raiz,p};}\nfunction responder(res,c,o){res.writeHead(c,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(o));}\nfunction corpo(req){return new Promise((ok,erro)=>{const ps=[];let n=0;req.on('data',(c)=>{n+=c.length;if(n>80e6){erro(new Error('grande demais'));req.destroy();}else ps.push(c);});req.on('end',()=>{try{ok(JSON.parse(Buffer.concat(ps).toString('utf8')||'{}'));}catch(e){erro(e);}});req.on('error',erro);});}\nhttp.createServer(async(req,res)=>{res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, X-Codigo');res.setHeader('Access-Control-Allow-Private-Network','true');\nif(req.method==='OPTIONS'){res.writeHead(204);return res.end();}\nif(!CODIGO||req.headers['x-codigo']!==CODIGO)return responder(res,403,{erro:'código errado'});\nconst u=new URL(req.url,'http://x');\ntry{\nif(u.pathname==='/ping')return responder(res,200,{ok:true,pasta:BASE});\nif(u.pathname==='/enviar'&&req.method==='POST'){const b=await corpo(req);let n=0;const pulados=[];for(const a of b.arquivos||[]){try{if(PULAR.test(a.p))continue;const{p}=dentro(b.projeto,a.p);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,a.b64!=null?Buffer.from(a.b64,'base64'):String(a.t||''));n++;}catch(e){pulados.push(a.p+': '+e.message);}}return responder(res,200,{ok:true,n,pulados,pasta:dentro(b.projeto,'').raiz,agora:Date.now()+1});}\nif(u.pathname==='/listar'){const{raiz}=dentro(u.searchParams.get('projeto'),'');const desde=Number(u.searchParams.get('desde')||0);const lista=[];let total=0,cortou=false;const andar=(d)=>{let it=[];try{it=fs.readdirSync(d,{withFileTypes:true});}catch(e){return;}for(const e of it){const f=path.join(d,e.name),rel=path.relative(raiz,f).split(path.sep).join('/');if(PULAR.test(rel))continue;if(e.isDirectory()){andar(f);continue;}if(!e.isFile())continue;const st=fs.statSync(f);if(st.mtimeMs<=desde||st.size>5e6)continue;if(total+st.size>30e6){cortou=true;continue;}total+=st.size;lista.push({p:rel,b64:fs.readFileSync(f).toString('base64')});}};const agora=Date.now();andar(raiz);return responder(res,200,{ok:true,agora,arquivos:lista,cortou});}\nresponder(res,404,{erro:'não existe'});\n}catch(e){responder(res,500,{erro:e.message});}\n}).listen(PORTA,'127.0.0.1',()=>console.log('Ponte do Laboratório ligada na porta '+PORTA+' · pasta '+BASE));\n";
  function codigo() { let c = pref.get('ponteCodigo', ''); if (!c) { const a = new Uint8Array(12); crypto.getRandomValues(a); c = Array.from(a, (x) => x.toString(16).padStart(2, '0')).join(''); pref.set('ponteCodigo', c); } return c; }
  async function chamar(caminho, corpo) {
    let r;
    try { r = await fetch(PONTE + caminho, { method: corpo ? 'POST' : 'GET', headers: Object.assign({ 'X-Codigo': codigo() }, corpo ? { 'Content-Type': 'application/json' } : {}), body: corpo ? JSON.stringify(corpo) : undefined }); }
    catch (e) { throw new Error('A ponte não respondeu. Toque em 🧩 Ligar a ponte (com o Termux conectado).'); }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.erro === 'código errado' ? 'A ponte foi ligada por outro aparelho/navegador. Toque em 🧩 Ligar a ponte de novo.' : (j.erro || 'erro ' + r.status));
    return j;
  }
  async function ping() { try { await chamar('/ping'); return true; } catch (e) { return false; } }
  async function ligarPonte() {
    if (!(ws && ws.readyState === 1)) throw new Error('Conecte o Termux primeiro (🔌 Conectar).');
    const b64 = btoa(unescape(encodeURIComponent(PONTE_JS)));
    enviar("command -v node >/dev/null || pkg install -y nodejs-lts; echo '" + b64 + "' | base64 -d > ~/ponte-laboratorio.js && { pkill -f ponte-laboratorio.js; nohup node ~/ponte-laboratorio.js " + codigo() + " 7683 > ~/ponte-laboratorio.log 2>&1 & } ; sleep 1; clear; echo '✅ Ponte do Laboratório ligada (se der erro: cat ~/ponte-laboratorio.log)'\r");
    const fim = Date.now() + 240000;
    while (Date.now() < fim) { if (await ping()) return true; await new Promise((ok) => setTimeout(ok, 2000)); }
    throw new Error('A ponte não ligou. No Termux, rode: cat ~/ponte-laboratorio.log  e mande um print.');
  }
  const nomeProj = () => String(Shell.getState('projectName') || 'projeto').replace(/[^\w.\- ]+/g, '_').replace(/^\.+/, '').slice(0, 60) || 'projeto';
  const PULAR = /(^|\/)(node_modules|\.git)(\/|$)/;
  async function b64DeBlob(b) { const u = new Uint8Array(await b.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
  async function mandarProjeto() {
    const fs = Lab.arquivos(), bin = Lab.binarios();
    if (!Object.keys(fs).length) throw new Error('Importe um projeto primeiro (📦 Importar).');
    if (!(await ping())) await ligarPonte();
    const projeto = nomeProj();
    let lote = [], tam = 0, n = 0, pulados = [], pasta = '', agora = 0;
    const enviarLote = async () => { if (!lote.length) return; const r = await chamar('/enviar', { projeto, arquivos: lote }); n += r.n; pulados = pulados.concat(r.pulados || []); pasta = r.pasta; agora = r.agora; lote = []; tam = 0; };
    for (const p of Lab.lista()) {
      if (PULAR.test(p)) continue;
      const item = p in bin ? { p, b64: await b64DeBlob(bin[p]) } : Lab.ehBinario(fs[p]) ? null : { p, t: fs[p] };
      if (!item) continue;
      lote.push(item); tam += (item.b64 || item.t).length;
      if (tam > 3e6) await enviarLote();
    }
    await enviarLote();
    pref.set('sync:' + projeto, agora || Date.now());
    if (ws && ws.readyState === 1 && pasta) enviar('cd ' + JSON.stringify(pasta) + '\r');
    return { n, pulados, pasta };
  }
  async function trazer() {
    const projeto = nomeProj();
    const r = await chamar('/listar?projeto=' + encodeURIComponent(projeto) + '&desde=' + pref.get('sync:' + projeto, 0));
    const fs = Object.assign({}, Lab.arquivos()); window.LabBin = window.LabBin || {};
    let novos = 0, mudou = 0;
    for (const a of r.arquivos) {
      if (PULAR.test(a.p)) continue;
      const bin = atob(a.b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i += 1) u[i] = bin.charCodeAt(i);
      const ehTexto = /\.(html?|css|m?js|cjs|jsx|tsx?|json|md|txt|ya?ml|svg|xml|py|sh|toml|map)$/i.test(a.p);
      const existia = a.p in fs;
      if (ehTexto) { const t = dec.decode(u); if (existia && fs[a.p] === t) continue; fs[a.p] = t; }
      else { window.LabBin[a.p] = new Blob([u]); fs[a.p] = '[Arquivo binário: ' + u.length + ' bytes]'; }
      existia ? mudou++ : novos++;
    }
    Shell.setState('projectFiles', fs);
    Lab.limparCache();
    pref.set('sync:' + projeto, r.agora);
    return { novos, mudou, cortou: r.cortou };
  }

  function tela() {
    const el = document.getElementById('panel-termux'); if (!el) return;
    if (montado) return;
    montado = true; box = el;
    el.innerHTML =
      '<div class="lab-topo"><h2>📱 Terminal de verdade (Termux)</h2>' +
      '<p class="lab-mut">Liga o Laboratório ao <b>Termux</b> do seu celular — um Linux de verdade. A mesma ponte do Mini SK. Dá para rodar <code>npm install</code>, <code>npm run build</code>, <code>python</code>, <code>git</code>…</p></div>' +
      '<ol class="lab-ul">' +
      '<li>No Termux, <b>só da primeira vez</b>:<div class="lab-linha"><code>' + CMD_INSTALAR + '</code><button class="lab-mini" data-copiar="1">Copiar</button></div></li>' +
      '<li>No Termux, <b>toda vez</b> (e deixe o Termux aberto):<div class="lab-linha"><code>' + CMD_LIGAR + '</code><button class="lab-mini" data-copiar="2">Copiar</button></div><small class="lab-mut">O <b>-W</b> deixa digitar. O <b>-i 127.0.0.1</b> faz só o seu celular enxergar (ninguém do Wi-Fi entra).</small></li>' +
      '<li>Volte aqui e toque em <b>Conectar</b>.</li></ol>' +
      '<div class="lab-linha"><input id="tx-url" class="lab-busca" style="flex:1;min-width:200px" aria-label="Endereço do Termux" spellcheck="false" autocapitalize="off"><button class="btn btn-primary" id="tx-con">🔌 Conectar</button><button class="btn btn-secondary" id="tx-des" hidden>Desligar</button></div>' +
      '<div id="tx-status" class="tx-status">Desligado.</div>' +
      '<div class="lab-linha"><button class="lab-chip" id="tx-limpar">🧽 Limpar tela</button><button class="lab-chip" id="tx-menos">A−</button><button class="lab-chip" id="tx-mais">A+</button></div>' +
      '<div id="tx-term" class="tx-term"></div>' +
      '<div class="lab-linha"><button class="lab-chip" data-t="\x03">Ctrl+C</button><button class="lab-chip" data-t="\t">Tab</button><button class="lab-chip" data-t="\x1b[A">↑</button><button class="lab-chip" data-t="\x1b[B">↓</button><button class="lab-chip" data-t="\x04">Ctrl+D</button></div>' +
      '<div class="lab-det"><b>⇅ O projeto importado ↔ o Termux</b>' +
      '<p class="lab-mut">Manda o projeto para <code>~/laboratorio/NOME</code> no Termux; depois do <code>npm run build</code>, traz de volta o que foi criado (a pasta <code>dist</code>) — aí a 🧪 Prévia e o 🗺️ Mapa enxergam.</p>' +
      '<div class="lab-linha"><button class="btn btn-secondary" id="tx-p-ligar">🧩 Ligar a ponte</button><button class="btn btn-secondary" id="tx-p-mandar">⬆ Mandar o projeto</button><button class="btn btn-primary" id="tx-p-trazer">⬇ Trazer do Termux</button></div>' +
      '<div class="lab-linha"><button class="lab-chip" data-cmd="npm install">npm install</button><button class="lab-chip" data-cmd="npm run build">npm run build</button><button class="lab-chip" data-cmd="ls -la">ls -la</button><button class="lab-chip" data-cmd="termux-wake-lock">não deixar o Android fechar</button></div>' +
      '<div id="tx-p-status" class="lab-mut"></div></div>' +
      '<div class="lab-det"><b>👁 Visualizar o que o terminal ligou</b>' +
      '<p class="lab-mut">Depois de rodar <code>npm run dev</code> (ou <code>node server.cjs</code>, <code>python servir.py</code>…), escolha a <b>porta</b> que o terminal mostrou e veja aqui.</p>' +
      '<div class="lab-linha"><input id="tx-porta" class="lab-busca" style="width:110px" inputmode="numeric" aria-label="Porta"><button class="btn btn-primary" id="tx-ver">👁 Visualizar</button><button class="lab-chip" id="tx-ver-fora">↗ Abrir no Chrome</button></div>' +
      '<div class="lab-linha">' + [5173, 5000, 3000, 8080, 4173, 7745].map((p) => '<button class="lab-chip" data-porta="' + p + '">' + p + '</button>').join('') + '</div>' +
      '<div class="lab-moldura largo" id="tx-ver-caixa" hidden><iframe id="tx-ver-quadro" title="O que o terminal ligou"></iframe></div></div>' +
      '<details class="lab-det"><summary>Não conectou?</summary><ul class="lab-ul">' +
      '<li>O Termux precisa estar <b>aberto</b> com o comando 2 rodando (aparece "Listening on port: 7681").</li>' +
      '<li>Se o Android fechar o Termux, rode no Termux: <code>termux-wake-lock</code>.</li>' +
      '<li>No <b>Chrome</b>: se aparecer pedido de acesso a "dispositivos da rede local", toque em Permitir.</li>' +
      '<li>Se você ligou o ttyd com senha (<code>-c</code>), ligue sem senha — o <code>-i 127.0.0.1</code> já protege.</li>' +
      '<li>O Laboratório precisa estar aberto pelo <b>Chrome</b> (de um arquivo ou site). Dentro do chat ele não conecta.</li>' +
      '</ul></details>';
    $('#tx-url').value = pref.get('termuxUrl', PADRAO);
    $('#tx-porta').value = pref.get('portaVer', 5173);
    const enderecoVer = () => { const p = parseInt($('#tx-porta').value, 10); if (!(p > 0 && p < 65536)) { Lab.aviso('Porta inválida', 'warning'); return null; } pref.set('portaVer', p); return 'http://127.0.0.1:' + p + '/'; };
    $('#tx-ver').onclick = () => { const u = enderecoVer(); if (!u) return; $('#tx-ver-caixa').hidden = false; $('#tx-ver-quadro').src = u + '?t=' + Date.now(); };
    $('#tx-ver-fora').onclick = () => { const u = enderecoVer(); if (u) window.open(u, '_blank'); };
    const pst = (t, k) => { const s = $('#tx-p-status'); s.textContent = t; s.style.color = k === 'erro' ? 'var(--accent-red)' : k === 'ok' ? 'var(--accent-green)' : ''; };
    const rodarP = (fn) => fn().catch((e) => pst('⚠ ' + e.message, 'erro'));
    $('#tx-p-ligar').onclick = () => rodarP(async () => { pst('Instalando e ligando a ponte no Termux… (na 1ª vez pode instalar o Node: demora uns minutos)'); await ligarPonte(); pst('✅ Ponte ligada. Agora: ⬆ Mandar o projeto.', 'ok'); });
    $('#tx-p-mandar').onclick = () => rodarP(async () => { pst('Mandando…'); const r = await mandarProjeto(); pst('✅ ' + r.n + ' arquivo(s) no Termux em ' + r.pasta + (r.pulados.length ? ' · pulados: ' + r.pulados.length : '') + '. Já entrei na pasta.', 'ok'); });
    $('#tx-p-trazer').onclick = () => rodarP(async () => { pst('Trazendo…'); const r = await trazer(); pst('✅ Trazidos: ' + r.novos + ' novo(s), ' + r.mudou + ' mudado(s)' + (r.cortou ? ' (parte ficou de fora: grande demais)' : '') + '.', 'ok'); });
    $('#tx-con').onclick = () => conectar().catch((e) => status('Erro: ' + e.message, 'erro'));
    $('#tx-des').onclick = () => desconectar();
    const letra = (d) => { const n = Math.max(9, Math.min(28, pref.get('termFonte', 13) + d)); pref.set('termFonte', n); if (term) { term.options.fontSize = n; try { fit.fit(); tamanho(); } catch (e) {} } const pre = $('#tx-pre'); if (pre) pre.style.fontSize = n + 'px'; };
    $('#tx-menos').onclick = () => letra(-1); $('#tx-mais').onclick = () => letra(1);
    $('#tx-limpar').onclick = () => { if (term) term.clear(); else if ($('#tx-pre')) $('#tx-pre').textContent = ''; };
    el.addEventListener('click', (e) => {
      const c = e.target.closest('[data-copiar]'); if (c) copiar(c.dataset.copiar === '1' ? CMD_INSTALAR : CMD_LIGAR);
      const t = e.target.closest('[data-t]'); if (t) { enviar(t.dataset.t); if (term) term.focus(); }
      const pt = e.target.closest('[data-porta]'); if (pt) { $('#tx-porta').value = pt.dataset.porta; $('#tx-ver').click(); }
      const m = e.target.closest('[data-cmd]'); if (m) { if (!(ws && ws.readyState === 1)) status('Conecte primeiro (🔌 Conectar).', 'erro'); else enviar(m.dataset.cmd + '\r'); }
    });
  }

  window.addEventListener('shell:navigate', (e) => { if (e.detail && e.detail.moduleId === 'termux') tela(); });
  return { tela, conectar, desconectar, ligarPonte, mandarProjeto, trazer, get ligado() { return !!(ws && ws.readyState === 1); } };
})();
