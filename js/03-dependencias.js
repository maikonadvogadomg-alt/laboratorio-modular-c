
// ============================================================
//  MÓDULO 3 — ANALISADOR DE DEPENDÊNCIAS
//  Monorepo, NPM Registry, CDN, classificação PT-BR
// ============================================================

const DepsAnalyzer = (() => {

  // Estado interno
  let allPackages   = [];  // [ { path, name, deps, devDeps, peerDeps, json } ]
  let allDeps       = [];  // lista flat de todas as deps
  let currentFilter = 'all';
  let currentSearch = '';
  let currentPkg    = 'all';
  let npmCache      = {};  // cache de buscas NPM

  // ── Classificação de relevância ────────────────────────────
  const RELEVANCE = {
    // Frameworks principais → relevante
    relevante: [
      'react','react-dom','vue','angular','svelte','next','nuxt','remix',
      'express','fastify','koa','hapi','nestjs','@nestjs/core',
      'typescript','vite','webpack','rollup','esbuild','parcel',
      'prisma','mongoose','sequelize','typeorm','drizzle-orm',
      'tailwindcss','styled-components','@emotion/react',
      'axios','node-fetch','got','ky',
      'socket.io','ws','@trpc/server',
      'jsonwebtoken','bcrypt','bcryptjs','passport',
      'dotenv','zod','joi','yup',
      'react-router','react-router-dom','vue-router',
      'redux','@reduxjs/toolkit','zustand','pinia','mobx',
      'jest','vitest','@testing-library/react',
      'electron','@capacitor/core','react-native',
    ],
    // Utilitários comuns → opcional
    opcional: [
      'lodash','underscore','ramda','date-fns','moment','dayjs',
      'uuid','nanoid','chalk','colors','kleur',
      'cors','helmet','morgan','compression',
      'multer','sharp','jimp',
      'nodemailer','sendgrid',
      'redis','ioredis','bull','bullmq',
      'winston','pino','bunyan',
      'cheerio','puppeteer','playwright',
    ],
    // Facilmente substituíveis por CDN ou nativo → substituível
    substituivel: [
      'jquery','bootstrap','font-awesome','@fortawesome/fontawesome-free',
      'animate.css','normalize.css','reset-css',
      'classnames','clsx',
      'query-string','qs',
      'mime','mime-types',
      'path-browserify','buffer','stream-browserify',
    ],
  };

  // CDNs conhecidas
  const CDN_KNOWN = {
    'react':           { jsdelivr: 'https://cdn.jsdelivr.net/npm/react@{v}/umd/react.production.min.js', type: 'script' },
    'react-dom':       { jsdelivr: 'https://cdn.jsdelivr.net/npm/react-dom@{v}/umd/react-dom.production.min.js', type: 'script' },
    'vue':             { jsdelivr: 'https://cdn.jsdelivr.net/npm/vue@{v}/dist/vue.global.prod.js', type: 'script' },
    'jquery':          { jsdelivr: 'https://cdn.jsdelivr.net/npm/jquery@{v}/dist/jquery.min.js', type: 'script' },
    'bootstrap':       { jsdelivr: 'https://cdn.jsdelivr.net/npm/bootstrap@{v}/dist/css/bootstrap.min.css', type: 'link' },
    'axios':           { jsdelivr: 'https://cdn.jsdelivr.net/npm/axios@{v}/dist/axios.min.js', type: 'script' },
    'lodash':          { jsdelivr: 'https://cdn.jsdelivr.net/npm/lodash@{v}/lodash.min.js', type: 'script' },
    'moment':          { jsdelivr: 'https://cdn.jsdelivr.net/npm/moment@{v}/moment.min.js', type: 'script' },
    'dayjs':           { jsdelivr: 'https://cdn.jsdelivr.net/npm/dayjs@{v}/dayjs.min.js', type: 'script' },
    'tailwindcss':     { jsdelivr: 'https://cdn.jsdelivr.net/npm/tailwindcss@{v}/dist/tailwind.min.css', type: 'link' },
    'socket.io':       { jsdelivr: 'https://cdn.jsdelivr.net/npm/socket.io-client@{v}/dist/socket.io.min.js', type: 'script' },
    'chart.js':        { jsdelivr: 'https://cdn.jsdelivr.net/npm/chart.js@{v}/dist/chart.umd.min.js', type: 'script' },
    'three':           { jsdelivr: 'https://cdn.jsdelivr.net/npm/three@{v}/build/three.min.js', type: 'script' },
    'gsap':            { jsdelivr: 'https://cdn.jsdelivr.net/npm/gsap@{v}/dist/gsap.min.js', type: 'script' },
    'alpinejs':        { jsdelivr: 'https://cdn.jsdelivr.net/npm/alpinejs@{v}/dist/cdn.min.js', type: 'script' },
    'htmx.org':        { jsdelivr: 'https://cdn.jsdelivr.net/npm/htmx.org@{v}/dist/htmx.min.js', type: 'script' },
    'zod':             { jsdelivr: 'https://cdn.jsdelivr.net/npm/zod@{v}/lib/index.umd.js', type: 'script' },
    'uuid':            { jsdelivr: 'https://cdn.jsdelivr.net/npm/uuid@{v}/dist/umd/uuid.min.js', type: 'script' },
    'classnames':      { jsdelivr: 'https://cdn.jsdelivr.net/npm/classnames@{v}/index.js', type: 'script' },
    'clsx':            { jsdelivr: 'https://cdn.jsdelivr.net/npm/clsx@{v}/dist/clsx.min.js', type: 'script' },
  };

  // Traduções PT-BR de descrições comuns
  const TRANSLATIONS = {
    'A JavaScript library for building user interfaces': 'Biblioteca JavaScript para construir interfaces de usuário',
    'React package for working with the DOM': 'Pacote React para trabalhar com o DOM',
    'The progressive JavaScript framework': 'O framework JavaScript progressivo',
    'Fast, unopinionated, minimalist web framework': 'Framework web rápido e minimalista',
    'Next generation web framework for Node.js': 'Framework web de próxima geração para Node.js',
    'TypeScript is a language for application scale JavaScript development': 'TypeScript é uma linguagem para desenvolvimento JavaScript em escala',
    'Next-generation ORM for Node.js and TypeScript': 'ORM de próxima geração para Node.js e TypeScript',
    'A utility-first CSS framework': 'Framework CSS utilitário',
    'Promise based HTTP client for the browser and node.js': 'Cliente HTTP baseado em Promises para browser e Node.js',
    'Lodash modular utilities': 'Utilitários modulares Lodash',
    'Parse, validate, manipulate, and display dates': 'Analisar, validar, manipular e exibir datas',
    'A modern JavaScript date utility library': 'Biblioteca moderna de utilitários de data em JavaScript',
    'Load environment variables from .env file': 'Carrega variáveis de ambiente do arquivo .env',
    'Simple, fast, and fun package manager': 'Gerenciador de pacotes simples, rápido e divertido',
    'TypeScript-first schema validation': 'Validação de esquema com TypeScript em primeiro lugar',
    'Blazing fast unit test framework': 'Framework de testes unitários extremamente rápido',
    'Delightful JavaScript Testing': 'Testes JavaScript deliciosos',
    'Simple and fast JSON Web Token authentication': 'Autenticação JWT simples e rápida',
    'A library for hashing passwords': 'Biblioteca para hash de senhas',
    'Realtime application framework (client)': 'Framework de aplicação em tempo real (cliente)',
    'A bundler for javascript and typescript': 'Empacotador para JavaScript e TypeScript',
    'Next generation frontend tooling': 'Ferramentas de frontend de próxima geração',
  };

  function translateDesc(desc) {
    if (!desc) return 'Sem descrição disponível';
    // Tenta tradução exata
    for (const [en, pt] of Object.entries(TRANSLATIONS)) {
      if (desc.toLowerCase().includes(en.toLowerCase())) return pt;
    }
    return desc; // retorna original se não traduzir
  }

  // ── Classificar dependência ────────────────────────────────
  function classifyDep(name) {
    const n = name.toLowerCase().replace(/^@[^/]+\//, '');
    for (const [cat, list] of Object.entries(RELEVANCE)) {
      if (list.some(item => name.includes(item) || item.includes(n))) return cat;
    }
    return 'opcional';
  }

  // ── Gerar CDN tag ──────────────────────────────────────────
  function getCDNTag(name, version) {
    const v = version.replace(/[\^~>=<]/g, '').split(' ')[0] || 'latest';
    const known = CDN_KNOWN[name];
    if (known) {
      const url = known.jsdelivr.replace('{v}', v);
      if (known.type === 'script') return `<script src="${url}"><\/script>`;
      if (known.type === 'link')   return `<link rel="stylesheet" href="${url}">`;
    }
    // Genérico via unpkg
    return `<script src="https://unpkg.com/${name}@${v}"><\/script>`;
  }

  function hasCDN(name) {
    return !!CDN_KNOWN[name];
  }

  // ── Analisar projeto ───────────────────────────────────────
  function analyze() {
    const files = Shell.getState('projectFiles');
    if (!files || Object.keys(files).length === 0) {
      Shell.toast('Importe um projeto primeiro!', 'warning');
      Shell.navigate('importer');
      return;
    }

    allPackages = [];
    allDeps     = [];

    // Encontra TODOS os package.json
    const pkgFiles = Object.keys(files).filter(p =>
      p.endsWith('package.json') &&
      !p.includes('node_modules') &&
      !p.includes('.cache')
    );

    if (pkgFiles.length === 0) {
      Shell.toast('Nenhum package.json encontrado no projeto', 'warning');
      document.getElementById('deps-empty').innerHTML = `
        <div style="font-size:48px; margin-bottom:12px;">📭</div>
        <div style="font-size:15px; margin-bottom:8px;">Nenhum package.json encontrado</div>
        <div style="font-size:13px; color:var(--text-secondary);">
          O projeto pode usar outro gerenciador (Python, Ruby, etc.) ou não ter dependências declaradas.
        </div>`;
      return;
    }

    // Processa cada package.json
    for (const pkgPath of pkgFiles) {
      try {
        const json = JSON.parse(files[pkgPath]);
        const pkg = {
          path:     pkgPath,
          name:     json.name || pkgPath.split('/').slice(-2)[0] || 'raiz',
          version:  json.version || '0.0.0',
          desc:     json.description || '',
          deps:     json.dependencies     || {},
          devDeps:  json.devDependencies  || {},
          peerDeps: json.peerDependencies || {},
          scripts:  json.scripts          || {},
          json,
        };
        allPackages.push(pkg);

        // Adiciona deps à lista flat
        for (const [name, version] of Object.entries(pkg.deps)) {
          addDep(name, version, 'prod', pkg.name);
        }
        for (const [name, version] of Object.entries(pkg.devDeps)) {
          addDep(name, version, 'dev', pkg.name);
        }
        for (const [name, version] of Object.entries(pkg.peerDeps)) {
          addDep(name, version, 'peer', pkg.name);
        }
      } catch(e) {
        Shell.toast(`Erro ao ler ${pkgPath}: ${e.message}`, 'error');
      }
    }

    // Remove duplicatas (mantém prod sobre dev)
    const seen = {};
    allDeps = allDeps.filter(d => {
      if (seen[d.name]) {
        if (d.type === 'prod') seen[d.name].type = 'prod';
        seen[d.name].packages.push(...d.packages);
        return false;
      }
      seen[d.name] = d;
      return true;
    });

    // Salva no estado global
    Shell.setState('dependencies', allDeps);

    // Atualiza UI
    renderSummary();
    renderPkgTabs();
    renderDeps();
    showToolbar();

    // Monorepo?
    if (allPackages.length > 1) {
      showMonorepoBanner();
    }

    Shell.toast(`✅ ${allDeps.length} dependências em ${allPackages.length} package.json`, 'success');
  }

  function addDep(name, version, type, pkgName) {
    allDeps.push({
      name, version, type,
      packages:    [pkgName],
      relevance:   classifyDep(name),
      hasCDN:      hasCDN(name),
      cdnTag:      getCDNTag(name, version),
      description: null, // será buscado depois
    });
  }

  // ── Renderizar resumo ──────────────────────────────────────
  function renderSummary() {
    const summary = document.getElementById('deps-summary');
    if (summary) summary.style.display = 'grid';

    const prod = allDeps.filter(d => d.type === 'prod').length;
    const dev  = allDeps.filter(d => d.type === 'dev').length;
    const cdn  = allDeps.filter(d => d.hasCDN).length;

    setText('ds-total', allDeps.length);
    setText('ds-prod',  prod);
    setText('ds-dev',   dev);
    setText('ds-cdn',   cdn);
    setText('ds-pkg',   allPackages.length);
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // ── Tabs de package.json ───────────────────────────────────
  function renderPkgTabs() {
    const tabs = document.getElementById('pkg-tabs');
    if (!tabs) return;
    tabs.style.display = 'flex';

    let html = `<button class="pkg-tab active" data-pkg="all" onclick="DepsAnalyzer.setPkg('all',this)">
      📦 Todos (${allDeps.length})
    </button>`;

    for (const pkg of allPackages) {
      const count = allDeps.filter(d => d.packages.includes(pkg.name)).length;
      html += `<button class="pkg-tab" data-pkg="${pkg.name}"
        onclick="DepsAnalyzer.setPkg('${pkg.name.replace(/'/g,"\\'")}',this)">
        📋 ${pkg.name} (${count})
      </button>`;
    }

    tabs.innerHTML = html;
  }

  function setPkg(pkg, el) {
    currentPkg = pkg;
    document.querySelectorAll('.pkg-tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
    renderDeps();
  }

  // ── Filtros ────────────────────────────────────────────────
  function setFilter(filter, el) {
    currentFilter = filter;
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
    renderDeps();
  }

  function filterDeps(search) {
    currentSearch = search.toLowerCase();
    renderDeps();
  }

  // ── Renderizar deps ────────────────────────────────────────
  function renderDeps() {
    const grid  = document.getElementById('dep-grid');
    const empty = document.getElementById('deps-empty');
    if (!grid) return;

    let deps = [...allDeps];

    // Filtro por package
    if (currentPkg !== 'all') {
      deps = deps.filter(d => d.packages.includes(currentPkg));
    }

    // Filtro por tipo/relevância
    if (currentFilter === 'prod')        deps = deps.filter(d => d.type === 'prod');
    else if (currentFilter === 'dev')    deps = deps.filter(d => d.type === 'dev');
    else if (currentFilter === 'cdn')    deps = deps.filter(d => d.hasCDN);
    else if (currentFilter !== 'all')    deps = deps.filter(d => d.relevance === currentFilter);

    // Filtro por busca
    if (currentSearch) {
      deps = deps.filter(d =>
        d.name.toLowerCase().includes(currentSearch) ||
        (d.description || '').toLowerCase().includes(currentSearch)
      );
    }

    if (deps.length === 0) {
      grid.innerHTML = '';
      if (empty) {
        empty.style.display = 'block';
        empty.innerHTML = `
          <div style="font-size:48px; margin-bottom:12px;">🔍</div>
          <div style="font-size:15px;">Nenhuma dependência encontrada</div>
          <div style="font-size:13px; color:var(--text-secondary); margin-top:6px;">
            Tente mudar os filtros ou buscar outro termo
          </div>`;
      }
      return;
    }

    if (empty) empty.style.display = 'none';

    grid.innerHTML = deps.map(dep => renderDepCard(dep)).join('');
  }

  function renderDepCard(dep) {
    const typeLabel = dep.type === 'dev' ? 'dev' : dep.type === 'peer' ? 'peer' : 'prod';
    const desc = dep.description
      ? dep.description
      : '<span class="loading"><span class="dep-spinner"></span> Clique em "Buscar Descrições NPM"</span>';

    const cdnSection = dep.hasCDN ? `
      <div class="dep-cdn-row" onclick="DepsAnalyzer.copyCDN('${dep.name.replace(/'/g,"\\'")}',this)"
           title="Clique para copiar">
        📋 ${escapeHtml(dep.cdnTag)}
      </div>` : '';

    const pkgsLabel = dep.packages.length > 1
      ? `<span class="dep-tag peer">usado em ${dep.packages.length} pkgs</span>`
      : '';

    return `
      <div class="dep-card ${dep.relevance}" id="dep-card-${dep.name.replace(/[^a-z0-9]/gi,'_')}">
        <div class="dep-card-header">
          <div class="dep-name">${dep.name}</div>
          <div class="dep-version">${dep.version}</div>
        </div>
        <div class="dep-desc" id="dep-desc-${dep.name.replace(/[^a-z0-9]/gi,'_')}">${desc}</div>
        <div class="dep-tags">
          <span class="dep-tag ${dep.relevance}">${labelRelevance(dep.relevance)}</span>
          <span class="dep-tag ${typeLabel}">${typeLabel}</span>
          ${dep.hasCDN ? '<span class="dep-tag cdn">CDN ✓</span>' : ''}
          ${pkgsLabel}
        </div>
        ${cdnSection}
        <div class="dep-actions">
          <button onclick="DepsAnalyzer.openNPM('${dep.name}')">🔗 NPM</button>
          <button onclick="DepsAnalyzer.fetchSingleDesc('${dep.name.replace(/'/g,"\\'")}')">🌐 Buscar info</button>
          ${dep.hasCDN ? `<button onclick="DepsAnalyzer.copyCDN('${dep.name.replace(/'/g,"\\'")}',this)">📋 Copiar CDN</button>` : ''}
          <button onclick="DepsAnalyzer.changeRelevance('${dep.name.replace(/'/g,"\\'")}')">🏷️ Classificar</button>
        </div>
      </div>`;
  }

  function labelRelevance(r) {
    const map = {
      relevante:    '✅ Relevante',
      opcional:     '⚠️ Opcional',
      substituivel: '🔄 Substituível',
      dev:          '🔧 Dev',
    };
    return map[r] || r;
  }

  // ── Toolbar visível ────────────────────────────────────────
  function showToolbar() {
    ['deps-toolbar','deps-filter-row'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'flex';
    });
    const btnUnify = document.getElementById('btn-unify');
    if (btnUnify && allPackages.length > 1) btnUnify.style.display = '';
  }

  // ── Monorepo banner ────────────────────────────────────────
  function showMonorepoBanner() {
    const banner = document.getElementById('monorepo-banner');
    const info   = document.getElementById('monorepo-info');
    if (banner) banner.style.display = 'flex';
    if (info) info.textContent =
      `${allPackages.length} package.json encontrados: ${allPackages.map(p=>p.name).join(', ')}`;
  }

  // ── Buscar descrições no NPM ───────────────────────────────
  async function fetchAllDescriptions() {
    if (allDeps.length === 0) { Shell.toast('Analise o projeto primeiro', 'warning'); return; }

    const progress = document.getElementById('deps-fetch-progress');
    const bar      = document.getElementById('deps-fetch-bar');
    const text     = document.getElementById('deps-fetch-text');
    const sub      = document.getElementById('deps-fetch-sub');
    if (progress) progress.style.display = 'block';

    let done = 0;
    const total = allDeps.length;

    for (const dep of allDeps) {
      if (npmCache[dep.name]) {
        dep.description = npmCache[dep.name];
        done++;
        continue;
      }

      if (text) text.textContent = `Buscando: ${dep.name}`;
      if (sub)  sub.textContent  = `${done}/${total} concluídos`;
      if (bar)  bar.style.width  = `${(done/total)*100}%`;

      try {
        const res  = await fetch(`https://registry.npmjs.org/${dep.name}/latest`, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = await res.json();
          const rawDesc = data.description || '';
          dep.description = translateDesc(rawDesc);
          npmCache[dep.name] = dep.description;
        } else {
          dep.description = 'Informação não disponível no NPM';
        }
      } catch(e) {
        dep.description = 'Sem conexão ou pacote não encontrado';
      }

      // Atualiza card em tempo real
      updateDepDesc(dep.name, dep.description);
      done++;
      await new Promise(r => setTimeout(r, 80)); // evita rate limit
    }

    if (progress) progress.style.display = 'none';
    Shell.setState('dependencies', allDeps);
    Shell.toast(`✅ Descrições carregadas para ${done} dependências`, 'success');
    renderDeps();
  }

  async function fetchSingleDesc(name) {
    const dep = allDeps.find(d => d.name === name);
    if (!dep) return;

    if (npmCache[name]) {
      dep.description = npmCache[name];
      updateDepDesc(name, dep.description);
      return;
    }

    updateDepDesc(name, '<span class="loading"><span class="dep-spinner"></span> Buscando...</span>');

    try {
      const res  = await fetch(`https://registry.npmjs.org/${name}/latest`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        dep.description = translateDesc(data.description || '');
        npmCache[name]  = dep.description;
      } else {
        dep.description = 'Pacote não encontrado no NPM';
      }
    } catch(e) {
      dep.description = 'Erro ao buscar — verifique a conexão';
    }

    updateDepDesc(name, dep.description);
    Shell.setState('dependencies', allDeps);
  }

  function updateDepDesc(name, desc) {
    const id = `dep-desc-${name.replace(/[^a-z0-9]/gi,'_')}`;
    const el = document.getElementById(id);
    if (el) el.innerHTML = desc;
  }

  // ── Copiar CDN ─────────────────────────────────────────────
  function copyCDN(name, el) {
    const dep = allDeps.find(d => d.name === name);
    if (!dep) return;
    navigator.clipboard.writeText(dep.cdnTag)
      .then(() => { Shell.toast(`CDN de ${name} copiado!`, 'success'); })
      .catch(() => Shell.toast('Erro ao copiar', 'error'));
  }

  function copyAllCDN() {
    const tags = allDeps.filter(d => d.hasCDN).map(d => d.cdnTag).join('\n');
    if (!tags) { Shell.toast('Nenhuma CDN disponível', 'warning'); return; }
    navigator.clipboard.writeText(tags)
      .then(() => Shell.toast(`${allDeps.filter(d=>d.hasCDN).length} tags CDN copiadas!`, 'success'))
      .catch(() => Shell.toast('Erro ao copiar', 'error'));
  }

  function downloadCDNFile() {
    const tags = allDeps.filter(d => d.hasCDN).map(d => d.cdnTag).join('\n');
    const html = `<!DOCTYPE html>\n<html>\n<head>\n<!-- CDNs geradas pelo ProjetoLens -->\n${tags}\n</head>\n<body></body>\n</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'cdns.html'; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Abrir NPM ──────────────────────────────────────────────
  function openNPM(name) {
    window.open(`https://www.npmjs.com/package/${name}`, '_blank');
  }

  // ── Mudar relevância manualmente ───────────────────────────
  function changeRelevance(name) {
    const dep = allDeps.find(d => d.name === name);
    if (!dep) return;
    Shell.openModal(`🏷️ Classificar: ${name}`, `
      <p style="color:var(--text-secondary); margin-bottom:14px; font-size:13px;">
        Escolha a classificação para <strong>${name}</strong>:
      </p>
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${['relevante','opcional','substituivel'].map(r => `
          <button class="btn ${dep.relevance===r?'btn-primary':'btn-secondary'}"
            onclick="DepsAnalyzer._setRelevance('${name}','${r}'); Shell.closeModal();">
            ${labelRelevance(r)}
          </button>`).join('')}
      </div>
    `);
  }

  function _setRelevance(name, relevance) {
    const dep = allDeps.find(d => d.name === name);
    if (dep) {
      dep.relevance = relevance;
      Shell.setState('dependencies', allDeps);
      renderDeps();
      Shell.toast(`${name} → ${labelRelevance(relevance)}`, 'success');
    }
  }

  // ── Unificar monorepo ──────────────────────────────────────
  function unifyMonorepo() {
    if (allPackages.length === 0) { Shell.toast('Analise o projeto primeiro', 'warning'); return; }

    // Junta todas as deps
    const unified = { dependencies: {}, devDependencies: {} };
    for (const pkg of allPackages) {
      Object.assign(unified.dependencies,    pkg.deps);
      Object.assign(unified.devDependencies, pkg.devDeps);
    }

    // Remove devDeps que já estão em deps
    for (const k of Object.keys(unified.dependencies)) {
      delete unified.devDependencies[k];
    }

    const root = allPackages[0];
    const result = {
      name:             root.json.name || 'projeto-unificado',
      version:          root.json.version || '1.0.0',
      description:      root.json.description || '',
      scripts:          root.json.scripts || {},
      dependencies:     unified.dependencies,
      devDependencies:  unified.devDependencies,
    };

    const jsonStr = JSON.stringify(result, null, 2);

    Shell.openModal('🔗 package.json Unificado', `
      <p style="color:var(--text-secondary); font-size:12px; margin-bottom:10px;">
        ${allPackages.length} package.json unificados →
        ${Object.keys(unified.dependencies).length} deps +
        ${Object.keys(unified.devDependencies).length} devDeps
      </p>
      <div id="unified-pkg-view">${escapeHtml(jsonStr)}</div>
      <div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="DepsAnalyzer._copyUnified()">📋 Copiar</button>
        <button class="btn btn-secondary" onclick="DepsAnalyzer._downloadUnified()">⬇️ Baixar</button>
        <button class="btn btn-secondary" onclick="Shell.closeModal()">Fechar</button>
      </div>
    `);

    window._unifiedPkg = jsonStr;
  }

  function _copyUnified() {
    navigator.clipboard.writeText(window._unifiedPkg || '')
      .then(() => Shell.toast('package.json copiado!', 'success'))
      .catch(() => Shell.toast('Erro ao copiar', 'error'));
  }

  function _downloadUnified() {
    const blob = new Blob([window._unifiedPkg || ''], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'package.json'; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Exportar lista de deps ─────────────────────────────────
  function exportDeps() {
    if (allDeps.length === 0) { Shell.toast('Nenhuma dependência para exportar', 'warning'); return; }

    let md = `# 📦 Dependências do Projeto\n\n`;
    md += `> Gerado pelo ProjetoLens em ${new Date().toLocaleDateString('pt-BR')}\n\n`;
    md += `**Total:** ${allDeps.length} dependências em ${allPackages.length} package.json\n\n`;

    const groups = {
      relevante:    allDeps.filter(d => d.relevance === 'relevante'),
      opcional:     allDeps.filter(d => d.relevance === 'opcional'),
      substituivel: allDeps.filter(d => d.relevance === 'substituivel'),
    };

    for (const [group, deps] of Object.entries(groups)) {
      if (deps.length === 0) continue;
      md += `## ${labelRelevance(group)}\n\n`;
      md += `| Pacote | Versão | Tipo | Descrição | CDN |\n`;
      md += `|--------|--------|------|-----------|-----|\n`;
      for (const d of deps) {
        md += `| \`${d.name}\` | ${d.version} | ${d.type} | ${d.description || '-'} | ${d.hasCDN ? '✅' : '❌'} |\n`;
      }
      md += '\n';
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'dependencias.md'; a.click();
    URL.revokeObjectURL(url);
    Shell.toast('Lista exportada!', 'success');
  }

  // ── Painel CDN ─────────────────────────────────────────────
  function renderCDNPanel() {
    const cdnDeps = allDeps.filter(d => d.hasCDN);
    const empty   = document.getElementById('cdn-empty');
    const content = document.getElementById('cdn-content');
    const grid    = document.getElementById('cdn-grid');
    if (!grid) return;

    if (cdnDeps.length === 0) {
      if (empty)   empty.style.display   = 'block';
      if (content) content.style.display = 'none';
      return;
    }

    if (empty)   empty.style.display   = 'none';
    if (content) content.style.display = 'block';

    grid.innerHTML = cdnDeps.map(dep => `
      <div class="dep-card ${dep.relevance}">
        <div class="dep-card-header">
          <div class="dep-name">${dep.name}</div>
          <div class="dep-version">${dep.version}</div>
        </div>
        <div class="dep-desc">${dep.description || 'Sem descrição'}</div>
        <div class="dep-cdn-row" onclick="DepsAnalyzer.copyCDN('${dep.name.replace(/'/g,"\\'")}',this)"
             title="Clique para copiar">
          📋 ${escapeHtml(dep.cdnTag)}
        </div>
        <div class="dep-actions" style="margin-top:8px;">
          <button onclick="DepsAnalyzer.copyCDN('${dep.name.replace(/'/g,"\\'")}',this)">
            📋 Copiar tag
          </button>
        </div>
      </div>`).join('');
  }

  // ── Helpers ────────────────────────────────────────────────
  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    // Escuta navegação para CDN
    window.addEventListener('shell:navigate', (e) => {
      if (e.detail.moduleId === 'cdn') renderCDNPanel();
      if (e.detail.moduleId === 'deps') {
        // Restaura deps do estado se existir
        const saved = Shell.getState('dependencies');
        if (saved && saved.length > 0 && allDeps.length === 0) {
          allDeps = saved;
          renderSummary();
          renderDeps();
          showToolbar();
        }
      }
    });
  }

  // ── API Pública ────────────────────────────────────────────
  return {
    init, analyze,
    setFilter, setPkg, filterDeps,
    fetchAllDescriptions, fetchSingleDesc,
    copyCDN, copyAllCDN, downloadCDNFile,
    openNPM, changeRelevance, _setRelevance,
    unifyMonorepo, _copyUnified, _downloadUnified,
    exportDeps,
    getAllDeps: () => allDeps,
    getAllPackages: () => allPackages,
  };

})();

document.addEventListener('DOMContentLoaded', DepsAnalyzer.init);
