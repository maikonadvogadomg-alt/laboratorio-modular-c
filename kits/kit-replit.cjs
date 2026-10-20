#!/usr/bin/env node
/* =========================================================================
   KIT DO MAIKON PARA O REPLIT (18/10-a)
   Roda no "Shell" do Replit. Não apaga NADA do seu projeto.
   Como usar:   node kit-replit.cjs
   Ele pergunta o que você quer, por número:
     1) 📋 Relatório do projeto (apps, versões montadas, APKs, sobras do Replit)
     2) 📦 Pacote LIMPO do projeto inteiro (sem node_modules e sem lixo)
     3) 🌐 Pacote só das versões MONTADAS (os sites prontos de cada app)
     4) 🔨 Montar (build) um app e empacotar o site dele
     5) ⭐ Tudo: relatório + pacote limpo + pacote dos montados
   Tudo sai na pasta  _kit-saida/  → no Replit, toque nos 3 pontinhos do arquivo → Download.
   Esses zips abrem no Preparador Universal e no Mini SK.
   ========================================================================= */
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib'), readline = require('readline');
const { spawnSync } = require('child_process');

const RAIZ = process.cwd();
const SAIDA = path.join(RAIZ, '_kit-saida');
const PULAR_PASTA = new Set(['node_modules', '.git', '.cache', '.local', '.upm', '.pythonlibs', '.npm', '.pnpm-store', '.config', '_kit-saida', '.next', '.turbo', '__pycache__', '.venv', 'venv']);
const MAX_ARQ = 50 * 1024 * 1024;                     // arquivos maiores que 50 MB ficam de fora (aparecem no relatório)
const data = () => new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '').replace(/^(\d{8})(\d{4})$/, '$1-$2');
const humano = (n) => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(0) + ' KB' : n < 1073741824 ? (n / 1048576).toFixed(1) + ' MB' : (n / 1073741824).toFixed(2) + ' GB';
const rel = (p) => path.relative(RAIZ, p).split(path.sep).join('/');

// ───────────────────────── olhar os arquivos ─────────────────────────
function listar(dir, cada) {
  let itens; try { itens = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const i of itens) {
    const p = path.join(dir, i.name);
    if (i.isSymbolicLink()) continue;
    if (i.isDirectory()) { if (!PULAR_PASTA.has(i.name)) listar(p, cada); }
    else if (i.isFile()) { let st; try { st = fs.statSync(p); } catch { continue; } cada(p, st); }
  }
}
const lerJSON = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };

