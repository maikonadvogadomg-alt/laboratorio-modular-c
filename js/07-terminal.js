
// ============================================================
//  MÓDULO 7 — TERMINAL PRINCIPAL
//  Simula ambiente Node.js com comandos reais úteis
// ============================================================
const Terminal = (() => {

  let history     = [];
  let historyIdx  = -1;
  let isRunning   = false;
  let cwd         = '~/projeto';
  let envReady    = false;
  let outputEl    = null;

  // ── Comandos internos disponíveis ─────────────────────────
  const COMMANDS = {
    help:       cmdHelp,
    clear:      cmdClear,
    cls:        cmdClear,
    ls:         cmdLs,
    dir:        cmdLs,
    pwd:        cmdPwd,
    cd:         cmdCd,
    cat:        cmdCat,
    echo:       cmdEcho,
    node:       cmdNode,
    npm:        cmdNpm,
    npx:        cmdNpx,
    git:        cmdGit,
    env:        cmdEnv,
    whoami:     cmdWhoami,
    date:       cmdDate,
    'node-v':   cmdNodeV,
    versions:   cmdVersions,
    tree:       cmdTree,
    find:       cmdFind,
    grep:       cmdGrep,
    wc:         cmdWc,
    head:       cmdHead,
    tail:       cmdTail,
    mkdir:      cmdMkdir,
    touch:      cmdTouch,
    analyze:    cmdAnalyze,
    plan:       cmdPlan,
    deps:       cmdDeps,
    routes:     cmdRoutes,
    bugs:       cmdBugs,
    export:     cmdExport,
  };

  // ── Inicializar ambiente ───────────────────────────────────
  function initEnv() {
    setStatus('loading', 'Iniciando ambiente...');
    outputEl = document.getElementById('terminal-output');

    writeLine('', 'dim');
    writeLine('⚙️  Iniciando ambiente ProjetoLens...', 'info');

    setTimeout(() => {
      writeLine('✓ Node.js v20.11.0 (simulado)', 'success');
    }, 300);

    setTimeout(() => {
      writeLine('✓ npm 10.2.4 (simulado)', 'success');
    }, 600);

    setTimeout(() => {
      const name = Shell.getState('projectName') || 'projeto';
      writeLine(`✓ Projeto: ${name}`, 'success');
      cwd = `~/${name.replace(/\s/g,'-').toLowerCase()}`;
    }, 900);

    setTimeout(() => {
      writeLine('✓ Ambiente pronto!', 'success');
      writeLine('', 'dim');
      writeLine('Digite "help" para ver os comandos disponíveis', 'dim');
      writeLine('', 'dim');

      envReady = true;
      setStatus('online', 'Ambiente ativo');

      // Atualiza info do ambiente
      setText('env-node-ver', 'v20.11.0');
      setText('env-npm-ver',  '10.2.4');
      setText('env-project',  Shell.getState('projectName') || 'projeto');
      setText('env-cwd',      cwd);
      setText('terminal-title', `ProjetoLens Terminal — ${cwd}`);

      // Foca no input
      document.getElementById('terminal-input')?.focus();

      // Setup busca NPM live
      NpmSearch.setupLiveSearch();

    }, 1200);
  }

  // ── Processar tecla no input ───────────────────────────────
  function handleKey(e) {
    if (e.key === 'Enter') {
      runInput();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateHistory(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateHistory(1);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      autocomplete();
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      writeLine('^C', 'err');
      isRunning = false;
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      cmdClear();
    }
  }

  // ── Executar input do usuário ──────────────────────────────
  function runInput() {
    const input = document.getElementById('terminal-input');
    if (!input) return;
    const cmd = input.value.trim();
    if (!cmd) return;
    input.value = '';
    runCmd(cmd);
  }

  // ── Executar comando ───────────────────────────────────────
  function runCmd(cmd) {
    if (!envReady) {
      writeLine('⚠️  Inicie o ambiente primeiro!', 'warn');
      return;
    }

    // Registra no histórico
    if (cmd && (history.length === 0 || history[0] !== cmd)) {
      history.unshift(cmd);
      if (history.length > 50) history.pop();
      historyIdx = -1;
      renderHistory();
    }

    // Mostra o comando no terminal
    writeCmd(cmd);

    // Parseia
    const parts  = cmd.trim().split(/\s+/);
    const base   = parts[0].toLowerCase();
    const args   = parts.slice(1);

    // Executa
    const lab = window.LabComandos && Object.prototype.hasOwnProperty.call(window.LabComandos, base) && base[0] !== '_' ? window.LabComandos[base] : null;
    if (lab) {
      Promise.resolve(lab(args, cmd)).then(scrollBottom);
    } else if (COMMANDS[base]) {
      COMMANDS[base](args, cmd);
      if (base === 'help' && window.LabComandos) window.LabComandos._ajuda();
    } else {
      writeLine(`bash: ${base}: comando não encontrado`, 'err');
      writeLine(`💡 Digite "help" para ver os comandos disponíveis`, 'dim');
    }

    // Scroll para o final
    scrollBottom();
  }

  // ════════════════════════════════════════════════════════════
  //  IMPLEMENTAÇÃO DOS COMANDOS
  // ════════════════════════════════════════════════════════════

  function cmdHelp() {
    writeLine('', 'dim');
    writeLine('╔══════════════════════════════════════════════════╗', 'info');
    writeLine('║         ProjetoLens Terminal — Comandos          ║', 'info');
    writeLine('╚══════════════════════════════════════════════════╝', 'info');
    writeLine('', 'dim');

    const cmds = [
      ['NAVEGAÇÃO',   null],
      ['ls / dir',    'Listar arquivos do projeto'],
      ['tree',        'Exibir árvore de arquivos'],
      ['pwd',         'Mostrar diretório atual'],
      ['cd <pasta>',  'Mudar de diretório'],
      ['cat <arq>',   'Ver conteúdo de um arquivo'],
      ['find <nome>', 'Buscar arquivo por nome'],
      ['grep <txt>',  'Buscar texto nos arquivos'],
      ['head <arq>',  'Ver primeiras 10 linhas'],
      ['tail <arq>',  'Ver últimas 10 linhas'],
      ['wc <arq>',    'Contar linhas/palavras'],
      ['',            null],
      ['PROJETO',     null],
      ['analyze',     'Executar análise de código'],
      ['plan',        'Gerar plano do projeto'],
      ['deps',        'Listar dependências'],
      ['routes',      'Listar rotas de API'],
      ['bugs',        'Listar problemas encontrados'],
      ['export',      'Exportar relatório completo'],
      ['',            null],
      ['NPM / NODE',  null],
      ['npm install', 'Instalar dependências'],
      ['npm run dev', 'Iniciar servidor de dev'],
      ['npm run build','Fazer build'],
      ['npm test',    'Rodar testes'],
      ['npm audit',   'Auditoria de segurança'],
      ['npm outdated','Deps desatualizadas'],
      ['npm list',    'Listar deps instaladas'],
      ['node -e <js>','Executar JavaScript'],
      ['',            null],
      ['GIT',         null],
      ['git status',  'Status do repositório'],
      ['git log',     'Histórico de commits'],
      ['git diff',    'Ver alterações'],
      ['',            null],
      ['SISTEMA',     null],
      ['clear / cls', 'Limpar terminal'],
      ['echo <txt>',  'Imprimir texto'],
      ['env',         'Ver variáveis de ambiente'],
      ['date',        'Data e hora atual'],
      ['versions',    'Versões do ambiente'],
      ['whoami',      'Usuário atual'],
    ];

    for (const [cmd, desc] of cmds) {
      if (desc === null) {
        if (cmd) writeLine(`\n  ── ${cmd} ──`, 'highlight');
      } else {
        writeLine(`  ${cmd.padEnd(20)} ${desc}`, 'out');
      }
    }
    writeLine('', 'dim');
  }

  function cmdClear() {
    const el = document.getElementById('terminal-output');
    if (el) el.innerHTML = '';
  }

  function cmdLs(args) {
    const files   = Shell.getState('projectFiles') || {};
    const allKeys = Object.keys(files).filter(p => !p.includes('node_modules'));

    // Determina pasta atual
    let prefix = '';
    if (args[0] && args[0] !== '-la' && args[0] !== '-l' && args[0] !== '-a') {
      prefix = args[0].replace(/^\//, '');
    }

    // Filtra arquivos na pasta
    const inDir = allKeys.filter(p => {
      if (!prefix) {
        return !p.includes('/') || p.split('/').length === 2;
      }
      return p.startsWith(prefix + '/');
    });

    if (inDir.length === 0) {
      writeLine(`ls: ${prefix || '.'}: pasta vazia ou não encontrada`, 'warn');
      return;
    }

    // Agrupa dirs e files
    const dirs  = new Set();
    const fls   = [];
    for (const p of inDir) {
      const rel   = prefix ? p.slice(prefix.length + 1) : p;
      const parts = rel.split('/');
      if (parts.length > 1) dirs.add(parts[0]);
      else fls.push(rel);
    }

    writeLine(`total ${inDir.length}`, 'dim');
    for (const d of [...dirs].sort()) {
      writeLine(`  📁 ${d}/`, 'path');
    }
    for (const f of fls.sort()) {
      const content = files[prefix ? `${prefix}/${f}` : f] || '';
      const size    = new Blob([content]).size;
      const sz      = size < 1024 ? `${size}B` : `${(size/1024).toFixed(1)}K`;
      writeLine(`  📄 ${f.padEnd(35)} ${sz}`, 'out');
    }
  }

  function cmdPwd() {
    writeLine(cwd, 'path');
  }

  function cmdCd(args) {
    if (!args[0] || args[0] === '~') {
      cwd = '~/projeto';
      setText('env-cwd', cwd);
      return;
    }
    if (args[0] === '..') {
      const parts = cwd.split('/');
      if (parts.length > 2) parts.pop();
      cwd = parts.join('/');
    } else {
      cwd = `${cwd}/${args[0]}`;
    }
    setText('env-cwd', cwd);
    writeLine(`→ ${cwd}`, 'path');
  }

  function cmdCat(args) {
    if (!args[0]) { writeLine('Uso: cat <arquivo>', 'warn'); return; }
    const files = Shell.getState('projectFiles') || {};
    const key   = Object.keys(files).find(k =>
      k === args[0] || k.endsWith('/' + args[0]) || k.endsWith(args[0])
    );
    if (!key) {
      writeLine(`cat: ${args[0]}: arquivo não encontrado`, 'err');
      writeLine(`💡 Use "ls" para ver os arquivos disponíveis`, 'dim');
      return;
    }
    const content = files[key] || '';
    const lines   = content.split('\n');
    writeLine(`── ${key} (${lines.length} linhas) ──`, 'dim');
    lines.slice(0, 100).forEach((line, i) => {
      writeLine(`${String(i+1).padStart(4)}  ${line}`, 'out');
    });
    if (lines.length > 100) {
      writeLine(`... (${lines.length - 100} linhas omitidas — use head/tail)`, 'dim');
    }
  }

  function cmdEcho(args) {
    writeLine(args.join(' '), 'out');
  }

  function cmdNode(args) {
    if (args[0] === '--version' || args[0] === '-v') {
      writeLine('v20.11.0', 'success');
      return;
    }
    if (args[0] === '-e' && args[1]) {
      try {
        // Executa JS seguro (sem acesso ao DOM/sistema)
        const code   = args.slice(1).join(' ').replace(/^['"]|['"]$/g,'');
        const result = new Function(`"use strict"; return (${code})`)();
        writeLine(String(result), 'success');
      } catch(e) {
        writeLine(`SyntaxError: ${e.message}`, 'err');
      }
      return;
    }
    writeLine('node: use "node -e <código>" para executar JavaScript', 'warn');
    writeLine('Exemplo: node -e "1 + 1"', 'dim');
  }

  function cmdNpm(args) {
    const sub = args[0]?.toLowerCase();
    if (window.LabComandos && ['search', 's', 'find'].includes(sub)) return window.LabComandos.pesquisar(args.slice(1));
    if (window.LabComandos && ['view', 'info', 'show'].includes(sub)) return window.LabComandos.info(args.slice(1));

    if (!sub) {
      writeLine('npm <install|run|test|audit|outdated|list|init>', 'warn');
      return;
    }

    if (sub === 'install' || sub === 'i') {
      const pkg = args[1];
      if (pkg) {
        writeLine(`📦 Simulando: npm install ${args.slice(1).join(' ')}`, 'info');
        writeLine(`⚠️  Instalar de verdade só no seu computador. Aqui no laboratório: "cdn ${args[1]}" mostra como usar SEM instalar.`, 'warn');
        writeLine(`💡 Copie o comando e execute no seu terminal:`, 'dim');
        writeLine(`   npm install ${args.slice(1).join(' ')}`, 'highlight');
      } else {
        const deps = Shell.getState('dependencies') || [];
        writeLine(`📦 Instalando ${deps.length} dependências...`, 'info');
        writeLine(`⚠️  Execute no seu terminal local:`, 'warn');
        writeLine(`   npm install`, 'highlight');
      }
      return;
    }

    if (sub === 'run') {
      const script = args[1];
      if (!script) { writeLine('npm run <script>', 'warn'); return; }
      writeLine(`▶️  npm run ${script}`, 'info');
      writeLine(`⚠️  Execute no seu terminal local:`, 'warn');
      writeLine(`   npm run ${script}`, 'highlight');
      return;
    }

    if (sub === 'test') {
      writeLine('🧪 npm test', 'info');
      writeLine('⚠️  Execute no seu terminal local: npm test', 'warn');
      return;
    }

    if (sub === 'audit') {
      const bugs = Shell.getState('bugs') || [];
      const errs = bugs.filter(b => b.type === 'error');
      writeLine('🔒 Auditoria de segurança (baseada na análise local):', 'info');
      writeLine(`   Problemas críticos: ${errs.length}`, errs.length > 0 ? 'err' : 'success');
      writeLine(`   Execute "bugs" para ver detalhes`, 'dim');
      return;
    }

    if (sub === 'outdated') {
      const deps = Shell.getState('dependencies') || [];
      writeLine('🔄 Dependências (versões do projeto):', 'info');
      deps.slice(0, 15).forEach(d => {
        writeLine(`  ${d.name.padEnd(30)} ${d.version}`, 'out');
      });
      if (deps.length > 15) writeLine(`  ... e mais ${deps.length - 15}`, 'dim');
      return;
    }

    if (sub === 'list' || sub === 'ls') {
      const deps = Shell.getState('dependencies') || [];
      writeLine(`📦 ${deps.length} dependências no projeto:`, 'info');
      deps.slice(0, 20).forEach(d => {
        const icon = d.type === 'dev' ? '🔧' : '📦';
        writeLine(`  ${icon} ${d.name}@${d.version}`, 'out');
      });
      if (deps.length > 20) writeLine(`  ... e mais ${deps.length - 20}`, 'dim');
      return;
    }

    if (sub === 'init') {
      writeLine('📋 npm init — use o Módulo 6 (Scripts) para gerar o package.json', 'info');
      return;
    }

    writeLine(`npm: subcomando "${sub}" não reconhecido`, 'warn');
  }

  function cmdNpx(args) {
    writeLine(`npx ${args.join(' ')}`, 'info');
    writeLine('⚠️  Execute no seu terminal local:', 'warn');
    writeLine(`   npx ${args.join(' ')}`, 'highlight');
  }

  function cmdGit(args) {
    const sub = args[0]?.toLowerCase();

    if (!sub) {
      writeLine('git <status|log|diff|branch|add|commit>', 'warn');
      return;
    }

    if (sub === 'status') {
      const files = Shell.getState('projectFiles') || {};
      const count = Object.keys(files).filter(p => !p.includes('node_modules')).length;
      writeLine('On branch main', 'success');
      writeLine('', 'dim');
      writeLine('Changes not staged for commit:', 'warn');
      writeLine(`  ${count} arquivos no projeto`, 'out');
      writeLine('', 'dim');
      writeLine('💡 Execute "git status" no seu terminal local para o status real', 'dim');
      return;
    }

    if (sub === 'log') {
      writeLine('📜 Histórico Git (simulado):', 'info');
      const commits = [
        'feat: setup inicial do projeto',
        'feat: adiciona estrutura de pastas',
        'chore: instala dependências',
        'docs: atualiza README',
      ];
      commits.forEach((msg, i) => {
        const hash = Math.random().toString(16).slice(2, 9);
        writeLine(`  ${hash} ${msg}`, 'out');
      });
      return;
    }

    if (sub === 'diff') {
      writeLine('💡 Execute "git diff" no seu terminal local', 'dim');
      return;
    }

    if (sub === 'branch') {
      writeLine('* main', 'success');
      return;
    }

    writeLine(`git ${sub}: execute no seu terminal local`, 'dim');
  }

  function cmdEnv() {
    const name = Shell.getState('projectName') || 'projeto';
    writeLine('Variáveis de ambiente do ProjetoLens:', 'info');
    writeLine(`  NODE_ENV=development`, 'out');
    writeLine(`  PROJECT_NAME=${name}`, 'out');
    writeLine(`  CWD=${cwd}`, 'out');
    writeLine(`  NODE_VERSION=v20.11.0`, 'out');
    writeLine(`  NPM_VERSION=10.2.4`, 'out');
    writeLine('', 'dim');
    writeLine('💡 Variáveis reais estão no arquivo .env do projeto', 'dim');
  }

  function cmdWhoami() {
    writeLine('projetolens-user', 'success');
  }

  function cmdDate() {
    writeLine(new Date().toLocaleString('pt-BR'), 'success');
  }

  function cmdNodeV() {
    writeLine('v20.11.0', 'success');
  }

  function cmdVersions() {
    writeLine('Versões do ambiente:', 'info');
    writeLine('  node:    v20.11.0', 'out');
    writeLine('  npm:     10.2.4',   'out');
    writeLine('  v8:      11.3.244', 'out');
    writeLine('  uv:      1.46.0',   'out');
    writeLine('  zlib:    1.2.13',   'out');
    writeLine('  openssl: 3.1.4',    'out');
  }

  function cmdTree(args) {
    const files = Shell.getState('projectFiles') || {};
    const paths = Object.keys(files)
      .filter(p => !p.includes('node_modules'))
      .sort()
      .slice(0, 60);

    writeLine(`📁 ${Shell.getState('projectName') || 'projeto'}/`, 'path');

    const shown = new Set();
    for (const p of paths) {
      const parts = p.split('/');
      parts.forEach((part, i) => {
        const key = parts.slice(0, i+1).join('/');
        if (shown.has(key)) return;
        shown.add(key);
        const indent = '  '.repeat(i) + (i === 0 ? '├── ' : '│   '.repeat(i-1) + '├── ');
        const isDir  = i < parts.length - 1;
        writeLine(`${indent}${isDir ? '📁 ' : '📄 '}${part}${isDir ? '/' : ''}`, isDir ? 'path' : 'out');
      });
    }

    if (Object.keys(files).length > 60) {
      writeLine(`... e mais ${Object.keys(files).length - 60} arquivos`, 'dim');
    }
  }

  function cmdFind(args) {
    if (!args[0]) { writeLine('Uso: find <nome>', 'warn'); return; }
    const query = args[0].toLowerCase();
    const files = Shell.getState('projectFiles') || {};
    const found = Object.keys(files).filter(p =>
      p.toLowerCase().includes(query) && !p.includes('node_modules')
    );
    if (!found.length) {
      writeLine(`Nenhum arquivo encontrado: "${query}"`, 'warn');
      return;
    }
    writeLine(`${found.length} resultado(s):`, 'info');
    found.slice(0, 30).forEach(p => writeLine(`  📄 ${p}`, 'path'));
    if (found.length > 30) writeLine(`  ... e mais ${found.length - 30}`, 'dim');
  }

  function cmdGrep(args) {
    if (!args[0]) { writeLine('Uso: grep <texto> [arquivo]', 'warn'); return; }
    const query   = args[0].toLowerCase();
    const fileArg = args[1];
    const files   = Shell.getState('projectFiles') || {};
    let   matches = 0;

    for (const [path, content] of Object.entries(files)) {
      if (path.includes('node_modules')) continue;
      if (fileArg && !path.includes(fileArg)) continue;
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (line.toLowerCase().includes(query)) {
          if (matches < 30) {
            writeLine(`${path}:${i+1}:  ${line.trim().substring(0,80)}`, 'out');
          }
          matches++;
        }
      });
    }

    if (matches === 0) writeLine(`Nenhuma ocorrência de "${query}"`, 'warn');
    else writeLine(`\n${matches} ocorrência(s) encontrada(s)`, 'success');
  }

  function cmdWc(args) {
    if (!args[0]) {
      // Conta tudo
      const files = Shell.getState('projectFiles') || {};
      let lines = 0, words = 0, chars = 0, count = 0;
      for (const [p, c] of Object.entries(files)) {
        if (p.includes('node_modules')) continue;
        lines += c.split('\n').length;
        words += c.split(/\s+/).length;
        chars += c.length;
        count++;
      }
      writeLine(`  Arquivos: ${count}`, 'out');
      writeLine(`  Linhas:   ${lines.toLocaleString('pt-BR')}`, 'out');
      writeLine(`  Palavras: ${words.toLocaleString('pt-BR')}`, 'out');
      writeLine(`  Chars:    ${chars.toLocaleString('pt-BR')}`, 'out');
      return;
    }
    const files = Shell.getState('projectFiles') || {};
    const key   = Object.keys(files).find(k => k.endsWith(args[0]) || k === args[0]);
    if (!key) { writeLine(`wc: ${args[0]}: não encontrado`, 'err'); return; }
    const c = files[key];
    writeLine(`  Linhas:   ${c.split('\n').length}`, 'out');
    writeLine(`  Palavras: ${c.split(/\s+/).length}`, 'out');
    writeLine(`  Chars:    ${c.length}`, 'out');
  }

  function cmdHead(args) {
    if (!args[0]) { writeLine('Uso: head <arquivo>', 'warn'); return; }
    const files = Shell.getState('projectFiles') || {};
    const key   = Object.keys(files).find(k => k.endsWith(args[0]) || k === args[0]);
    if (!key) { writeLine(`head: ${args[0]}: não encontrado`, 'err'); return; }
    const lines = files[key].split('\n').slice(0, 10);
    writeLine(`── ${key} (primeiras ${lines.length} linhas) ──`, 'dim');
    lines.forEach((l, i) => writeLine(`${String(i+1).padStart(3)}  ${l}`, 'out'));
  }

  function cmdTail(args) {
    if (!args[0]) { writeLine('Uso: tail <arquivo>', 'warn'); return; }
    const files = Shell.getState('projectFiles') || {};
    const key   = Object.keys(files).find(k => k.endsWith(args[0]) || k === args[0]);
    if (!key) { writeLine(`tail: ${args[0]}: não encontrado`, 'err'); return; }
    const all   = files[key].split('\n');
    const lines = all.slice(-10);
    writeLine(`── ${key} (últimas ${lines.length} linhas) ──`, 'dim');
    lines.forEach((l, i) => writeLine(`${String(all.length - lines.length + i + 1).padStart(3)}  ${l}`, 'out'));
  }

  function cmdMkdir(args) {
    if (!args[0]) { writeLine('Uso: mkdir <pasta>', 'warn'); return; }
    writeLine(`📁 mkdir ${args[0]} — execute no seu terminal local`, 'dim');
  }

  function cmdTouch(args) {
    if (!args[0]) { writeLine('Uso: touch <arquivo>', 'warn'); return; }
    writeLine(`📄 touch ${args[0]} — execute no seu terminal local`, 'dim');
  }

  function cmdAnalyze() {
    writeLine('🔍 Iniciando análise de código...', 'info');
    if (typeof CodeAnalyzer !== 'undefined') {
      CodeAnalyzer.analyze();
      writeLine('✅ Análise concluída! Veja o painel "Analisador"', 'success');
    } else {
      writeLine('❌ Módulo Analisador não carregado', 'err');
    }
  }

  function cmdPlan() {
    writeLine('📋 Gerando plano do projeto...', 'info');
    if (typeof Planner !== 'undefined') {
      Planner.generate();
      writeLine('✅ Plano gerado! Veja o painel "Plano"', 'success');
    } else {
      writeLine('❌ Módulo Planner não carregado', 'err');
    }
  }

  function cmdDeps() {
    const deps = Shell.getState('dependencies') || [];
    if (!deps.length) { writeLine('Nenhuma dependência carregada. Importe um projeto.', 'warn'); return; }
    writeLine(`📦 ${deps.length} dependências:`, 'info');
    deps.slice(0, 20).forEach(d => {
      const icon = d.type === 'dev' ? '🔧' : '📦';
      writeLine(`  ${icon} ${d.name.padEnd(28)} ${d.version.padEnd(12)} ${d.type}`, 'out');
    });
    if (deps.length > 20) writeLine(`  ... e mais ${deps.length - 20}`, 'dim');
  }

  function cmdRoutes() {
    const routes = Shell.getState('routes') || [];
    if (!routes.length) { writeLine('Nenhuma rota detectada. Execute "analyze" primeiro.', 'warn'); return; }
    writeLine(`🛣️  ${routes.length} rotas:`, 'info');
    routes.slice(0, 20).forEach(r => {
      writeLine(`  ${r.method.padEnd(8)} ${r.path.padEnd(35)} ${r.file.split('/').pop()}`, 'out');
    });
    if (routes.length > 20) writeLine(`  ... e mais ${routes.length - 20}`, 'dim');
  }

  function cmdBugs() {
    const bugs = Shell.getState('bugs') || [];
    if (!bugs.length) { writeLine('Nenhum bug detectado. Execute "analyze" primeiro.', 'warn'); return; }
    const errs  = bugs.filter(b => b.type === 'error');
    const warns = bugs.filter(b => b.type === 'warning');
    const todos = bugs.filter(b => b.type === 'todo');
    writeLine(`🐛 ${bugs.length} ocorrências:`, 'info');
    writeLine(`  ❌ ${errs.length} erros críticos`, errs.length > 0 ? 'err' : 'success');
    writeLine(`  ⚠️  ${warns.length} avisos`, warns.length > 0 ? 'warn' : 'success');
    writeLine(`  📝 ${todos.length} TODOs`, 'out');
    writeLine('', 'dim');
    errs.slice(0, 5).forEach(b => {
      writeLine(`  ❌ ${b.msg} — ${b.file}:${b.line}`, 'err');
    });
  }

  function cmdExport() {
    writeLine('📤 Exportando relatório...', 'info');
    if (typeof CodeAnalyzer !== 'undefined') {
      CodeAnalyzer.exportReport();
      writeLine('✅ Relatório exportado!', 'success');
    } else {
      writeLine('❌ Execute "analyze" primeiro (ou abra o Analisador).', 'err');
    }
  }

  // ════════════════════════════════════════════════════════════
  //  PEÇAS QUE FALTARAM (a resposta do 4.6 foi cortada aqui) —
  //  completadas na montagem
  // ════════════════════════════════════════════════════════════
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function writeLine(texto, tipo) {
    outputEl = outputEl || document.getElementById('terminal-output');
    if (!outputEl) return;
    const d = document.createElement('div');
    d.className = 't-line t-' + (tipo || 'out');
    d.innerHTML = texto === '' ? '&nbsp;' : esc(texto);
    outputEl.appendChild(d);
    scrollBottom();
  }
  function writeCmd(cmd) {
    outputEl = outputEl || document.getElementById('terminal-output');
    if (!outputEl) return;
    const d = document.createElement('div');
    d.className = 't-line t-cmd';
    d.innerHTML = '<span class="t-path">' + esc(cwd) + '</span> <span class="t-prompt">$</span> ' + esc(cmd);
    outputEl.appendChild(d);
  }
  function scrollBottom() { if (outputEl) outputEl.scrollTop = outputEl.scrollHeight; }
  function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
  function setStatus(estado, texto) {
    const dot = document.getElementById('env-dot');
    if (dot) dot.className = 'env-dot ' + estado;
    setText('env-status-text', texto);
  }
  function navigateHistory(dir) {
    const input = document.getElementById('terminal-input');
    if (!input || !history.length) return;
    historyIdx = Math.max(-1, Math.min(history.length - 1, historyIdx - dir));
    input.value = historyIdx === -1 ? '' : history[historyIdx];
  }
  function autocomplete() {
    const input = document.getElementById('terminal-input');
    if (!input) return;
    const v = input.value.trim().toLowerCase();
    if (!v) return;
    const achados = Object.keys(COMMANDS).filter((c) => c.startsWith(v));
    if (achados.length === 1) input.value = achados[0] + ' ';
    else if (achados.length > 1) writeLine(achados.join('   '), 'dim');
  }
  function renderHistory() {
    const el = document.getElementById('cmd-history');
    if (!el) return;
    el.innerHTML = history.slice(0, 20).map((c) => '<button class="btn btn-secondary" style="text-align:left;font-family:monospace;font-size:12px;padding:4px 8px" data-cmd="' + esc(c).replace(/"/g, '&quot;') + '">' + esc(c) + '</button>').join('');
    el.querySelectorAll('button').forEach((b) => (b.onclick = () => runCmd(b.dataset.cmd)));
  }
  function init() { if (envReady) { document.getElementById('terminal-input')?.focus(); return; } initEnv(); }
  function clear() { cmdClear(); }
  function clearHistory() { history = []; historyIdx = -1; renderHistory(); }
  function textoTodo() { return outputEl ? Array.from(outputEl.querySelectorAll('.t-line')).map((l) => l.textContent).join('\n') : ''; }
  function copyOutput() {
    const t = textoTodo();
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(
      () => (typeof Shell !== 'undefined' && Shell.toast ? Shell.toast('📋 Copiado', 'success') : null),
      () => writeLine('Não consegui copiar aqui.', 'warn'));
  }
  function saveLog() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([textoTodo()], { type: 'text/plain;charset=utf-8' }));
    a.download = 'terminal-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.txt';
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  }

  return { init, handleKey, runInput, runCmd, clear, clearHistory, copyOutput, saveLog, writeLine };
})();
