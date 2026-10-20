
// ============================================================
//  MÓDULO 4 — ANALISADOR DE CÓDIGO + ROTAS DE API
//  Detecta frameworks, bugs, rotas, console.logs, estrutura
// ============================================================

const CodeAnalyzer = (() => {

  let bugs         = [];
  let routes       = [];
  let consoleLogs  = [];
  let frameworks   = [];
  let structureMap = {};
  let totalLines   = 0;
  let currentBugFilter   = 'all';
  let currentRouteFilter = 'all';
  let currentTab         = 'bugs';

  // ── Padrões de detecção de frameworks ─────────────────────
  const FW_PATTERNS = [
    { name: 'React',      icon: '⚛️',  color: '#61dafb', patterns: [/from ['"]react['"]/,/require\(['"]react['"]\)/,/jsx/i] },
    { name: 'Next.js',    icon: '▲',   color: '#ffffff', patterns: [/from ['"]next\//,/getServerSideProps/,/getStaticProps/,/next\.config/] },
    { name: 'Vue',        icon: '💚',  color: '#42b883', patterns: [/from ['"]vue['"]/,/createApp/,/\.vue['"]/] },
    { name: 'Nuxt',       icon: '💚',  color: '#00dc82', patterns: [/from ['"]nuxt/,/nuxt\.config/,/useNuxt/] },
    { name: 'Svelte',     icon: '🔥',  color: '#ff3e00', patterns: [/from ['"]svelte/,/\.svelte['"]/,/SvelteKit/] },
    { name: 'Angular',    icon: '🔴',  color: '#dd0031', patterns: [/from ['"]@angular/,/@Component/,/@NgModule/] },
    { name: 'Express',    icon: '🚂',  color: '#68a063', patterns: [/require\(['"]express['"]\)/,/from ['"]express['"]/,/app\.get\(/,/app\.post\(/] },
    { name: 'Fastify',    icon: '⚡',  color: '#00b4d8', patterns: [/require\(['"]fastify['"]\)/,/from ['"]fastify['"]/,/fastify\.get\(/] },
    { name: 'NestJS',     icon: '🐱',  color: '#e0234e', patterns: [/from ['"]@nestjs/,/@Controller/,/@Injectable/,/@Module/] },
    { name: 'Koa',        icon: '🌿',  color: '#33333d', patterns: [/require\(['"]koa['"]\)/,/from ['"]koa['"]/,/new Koa\(\)/] },
    { name: 'TypeScript', icon: '📘',  color: '#3178c6', patterns: [/\.ts['"]/,/tsconfig/,/interface /,/type [A-Z]/] },
    { name: 'Tailwind',   icon: '🎨',  color: '#38bdf8', patterns: [/tailwind/,/className="[^"]*flex/,/tw`/] },
    { name: 'Prisma',     icon: '🔷',  color: '#5a67d8', patterns: [/from ['"]@prisma/,/prisma\.client/,/\.prisma['"]/] },
    { name: 'MongoDB',    icon: '🍃',  color: '#47a248', patterns: [/mongoose/,/MongoClient/,/mongodb/] },
    { name: 'PostgreSQL', icon: '🐘',  color: '#336791', patterns: [/pg\.Pool/,/from ['"]pg['"]/,/postgres/i] },
    { name: 'Socket.io',  icon: '🔌',  color: '#010101', patterns: [/socket\.io/,/io\.on\(/,/socket\.on\(/] },
    { name: 'Vite',       icon: '⚡',  color: '#646cff', patterns: [/vite\.config/,/from ['"]vite['"]/,/defineConfig/] },
    { name: 'Webpack',    icon: '📦',  color: '#8dd6f9', patterns: [/webpack\.config/,/require\(['"]webpack['"]\)/] },
    { name: 'Electron',   icon: '⚛️',  color: '#47848f', patterns: [/from ['"]electron['"]/,/BrowserWindow/,/ipcMain/] },
    { name: 'React Native',icon:'📱', color: '#61dafb', patterns: [/react-native/,/from ['"]react-native['"]/,/StyleSheet\.create/] },
  ];

  // ── Padrões de bugs ────────────────────────────────────────
  const BUG_PATTERNS = [
    // Erros críticos
    {
      id: 'eval',
      type: 'error',
      msg: 'Uso de eval() — risco de segurança grave',
      regex: /\beval\s*\(/g,
      ext: ['js','ts','jsx','tsx'],
    },
    {
      id: 'dangerouslySetInnerHTML',
      type: 'error',
      msg: 'dangerouslySetInnerHTML — risco de XSS',
      regex: /dangerouslySetInnerHTML/g,
      ext: ['js','ts','jsx','tsx'],
    },
    {
      id: 'document.write',
      type: 'error',
      msg: 'document.write() — prática obsoleta e perigosa',
      regex: /document\.write\s*\(/g,
      ext: ['js','ts','jsx','tsx','html'],
    },
    {
      id: 'hardcoded-secret',
      type: 'error',
      msg: 'Possível chave/senha hardcoded no código',
      regex: /(password|secret|api_key|apikey|token|private_key)\s*[:=]\s*['"][^'"]{6,}['"]/gi,
      ext: ['js','ts','jsx','tsx','py','php','rb'],
    },
    {
      id: 'sql-injection',
      type: 'error',
      msg: 'Possível SQL Injection — use parâmetros preparados',
      regex: /query\s*\(\s*[`'"]\s*(SELECT|INSERT|UPDATE|DELETE).*\$\{/gi,
      ext: ['js','ts','jsx','tsx'],
    },
    // Avisos
    {
      id: 'async-no-await',
      type: 'warning',
      msg: 'Função async sem await — pode ser desnecessária',
      regex: /async\s+function[^{]*\{[^}]*\}/g,
      ext: ['js','ts','jsx','tsx'],
      check: (match) => !/await/.test(match),
    },
    {
      id: 'empty-catch',
      type: 'warning',
      msg: 'Bloco catch vazio — erros sendo ignorados silenciosamente',
      regex: /catch\s*\([^)]*\)\s*\{\s*\}/g,
      ext: ['js','ts','jsx','tsx'],
    },
    {
      id: 'var-usage',
      type: 'warning',
      msg: 'Uso de var — prefira const ou let',
      regex: /\bvar\s+\w+/g,
      ext: ['js','jsx'],
    },
    {
      id: 'any-type',
      type: 'warning',
      msg: 'Uso de tipo any — perde benefícios do TypeScript',
      regex: /:\s*any\b/g,
      ext: ['ts','tsx'],
    },
    {
      id: 'no-error-handling',
      type: 'warning',
      msg: 'Promise sem .catch() — erro pode passar despercebido',
      regex: /\.then\([^)]+\)(?!\s*\.catch)/g,
      ext: ['js','ts','jsx','tsx'],
    },
    {
      id: 'hardcoded-url',
      type: 'warning',
      msg: 'URL hardcoded — use variável de ambiente',
      regex: /['"]https?:\/\/localhost[^'"]*['"]/g,
      ext: ['js','ts','jsx','tsx'],
    },
    {
      id: 'debugger',
      type: 'warning',
      msg: 'Instrução debugger encontrada — remova antes de produção',
      regex: /\bdebugger\b/g,
      ext: ['js','ts','jsx','tsx'],
    },
    // TODOs e FIXMEs
    {
      id: 'todo',
      type: 'todo',
      msg: 'TODO encontrado',
      regex: /\/\/\s*TODO[:\s].*/gi,
      ext: ['js','ts','jsx','tsx','py','rb','php','java','go','rs'],
    },
    {
      id: 'fixme',
      type: 'todo',
      msg: 'FIXME encontrado — requer correção',
      regex: /\/\/\s*FIXME[:\s].*/gi,
      ext: ['js','ts','jsx','tsx','py','rb','php'],
    },
    {
      id: 'hack',
      type: 'todo',
      msg: 'HACK encontrado — solução temporária',
      regex: /\/\/\s*HACK[:\s].*/gi,
      ext: ['js','ts','jsx','tsx'],
    },
    // Info
    {
      id: 'large-file',
      type: 'info',
      msg: 'Arquivo muito grande — considere dividir em módulos',
      regex: null, // verificado por tamanho
      ext: ['js','ts','jsx','tsx'],
    },
    {
      id: 'deep-nesting',
      type: 'info',
      msg: 'Aninhamento profundo detectado — considere refatorar',
      regex: /\{\s*\{\s*\{\s*\{\s*\{/g,
      ext: ['js','ts','jsx','tsx'],
    },
  ];

  // ── Padrões de rotas ───────────────────────────────────────
  const ROUTE_PATTERNS = [
    // Express / Koa / Hapi
    { regex: /(?:app|router|server)\.(get|post|put|patch|delete|all|use)\s*\(\s*['"`]([^'"`]+)['"`]/gi,    fw: 'Express' },
    // Fastify
    { regex: /fastify\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi,                          fw: 'Fastify' },
    // NestJS decorators
    { regex: /@(Get|Post|Put|Patch|Delete|All)\s*\(\s*['"`]?([^'"`\)]*?)['"`]?\s*\)/gi,                   fw: 'NestJS' },
    // Next.js API routes (arquivo)
    { regex: null, fw: 'Next.js', filePattern: /pages\/api\/(.+)\.[jt]sx?$/ },
    // Next.js App Router
    { regex: null, fw: 'Next.js App', filePattern: /app\/(.+)\/route\.[jt]sx?$/ },
    // Express Router separado
    { regex: /router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi,                           fw: 'Express Router' },
    // WebSocket
    { regex: /(?:io|socket|wss?)\.on\s*\(\s*['"`]([^'"`]+)['"`]/gi,                                       fw: 'WebSocket', isWS: true },
    // Hapi
    { regex: /server\.route\s*\(\s*\{[^}]*method\s*:\s*['"`]([^'"`]+)['"`][^}]*path\s*:\s*['"`]([^'"`]+)['"`]/gi, fw: 'Hapi' },
  ];

  // ── Análise principal ──────────────────────────────────────
  function analyze() {
    const files = Shell.getState('projectFiles');
    if (!files || Object.keys(files).length === 0) {
      Shell.toast('Importe um projeto primeiro!', 'warning');
      Shell.navigate('importer');
      return;
    }

    bugs        = [];
    routes      = [];
    consoleLogs = [];
    frameworks  = [];
    totalLines  = 0;

    Shell.toast('Analisando código...', 'info', 1500);

    const allContent = Object.values(files).join('\n');

    // Detecta frameworks
    detectFrameworks(files, allContent);

    // Analisa cada arquivo
    for (const [path, content] of Object.entries(files)) {
      if (content.startsWith('[Arquivo binário')) continue;
      const ext = path.split('.').pop().toLowerCase();
      const lines = content.split('\n');
      totalLines += lines.length;

      // Bugs
      detectBugs(path, content, ext, lines);

      // Console.logs
      detectConsoleLogs(path, content, lines);

      // Rotas
      detectRoutes(path, content);

      // Arquivo grande
      if (lines.length > 500 && ['js','ts','jsx','tsx'].includes(ext)) {
        bugs.push({
          type: 'info',
          msg:  `Arquivo com ${lines.length} linhas — considere dividir`,
          file: path,
          line: 1,
          lineContent: `${lines.length} linhas de código`,
          id: 'large-file',
        });
      }
    }

    // Estrutura
    structureMap = buildStructureMap(files);

    // Salva no estado global
    Shell.setState('bugs',   bugs);
    Shell.setState('routes', routes);

    // Atualiza UI
    renderSummary();
    renderFrameworks();
    renderBugs();
    renderRoutes();
    renderConsoleLogs();
    renderStructure();
    renderRoutesPanel();

    document.getElementById('analyzer-empty').style.display   = 'none';
    document.getElementById('analyzer-content').style.display = 'block';
    document.getElementById('analysis-summary').style.display = 'grid';

    Shell.toast(
      `✅ Análise completa: ${bugs.length} ocorrências, ${routes.length} rotas`,
      'success'
    );
  }

  // ── Detectar frameworks ────────────────────────────────────
  function detectFrameworks(files, allContent) {
    const found = new Set();
    for (const fw of FW_PATTERNS) {
      for (const pattern of fw.patterns) {
        if (pattern.test(allContent)) {
          found.add(fw.name);
          break;
        }
      }
    }
    frameworks = [...found].map(name => FW_PATTERNS.find(f => f.name === name));
  }

  // ── Detectar bugs ──────────────────────────────────────────
  function detectBugs(path, content, ext, lines) {
    for (const pattern of BUG_PATTERNS) {
      if (!pattern.regex) continue;
      if (pattern.ext && !pattern.ext.includes(ext)) continue;

      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      let match;
      while ((match = regex.exec(content)) !== null) {
        // Verifica condição extra se existir
        if (pattern.check && !pattern.check(match[0])) continue;

        // Encontra número da linha
        const before = content.substring(0, match.index);
        const lineNum = before.split('\n').length;
        const lineContent = lines[lineNum - 1]?.trim() || '';

        // Limita a 3 ocorrências por padrão por arquivo
        const existing = bugs.filter(b => b.id === pattern.id && b.file === path);
        if (existing.length >= 3) break;

        bugs.push({
          id:          pattern.id,
          type:        pattern.type,
          msg:         pattern.msg,
          file:        path,
          line:        lineNum,
          lineContent: lineContent.substring(0, 120),
          match:       match[0].substring(0, 80),
        });
      }
    }
  }

  // ── Detectar console.logs ──────────────────────────────────
  function detectConsoleLogs(path, content, lines) {
    const ext = path.split('.').pop().toLowerCase();
    if (!['js','ts','jsx','tsx','mjs'].includes(ext)) return;

    const regex = /console\.(log|warn|error|info|debug|table|dir)\s*\(/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const before  = content.substring(0, match.index);
      const lineNum = before.split('\n').length;
      const lineContent = lines[lineNum - 1]?.trim() || '';

      consoleLogs.push({
        file:        path,
        line:        lineNum,
        method:      match[1],
        lineContent: lineContent.substring(0, 120),
      });
    }
  }

  // ── Detectar rotas ─────────────────────────────────────────
  function detectRoutes(path, content) {
    for (const pattern of ROUTE_PATTERNS) {

      // Next.js: detecta por nome de arquivo
      if (!pattern.regex && pattern.filePattern) {
        const m = path.match(pattern.filePattern);
        if (m) {
          const routePath = '/' + m[1].replace(/\[([^\]]+)\]/g, ':$1');
          routes.push({
            method:    'ALL',
            path:      routePath,
            file:      path,
            framework: pattern.fw,
            line:      1,
          });
        }
        continue;
      }

      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      let match;
      while ((match = regex.exec(content)) !== null) {
        const before  = content.substring(0, match.index);
        const lineNum = before.split('\n').length;

        let method = 'GET';
        let routePath = '/';

        if (pattern.isWS) {
          method    = 'WS';
          routePath = match[1] || '/';
        } else if (pattern.fw === 'NestJS') {
          method    = match[1].toUpperCase();
          routePath = match[2] || '/';
        } else if (pattern.fw === 'Hapi') {
          method    = match[1].toUpperCase();
          routePath = match[2] || '/';
        } else {
          method    = match[1].toUpperCase();
          routePath = match[2] || '/';
        }

        // Evita duplicatas
        const dup = routes.find(r =>
          r.method === method && r.path === routePath && r.file === path
        );
        if (!dup) {
          routes.push({ method, path: routePath, file: path, framework: pattern.fw, line: lineNum });
        }
      }
    }
  }

  // ── Construir mapa de estrutura ────────────────────────────
  function buildStructureMap(files) {
    const map = {};
    for (const path of Object.keys(files)) {
      const parts = path.split(/[/\\]/);
      let node = map;
      for (const part of parts) {
        if (!part) continue;
        if (!node[part]) node[part] = {};
        node = node[part];
      }
    }
    return map;
  }

  // ── Renderizar resumo ──────────────────────────────────────
  function renderSummary() {
    const errors   = bugs.filter(b => b.type === 'error').length;
    const warnings = bugs.filter(b => b.type === 'warning').length;
    const todos    = bugs.filter(b => b.type === 'todo').length;
    const files    = Object.keys(Shell.getState('projectFiles') || {}).length;

    setText('as-errors',   errors);
    setText('as-warnings', warnings);
    setText('as-todos',    todos);
    setText('as-routes',   routes.length);
    setText('as-files',    files);
    setText('as-lines',    totalLines.toLocaleString('pt-BR'));
    setText('tab-bugs-count',    `(${bugs.length})`);
    setText('tab-routes-count',  `(${routes.length})`);
    setText('tab-console-count', `(${consoleLogs.length})`);

    // Atualiza badge global
    Shell.updateBadges();
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // ── Renderizar frameworks ──────────────────────────────────
  function renderFrameworks() {
    const section = document.getElementById('fw-section');
    const list    = document.getElementById('fw-list');
    if (!section || !list) return;

    if (frameworks.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    list.innerHTML = frameworks.map(fw => `
      <div class="fw-badge" style="border-color:${fw.color}33; background:${fw.color}11; color:${fw.color}">
        <span>${fw.icon}</span>
        <span>${fw.name}</span>
      </div>`).join('');
  }

  // ── Renderizar bugs ────────────────────────────────────────
  function renderBugs() {
    const grid  = document.getElementById('bugs-grid');
    const empty = document.getElementById('bugs-empty');
    if (!grid) return;

    let filtered = [...bugs];
    if (currentBugFilter !== 'all') {
      filtered = filtered.filter(b => b.type === currentBugFilter);
    }

    if (filtered.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    grid.innerHTML = filtered.map(bug => `
      <div class="bug-card ${bug.type}">
        <div class="bug-header">
          <span class="bug-type ${bug.type}">${labelBugType(bug.type)}</span>
          <span class="bug-file" onclick="Importer.openFile('${bug.file.replace(/'/g,"\\'")}')">
            ${bug.file.split('/').pop()}
          </span>
        </div>
        <div class="bug-msg">${bug.msg}</div>
        ${bug.lineContent ? `
          <div class="bug-line">${escapeHtml(bug.lineContent)}</div>
          <div class="bug-location">📍 ${bug.file} — linha ${bug.line}</div>
        ` : ''}
      </div>`).join('');
  }

  function labelBugType(t) {
    return { error:'❌ Erro', warning:'⚠️ Aviso', todo:'📝 TODO', info:'ℹ️ Info' }[t] || t;
  }

  function setBugFilter(filter, el) {
    currentBugFilter = filter;
    document.querySelectorAll('#tab-panel-bugs .filter-chip').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
    renderBugs();
  }

  // ── Renderizar console.logs ────────────────────────────────
  function renderConsoleLogs() {
    const grid  = document.getElementById('console-grid');
    const empty = document.getElementById('console-empty');
    if (!grid) return;

    if (consoleLogs.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    grid.innerHTML = consoleLogs.map(cl => `
      <div class="bug-card warning">
        <div class="bug-header">
          <span class="bug-type warning">🖨️ console.${cl.method}</span>
          <span class="bug-file" onclick="Importer.openFile('${cl.file.replace(/'/g,"\\'")}')">
            ${cl.file.split('/').pop()}
          </span>
        </div>
        <div class="bug-msg">console.${cl.method}() — remova antes de produção</div>
        <div class="bug-line">${escapeHtml(cl.lineContent)}</div>
        <div class="bug-location">📍 ${cl.file} — linha ${cl.line}</div>
      </div>`).join('');
  }

  // ── Renderizar rotas (tab resumo) ──────────────────────────
  function renderRoutes() {
    const list = document.getElementById('routes-summary-list');
    if (!list) return;

    if (routes.length === 0) {
      list.innerHTML = '<div style="color:var(--text-muted); font-size:13px; padding:20px 0;">Nenhuma rota detectada</div>';
      return;
    }

    // Agrupa por framework
    const byFW = {};
    for (const r of routes) {
      if (!byFW[r.framework]) byFW[r.framework] = [];
      byFW[r.framework].push(r);
    }

    list.innerHTML = Object.entries(byFW).map(([fw, rs]) => `
      <div class="routes-group-title">📦 ${fw} (${rs.length})</div>
      ${rs.slice(0, 20).map(r => routeCardHTML(r)).join('')}
      ${rs.length > 20 ? `<div style="color:var(--text-muted); font-size:12px; padding:8px;">... e mais ${rs.length-20} rotas</div>` : ''}
    `).join('');
  }

  // ── Renderizar painel completo de rotas ────────────────────
  function renderRoutesPanel() {
    const list  = document.getElementById('routes-full-list');
    const empty = document.getElementById('routes-empty');
    if (!list) return;

    let filtered = [...routes];
    if (currentRouteFilter !== 'all') {
      filtered = filtered.filter(r => r.method === currentRouteFilter);
    }

    if (filtered.length === 0) {
      list.style.display = 'none';
      if (empty) empty.style.display = 'block';
      return;
    }

    if (empty) empty.style.display = 'none';
    list.style.display = 'flex';
    list.innerHTML = filtered.map(r => routeCardHTML(r)).join('');
  }

  function routeCardHTML(r) {
    return `
      <div class="route-card" onclick="Importer.openFile('${r.file.replace(/'/g,"\\'")}')">
        <span class="route-method ${r.method}">${r.method}</span>
        <span class="route-path">${r.path}</span>
        <span class="route-framework">${r.framework}</span>
        <span class="route-file">${r.file.split('/').pop()}:${r.line}</span>
      </div>`;
  }

  function setRouteFilter(filter, el) {
    currentRouteFilter = filter;
    document.querySelectorAll('#routes-method-filters .filter-chip').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
    renderRoutesPanel();
  }

  // ── Renderizar estrutura ───────────────────────────────────
  function renderStructure() {
    const display = document.getElementById('structure-display');
    const chart   = document.getElementById('file-types-chart');
    if (!display) return;

    display.innerHTML = renderStructureNode(structureMap, '', true);

    // Contagem por tipo
    const files = Shell.getState('projectFiles') || {};
    const types = {};
    for (const f of Object.keys(files)) {
      const ext = f.split('.').pop().toLowerCase();
      types[ext] = (types[ext] || 0) + 1;
    }

    const sorted = Object.entries(types).sort((a,b) => b[1]-a[1]).slice(0, 10);
    if (chart) {
      chart.innerHTML = `
        <div class="card">
          <div class="card-title">📊 Tipos de Arquivo</div>
          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            ${sorted.map(([ext, count]) => `
              <div style="background:var(--bg-hover); border:1px solid var(--border);
                          border-radius:var(--radius); padding:6px 12px; font-size:12px;">
                <span style="font-family:var(--font-mono); color:var(--accent)">.${ext}</span>
                <span style="color:var(--text-secondary); margin-left:6px;">${count} arquivo${count>1?'s':''}</span>
              </div>`).join('')}
          </div>
        </div>`;
    }
  }

  function renderStructureNode(node, prefix, isRoot) {
    let html = '';
    const entries = Object.entries(node).sort(([a],[b]) => a.localeCompare(b));
    entries.forEach(([name, val], idx) => {
      const isLast   = idx === entries.length - 1;
      const isDir    = Object.keys(val).length > 0;
      const connector = isRoot ? '' : (isLast ? '└── ' : '├── ');
      const childPfx  = isRoot ? '' : (isLast ? '    ' : '│   ');

      if (isDir) {
        html += `${prefix}${connector}<span class="st-dir">📁 ${name}/</span>\n`;
        html += renderStructureNode(val, prefix + childPfx, false);
      } else {
        const ext = name.split('.').pop().toLowerCase();
        const keyFiles = ['package.json','index.js','index.ts','app.js','app.ts','main.js','main.ts',
                          'server.js','server.ts','.env','.gitignore','README.md','Dockerfile'];
        const isKey = keyFiles.includes(name);
        html += `${prefix}${connector}<span class="${isKey ? 'st-key' : 'st-file'}">${name}</span>\n`;
      }
    });
    return html;
  }

  // ── Tabs ───────────────────────────────────────────────────
  function setTab(tab, el) {
    currentTab = tab;
    ['bugs','routes','structure','console'].forEach(t => {
      const panel = document.getElementById(`tab-panel-${t}`);
      if (panel) panel.style.display = t === tab ? 'block' : 'none';
    });
    document.querySelectorAll('.analyzer-tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
    else {
      const target = document.querySelector(`[data-tab="${tab}"]`);
      if (target) target.classList.add('active');
    }
  }

  // ── Copiar / Exportar rotas ────────────────────────────────
  function copyRoutes() {
    if (routes.length === 0) { Shell.toast('Nenhuma rota para copiar', 'warning'); return; }
    const text = routes.map(r => `${r.method.padEnd(8)} ${r.path.padEnd(40)} [${r.framework}] ${r.file}:${r.line}`).join('\n');
    navigator.clipboard.writeText(text)
      .then(() => Shell.toast(`${routes.length} rotas copiadas!`, 'success'))
      .catch(() => Shell.toast('Erro ao copiar', 'error'));
  }

  function exportRoutes() {
    if (routes.length === 0) { Shell.toast('Nenhuma rota para exportar', 'warning'); return; }
    let md = `# 🛣️ Rotas de API\n\n`;
    md += `> Gerado pelo ProjetoLens em ${new Date().toLocaleDateString('pt-BR')}\n\n`;
    md += `**Total:** ${routes.length} rotas detectadas\n\n`;

    const byFW = {};
    for (const r of routes) {
      if (!byFW[r.framework]) byFW[r.framework] = [];
      byFW[r.framework].push(r);
    }

    for (const [fw, rs] of Object.entries(byFW)) {
      md += `## ${fw}\n\n`;
      md += `| Método | Rota | Arquivo | Linha |\n`;
      md += `|--------|------|---------|-------|\n`;
      for (const r of rs) {
        md += `| \`${r.method}\` | \`${r.path}\` | ${r.file} | ${r.line} |\n`;
      }
      md += '\n';
    }

    download('rotas-api.md', md, 'text/markdown');
    Shell.toast('Rotas exportadas!', 'success');
  }

  // ── Copiar / Exportar estrutura ────────────────────────────
  function copyStructure() {
    const el = document.getElementById('structure-display');
    if (!el) return;
    navigator.clipboard.writeText(el.innerText)
      .then(() => Shell.toast('Estrutura copiada!', 'success'))
      .catch(() => Shell.toast('Erro ao copiar', 'error'));
  }

  function exportStructure() {
    const el = document.getElementById('structure-display');
    if (!el) return;
    const md = `# 🗂️ Estrutura do Projeto\n\n\`\`\`\n${el.innerText}\n\`\`\`\n`;
    download('estrutura.md', md, 'text/markdown');
    Shell.toast('Estrutura exportada!', 'success');
  }

  // ── Exportar relatório completo ────────────────────────────
  function exportReport() {
    if (bugs.length === 0 && routes.length === 0) {
      Shell.toast('Analise o projeto primeiro', 'warning');
      return;
    }

    const projectName = Shell.getState('projectName') || 'Projeto';
    let md = `# 🔍 Relatório de Análise — ${projectName}\n\n`;
    md += `> Gerado pelo ProjetoLens em ${new Date().toLocaleDateString('pt-BR')}\n\n`;

    // Frameworks
    if (frameworks.length > 0) {
      md += `## 🏗️ Tecnologias Detectadas\n\n`;
      md += frameworks.map(f => `- ${f.icon} **${f.name}**`).join('\n');
      md += '\n\n';
    }

    // Resumo
    md += `## 📊 Resumo\n\n`;
    md += `| Item | Quantidade |\n|------|------------|\n`;
    md += `| Erros críticos | ${bugs.filter(b=>b.type==='error').length} |\n`;
    md += `| Avisos | ${bugs.filter(b=>b.type==='warning').length} |\n`;
    md += `| TODOs/FIXMEs | ${bugs.filter(b=>b.type==='todo').length} |\n`;
    md += `| Console.logs | ${consoleLogs.length} |\n`;
    md += `| Rotas de API | ${routes.length} |\n`;
    md += `| Total de linhas | ${totalLines.toLocaleString('pt-BR')} |\n\n`;

    // Bugs
    if (bugs.length > 0) {
      md += `## 🐛 Problemas Encontrados\n\n`;
      for (const b of bugs) {
        md += `### ${labelBugType(b.type)}: ${b.msg}\n`;
        md += `- **Arquivo:** \`${b.file}\` — linha ${b.line}\n`;
        if (b.lineContent) md += `- **Código:** \`${b.lineContent}\`\n`;
        md += '\n';
      }
    }

    // Rotas
    if (routes.length > 0) {
      md += `## 🛣️ Rotas de API\n\n`;
      md += `| Método | Rota | Framework | Arquivo |\n`;
      md += `|--------|------|-----------|--------|\n`;
      for (const r of routes) {
        md += `| \`${r.method}\` | \`${r.path}\` | ${r.framework} | ${r.file}:${r.line} |\n`;
      }
      md += '\n';
    }

    download('relatorio-analise.md', md, 'text/markdown');
    Shell.toast('Relatório exportado!', 'success');
  }

  // ── Helpers ────────────────────────────────────────────────
  function escapeHtml(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function download(filename, content, type) {
    const blob = new Blob([content], { type });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    // Restaura análise salva
    window.addEventListener('shell:navigate', (e) => {
      const id = e.detail.moduleId;
      if (id === 'analyzer' || id === 'routes') {
        const savedBugs   = Shell.getState('bugs')   || [];
        const savedRoutes = Shell.getState('routes') || [];
        if (savedBugs.length > 0 && bugs.length === 0) {
          bugs   = savedBugs;
          routes = savedRoutes;
          renderSummary();
          renderBugs();
          renderRoutes();
          renderConsoleLogs();
          document.getElementById('analyzer-empty').style.display   = 'none';
          document.getElementById('analyzer-content').style.display = 'block';
          document.getElementById('analysis-summary').style.display = 'grid';
        }
        if (id === 'routes') renderRoutesPanel();
      }
    });
  }

  // ── API Pública ────────────────────────────────────────────
  return {
    init, analyze,
    setTab, setBugFilter, setRouteFilter,
    copyRoutes, exportRoutes,
    copyStructure, exportStructure,
    exportReport,
    getBugs:   () => bugs,
    getRoutes: () => routes,
    getFrameworks: () => frameworks,
  };

})();

document.addEventListener('DOMContentLoaded', CodeAnalyzer.init);