function examinar() {
  const arquivos = [], grandes = [];
  let total = 0;
  listar(RAIZ, (p, st) => { if (st.size > MAX_ARQ) grandes.push({ p: rel(p), t: st.size }); else { arquivos.push({ p: rel(p), t: st.size, m: st.mtimeMs }); total += st.size; } });
  const apps = [], montados = [], apks = [], replit = [], artefatos = [];
  for (const a of arquivos) {
    const nome = a.p.split('/').pop(), dir = path.posix.dirname(a.p);
    if (nome === 'package.json' && !/(^|\/)(dist|build)(\/|$)/.test(dir)) {
      const j = lerJSON(path.join(RAIZ, a.p)); if (!j) continue;
      const deps = Object.assign({}, j.dependencies, j.devDependencies);
      if (j.scripts && (j.scripts.build || j.scripts.dev)) apps.push({ dir, nome: j.name || dir, build: j.scripts.build || '', servidor: !!(deps.express || deps.fastify), workspace: Object.values(deps).some((v) => /^workspace:/.test(String(v))), catalogo: Object.values(deps).some((v) => /^catalog:/.test(String(v))) });
    }
    if (nome === 'index.html' && arquivos.some((b) => b.p.startsWith((dir === '.' ? '' : dir + '/') + 'assets/') && /\.js$/.test(b.p))) {
      const html = fs.readFileSync(path.join(RAIZ, a.p), 'utf8');
      if (!/src=["'][^"']*\/src\/main\.(t|j)sx?["']/.test(html)) montados.push({ dir, quando: a.m, base: ((html.match(/<script[^>]+src=["'](\/[^"']*?)assets\//) || [])[1]) || '/' });
    }
    if (/\.(apk|aab)$/i.test(nome)) apks.push(a);
    if (/^(\.replit|replit\.nix)$/.test(nome)) replit.push('Configuração do Replit: ' + a.p);
    if (nome === 'artifact.toml') artefatos.push(dir.replace(/\/?\.replit-artifact$/, '') || '.');
  }
  for (const g of grandes) if (/\.(apk|aab)$/i.test(g.p)) apks.push({ p: g.p, t: g.t, m: 0 });
  montados.sort((a, b) => b.quando - a.quando);
  return { arquivos, grandes, total, apps, montados, apks, replit, artefatos };
}

// ───────────────────────── zip (feito aqui mesmo, sem instalar nada) ─────────────────────────
const TAB = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
function crc32(b) { let c = -1; for (let i = 0; i < b.length; i++) c = TAB[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function criarZip(destino, lista, prefixoTirar) {
  const fd = fs.openSync(destino, 'w'); let pos = 0; const central = [];
  const escreve = (buf) => { fs.writeSync(fd, buf); pos += buf.length; };
  let n = 0, bytes = 0;
  for (const p of lista) {
    let dados; try { dados = fs.readFileSync(path.join(RAIZ, p)); } catch { continue; }
    const nome = Buffer.from((prefixoTirar ? p.slice(prefixoTirar.length) : p), 'utf8');
    const crc = crc32(dados);
    const comp = /\.(png|jpe?g|gif|webp|zip|gz|apk|aab|mp4|mp3|woff2?|pdf)$/i.test(p) ? null : zlib.deflateRawSync(dados, { level: 6 });
    const metodo = comp && comp.length < dados.length ? 8 : 0, corpo = metodo ? comp : dados;
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(metodo, 8); h.writeUInt16LE(0, 10); h.writeUInt16LE(0x21, 12);
    h.writeUInt32LE(crc, 14); h.writeUInt32LE(corpo.length, 18); h.writeUInt32LE(dados.length, 22); h.writeUInt16LE(nome.length, 26); h.writeUInt16LE(0, 28);
    const ini = pos; escreve(h); escreve(nome); escreve(corpo);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(metodo, 10); c.writeUInt16LE(0, 12); c.writeUInt16LE(0x21, 14);
    c.writeUInt32LE(crc, 16); c.writeUInt32LE(corpo.length, 20); c.writeUInt32LE(dados.length, 24); c.writeUInt16LE(nome.length, 28); c.writeUInt32LE(ini, 42);
    central.push(Buffer.concat([c, nome])); n++; bytes += dados.length;
    if (n % 500 === 0) process.stdout.write('\r   ' + n + ' arquivos…');
  }
  const iniC = pos; for (const c of central) escreve(c);
  const fim = Buffer.alloc(22); fim.writeUInt32LE(0x06054b50, 0); fim.writeUInt16LE(Math.min(central.length, 0xFFFF), 8); fim.writeUInt16LE(Math.min(central.length, 0xFFFF), 10); fim.writeUInt32LE(pos - iniC, 12); fim.writeUInt32LE(iniC, 16);
  escreve(fim); fs.closeSync(fd);
  if (n >= 500) process.stdout.write('\r');
  return { n, bytes, tam: pos };
}

// ───────────────────────── as tarefas ─────────────────────────
function relatorio(ex) {
  const L = [];
  L.push('# Relatório do projeto — ' + path.basename(RAIZ), '', 'Feito em ' + new Date().toLocaleString('pt-BR') + ' pelo Kit do Maikon para o Replit.', '');
  L.push('## Resumo', '- Arquivos (sem node_modules e sem lixo): **' + ex.arquivos.length + '** (' + humano(ex.total) + ')', '- Apps (com package.json): **' + ex.apps.length + '**', '- Versões montadas (sites prontos): **' + ex.montados.length + '**', '- APKs guardados: **' + ex.apks.length + '**', '- Artefatos do Replit: **' + ex.artefatos.length + '**', '');
  if (ex.apps.length) { L.push('## Apps', '| Pasta | Nome | Montar (build) | Observações |', '|---|---|---|---|'); for (const a of ex.apps) L.push('| ' + a.dir + ' | ' + a.nome + ' | `' + (a.build || '—').replace(/\|/g, '/') + '` | ' + [a.servidor && 'tem servidor', a.workspace && 'depende do monorepo', a.catalogo && 'usa catalog:'].filter(Boolean).join(', ') + ' |'); L.push(''); }
  if (ex.montados.length) { L.push('## Versões montadas (a mais nova primeiro)', '| Pasta | Data | Endereço base |', '|---|---|---|'); for (const m of ex.montados) L.push('| ' + m.dir + ' | ' + new Date(m.quando).toLocaleString('pt-BR') + ' | ' + m.base + ' |'); L.push(''); }
  if (ex.artefatos.length) { L.push('## Artefatos do Replit', ...ex.artefatos.map((a) => '- ' + a), ''); }
  if (ex.apks.length) { L.push('## APKs guardados', ...ex.apks.map((a) => '- ' + a.p + ' (' + humano(a.t) + ')'), ''); }
  if (ex.grandes.length) { L.push('## Arquivos grandes (mais de 50 MB) — ficam FORA dos pacotes', ...ex.grandes.map((g) => '- ' + g.p + ' (' + humano(g.t) + ')'), ''); }
  if (ex.replit.length) { L.push('## Sobras do Replit', ...ex.replit.map((r) => '- ' + r), ''); }
  const top = [...ex.arquivos].sort((a, b) => b.t - a.t).slice(0, 15);
  L.push('## 15 maiores arquivos', ...top.map((a) => '- ' + a.p + ' (' + humano(a.t) + ')'), '');
  const f = path.join(SAIDA, 'RELATORIO-' + data() + '.md');
  fs.writeFileSync(f, L.join('\n'));
  console.log('📋 Relatório: ' + rel(f));
}

function pacoteLimpo(ex) {
  const f = path.join(SAIDA, 'PACOTE-LIMPO-' + data() + '.zip');
  console.log('📦 Fazendo o pacote limpo (' + ex.arquivos.length + ' arquivos)…');
  const r = criarZip(f, ex.arquivos.map((a) => a.p).filter((p) => !p.startsWith('_kit-saida/')));
  console.log('📦 Pacote limpo: ' + rel(f) + ' — ' + r.n + ' arquivos, ' + humano(r.tam));
}

function pacoteMontados(ex) {
  if (!ex.montados.length) { console.log('🌐 Nenhuma versão montada encontrada (pasta com index.html + assets).'); return; }
  const f = path.join(SAIDA, 'PACOTE-MONTADOS-' + data() + '.zip');
  const lista = [];
  for (const m of ex.montados) { const pre = m.dir === '.' ? '' : m.dir + '/'; for (const a of ex.arquivos) if (a.p.startsWith(pre)) lista.push(a.p); }
  const r = criarZip(f, [...new Set(lista)]);
  console.log('🌐 Pacote dos montados: ' + rel(f) + ' — ' + ex.montados.length + ' site(s), ' + humano(r.tam));
}

async function montarUm(ex, pergunta) {
  if (!ex.apps.length) { console.log('Nenhum app com package.json.'); return; }
  ex.apps.forEach((a, i) => console.log('   ' + (i + 1) + ') ' + a.dir + '  (' + a.nome + ')'));
  const i = parseInt(await pergunta('Qual app montar? (número) '), 10) - 1;
  const a = ex.apps[i]; if (!a) { console.log('Número inválido.'); return; }
  if (!a.build) { console.log('Esse app não tem "build" no package.json.'); return; }
  console.log('🔨 Montando ' + a.dir + ' (pode demorar)…');
  const usaPnpm = fs.existsSync(path.join(RAIZ, 'pnpm-workspace.yaml')) || fs.existsSync(path.join(RAIZ, 'pnpm-lock.yaml'));
  const r = spawnSync(usaPnpm ? 'pnpm' : 'npm', ['run', 'build'], { cwd: path.join(RAIZ, a.dir), stdio: 'inherit', shell: true, env: Object.assign({ PORT: process.env.PORT || '5173', BASE_PATH: process.env.BASE_PATH || '/' }, process.env) });
  if (r.status !== 0) { console.log('❌ O build deu erro (veja as mensagens acima). Nada foi apagado.'); return; }
  const ex2 = examinar();
  const m = ex2.montados.find((x) => x.dir === a.dir || x.dir.startsWith(a.dir + '/'));
  if (!m) { console.log('⚠️ Montou, mas não achei a pasta com index.html + assets.'); return; }
  const f = path.join(SAIDA, 'SITE-' + (a.dir.replace(/[^\w-]+/g, '_') || 'raiz') + '-' + data() + '.zip');
  const pre = m.dir === '.' ? '' : m.dir + '/';
  const r2 = criarZip(f, ex2.arquivos.filter((x) => x.p.startsWith(pre)).map((x) => x.p), pre);
  console.log('✅ Site montado de ' + m.dir + ': ' + rel(f) + ' (' + humano(r2.tam) + ')' + (m.base !== '/' ? ' — atenção: endereço base ' + m.base + ' (o Preparador Universal conserta)' : ''));
}

// ───────────────────────── menu ─────────────────────────
(async function () {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const pergunta = (q) => new Promise((ok) => rl.question(q, (r) => ok(String(r || '').trim())));
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   🧰 KIT DO MAIKON PARA O REPLIT  18/10-a  ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('Pasta: ' + RAIZ + '\nNada do seu projeto é apagado. Tudo sai em _kit-saida/\n');
  console.log('🔍 Olhando os arquivos…');
  let ex = examinar();
  console.log('   ' + ex.arquivos.length + ' arquivos (' + humano(ex.total) + ') · ' + ex.apps.length + ' app(s) · ' + ex.montados.length + ' versão(ões) montada(s) · ' + ex.apks.length + ' APK(s)\n');
  fs.mkdirSync(SAIDA, { recursive: true });
  const escolha = process.argv[2] || await pergunta('O que você quer?\n  1) 📋 Relatório\n  2) 📦 Pacote LIMPO do projeto inteiro\n  3) 🌐 Pacote só dos sites MONTADOS\n  4) 🔨 Montar (build) um app e empacotar\n  5) ⭐ Tudo (1 + 2 + 3)\nNúmero: ');
  try {
    if (escolha === '1' || escolha === '5') relatorio(ex);
    if (escolha === '2' || escolha === '5') pacoteLimpo(ex);
    if (escolha === '3' || escolha === '5') pacoteMontados(ex);
    if (escolha === '4') await montarUm(ex, pergunta);
    if (!/^[1-5]$/.test(escolha)) console.log('Escolha de 1 a 5. Rode de novo: node kit-replit.cjs');
  } catch (e) { console.log('❌ Erro: ' + e.message); }
  console.log('\n✅ Pronto. Os arquivos estão em _kit-saida/ → toque nos 3 pontinhos do arquivo → Download.\n');
  rl.close();
})();
