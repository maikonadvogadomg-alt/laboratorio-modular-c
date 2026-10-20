
// ============================================================
//  MÓDULO 8 — EXPORTADOR UNIVERSAL
//  ZIP, MD, JSON, Sessão, Pacote para IA
// ============================================================
const Exporter = (() => {

  let exportHistory = [];

  // ── Atualizar resumo da sessão ─────────────────────────────
  function updateSummary() {
    const files  = Shell.getState('projectFiles')  || {};
    const deps   = Shell.getState('dependencies')  || [];
    const routes = Shell.getState('routes')        || [];
    const bugs   = Shell.getState('bugs')          || [];
    const mods   = (typeof Planner !== 'undefined' && Planner.getModules)
                   ? Planner.getModules() : [];

    const totalSize = Object.values(files)
      .reduce((acc, c) => acc + new Blob([c]).size, 0);
    const sz = totalSize < 1024*1024
      ? `${(totalSize/1024).toFixed(0)}KB`
      : `${(totalSize/1024/1024).toFixed(1)}MB`;

    setText('exp-files',   Object.keys(files).filter(p=>!p.includes('node_modules')).length);
    setText('exp-deps',    deps.length);
    setText('exp-routes',  routes.length);
    setText('exp-bugs',    bugs.length);
    setText('exp-size',    sz);
    setText('exp-modules', mods.length);
  }

  // ── Progresso ──────────────────────────────────────────────
  function setProgress(pct, text, fileItem) {
    const wrap = document.getElementById('export-progress');
    const bar  = document.getElementById('export-progress-bar');
    const txt  = document.getElementById('export-progress-text');
    const list = document.getElementById('export-file-list');

    if (wrap) wrap.classList.add('visible');
    if (bar)  bar.style.width = `${pct}%`;
    if (txt)  txt.textContent = text;

    if (fileItem && list) {
      const div = document.createElement('div');
      div.className = 'export-file-item';
      div.innerHTML = `
        <span class="efi-icon">${fileItem.icon}</span>
        <span class="efi-name">${fileItem.name}</span>
        <span class="efi-size">${fileItem.size||''}</span>
        <span class="efi-status">${fileItem.done ? '✅' : '⏳'}</span>`;
      list.appendChild(div);
      list.scrollTop = list.scrollHeight;
    }
  }

  function hideProgress() {
    const wrap = document.getElementById('export-progress');
    const list = document.getElementById('export-file-list');
    if (wrap) wrap.classList.remove('visible');
    if (list) list.innerHTML = '';
  }

  function tick(ms) { return new Promise(r => setTimeout(r, ms||30)); }

  // ── Registrar no histórico ─────────────────────────────────
  function addHistory(icon, name, size) {
    exportHistory.unshift({
      icon, name, size,
      time: new Date().toLocaleTimeString('pt-BR'),
    });
    if (exportHistory.length > 20) exportHistory.pop();
    renderHistory();
  }

  function renderHistory() {
    const el = document.getElementById('export-history');
    if (!el) return;
    if (!exportHistory.length) {
      el.innerHTML = '<div style="font-size:13px;color:var(--text-muted);padding:8px 0;">Nenhuma exportação realizada ainda</div>';
      return;
    }
    el.innerHTML = exportHistory.map(h => `
      <div class="export-history-item">
        <span class="ehi-icon">${h.icon}</span>
        <span class="ehi-name">${h.name}</span>
        <span class="ehi-size">${h.size}</span>
        <span class="ehi-time">${h.time}</span>
      </div>`).join('');
  }

  // ════════════════════════════════════════════════════════════
  //  EXPORTAÇÕES INDIVIDUAIS
  // ════════════════════════════════════════════════════════════

  // ── Plano MD ───────────────────────────────────────────────
  function exportPlan() {
    const plan = Shell.getState('plan');
    if (!plan) {
      Shell.toast('Gere o plano primeiro (Módulo 5)', 'warning');
      Shell.navigate('planner');
      return;
    }
    const name = Shell.getState('projectName') || 'projeto';
    const size = _dl(`plano-${slug(name)}.md`, plan, 'text/markdown');
    addHistory('📋', `plano-${slug(name)}.md`, size);
    Shell.toast('Plano exportado!', 'success');
  }

  function copyPlan() {
    const plan = Shell.getState('plan');
    if (!plan) { Shell.toast('Gere o plano primeiro','warning'); return; }
    _copy(plan, 'Plano copiado!');
  }

  // ── Bugs MD ────────────────────────────────────────────────
  function exportBugs() {
    const bugs   = Shell.getState('bugs')   || [];
    const routes = Shell.getState('routes') || [];
    const name   = Shell.getState('projectName') || 'projeto';
    const date   = new Date().toLocaleDateString('pt-BR');

    if (!bugs.length) {
      Shell.toast('Execute a análise primeiro (Módulo 4)', 'warning');
      return;
    }

    const errors   = bugs.filter(b=>b.type==='error');
    const warnings = bugs.filter(b=>b.type==='warning');
    const todos    = bugs.filter(b=>b.type==='todo');

    let md = `# 🐛 Relatório de Problemas — ${name}\n\n`;
    md += `> Gerado pelo ProjetoLens em ${date}\n\n`;
    md += `## Resumo\n\n`;
    md += `| Tipo | Quantidade |\n|------|------------|\n`;
    md += `| ❌ Erros críticos | ${errors.length} |\n`;
    md += `| ⚠️ Avisos | ${warnings.length} |\n`;
    md += `| 📝 TODOs/FIXMEs | ${todos.length} |\n\n`;

    if (errors.length) {
      md += `## ❌ Erros Críticos\n\n`;
      errors.forEach(b => {
        md += `### ${b.msg}\n`;
        md += `- **Arquivo:** \`${b.file}:${b.line}\`\n`;
        if (b.lineContent) md += `- **Código:** \`${b.lineContent.substring(0,100)}\`\n`;
        md += `- **Ação:** Corrigir antes de publicar\n\n`;
      });
    }

    if (warnings.length) {
      md += `## ⚠️ Avisos\n\n`;
      md += `| Problema | Arquivo | Linha |\n|---------|---------|-------|\n`;
      warnings.forEach(b => {
        md += `| ${b.msg} | \`${b.file.split('/').pop()}\` | ${b.line} |\n`;
      });
      md += '\n';
    }

    if (todos.length) {
      md += `## 📝 TODOs e FIXMEs\n\n`;
      todos.forEach(b => {
        md += `- [ ] \`${b.file}:${b.line}\` — ${b.lineContent||b.msg}\n`;
      });
    }

    const size = _dl(`bugs-${slug(name)}.md`, md, 'text/markdown');
    addHistory('🐛', `bugs-${slug(name)}.md`, size);
    Shell.toast('Relatório de bugs exportado!', 'success');
  }

  function copyBugs() {
    const bugs = Shell.getState('bugs') || [];
    if (!bugs.length) { Shell.toast('Execute a análise primeiro','warning'); return; }
    const text = bugs.map(b => `[${b.type.toUpperCase()}] ${b.msg} — ${b.file}:${b.line}`).join('\n');
    _copy(text, 'Bugs copiados!');
  }

  // ── Dependências MD + JSON ─────────────────────────────────
  function exportDeps() {
    const deps = Shell.getState('dependencies') || [];
    const name = Shell.getState('projectName') || 'projeto';
    if (!deps.length) { Shell.toast('Importe um projeto primeiro','warning'); return; }

    const date = new Date().toLocaleDateString('pt-BR');
    let md = `# 🧩 Dependências — ${name}\n\n> Gerado pelo ProjetoLens em ${date}\n\n`;
    md += `**Total:** ${deps.length} pacotes\n\n`;

    const prod = deps.filter(d=>d.type==='prod');
    const dev  = deps.filter(d=>d.type==='dev');

    if (prod.length) {
      md += `## Produção (${prod.length})\n\n`;
      md += `| Pacote | Versão | Descrição | CDN |\n|--------|--------|-----------|-----|\n`;
      prod.forEach(d => {
        md += `| \`${d.name}\` | \`${d.version}\` | ${d.description||'-'} | ${d.hasCDN?'✅':'❌'} |\n`;
      });
      md += '\n';
    }

    if (dev.length) {
      md += `## Desenvolvimento (${dev.length})\n\n`;
      md += `| Pacote | Versão | Descrição |\n|--------|--------|----------|\n`;
      dev.forEach(d => {
        md += `| \`${d.name}\` | \`${d.version}\` | ${d.description||'-'} |\n`;
      });
      md += '\n';
    }

    md += `## Instalar\n\n\`\`\`bash\nnpm install ${prod.map(d=>d.name).join(' ')}\nnpm install -D ${dev.map(d=>d.name).join(' ')}\n\`\`\`\n`;

    const size = _dl(`deps-${slug(name)}.md`, md, 'text/markdown');
    addHistory('🧩', `deps-${slug(name)}.md`, size);
    Shell.toast('Dependências exportadas!', 'success');
  }

  function exportDepsJSON() {
    const deps = Shell.getState('dependencies') || [];
    const name = Shell.getState('projectName') || 'projeto';
    if (!deps.length) { Shell.toast('Importe um projeto primeiro','warning'); return; }

    const json = JSON.stringify({
      project: name,
      date: new Date().toISOString(),
      total: deps.length,
      dependencies: deps,
    }, null, 2);

    const size = _dl(`deps-${slug(name)}.json`, json, 'application/json');
    addHistory('🧩', `deps-${slug(name)}.json`, size);
    Shell.toast('Deps exportadas em JSON!', 'success');
  }

  function copyDeps() {
    const deps = Shell.getState('dependencies') || [];
    if (!deps.length) { Shell.toast('Importe um projeto primeiro','warning'); return; }
    const text = deps.map(d=>`${d.name}@${d.version} (${d.type})`).join('\n');
    _copy(text, 'Dependências copiadas!');
  }

  // ── Rotas MD + JSON ────────────────────────────────────────
  function exportRoutes() {
    const routes = Shell.getState('routes') || [];
    const name   = Shell.getState('projectName') || 'projeto';
    if (!routes.length) { Shell.toast('Execute a análise primeiro','warning'); return; }

    const date = new Date().toLocaleDateString('pt-BR');
    let md = `# 🛣️ Rotas de API — ${name}\n\n> Gerado pelo ProjetoLens em ${date}\n\n`;
    md += `**Total:** ${routes.length} rotas\n\n`;

    const byFW = {};
    routes.forEach(r => {
      if (!byFW[r.framework]) byFW[r.framework] = [];
      byFW[r.framework].push(r);
    });

    for (const [fw, rs] of Object.entries(byFW)) {
      md += `## ${fw} (${rs.length})\n\n`;
      md += `| Método | Rota | Arquivo | Linha |\n|--------|------|---------|-------|\n`;
      rs.forEach(r => {
        md += `| \`${r.method}\` | \`${r.path}\` | \`${r.file.split('/').pop()}\` | ${r.line} |\n`;
      });
      md += '\n';
    }

    const size = _dl(`rotas-${slug(name)}.md`, md, 'text/markdown');
    addHistory('🛣️', `rotas-${slug(name)}.md`, size);
    Shell.toast('Rotas exportadas!', 'success');
  }

  function exportRoutesJSON() {
    const routes = Shell.getState('routes') || [];
    const name   = Shell.getState('projectName') || 'projeto';
    if (!routes.length) { Shell.toast('Execute a análise primeiro','warning'); return; }

    const json = JSON.stringify({
      project: name,
      date: new Date().toISOString(),
      total: routes.length,
      routes,
    }, null, 2);

    const size = _dl(`rotas-${slug(name)}.json`, json, 'application/json');
    addHistory('🛣️', `rotas-${slug(name)}.json`, size);
    Shell.toast('Rotas exportadas em JSON!', 'success');
  }

  function copyRoutes() {
    const routes = Shell.getState('routes') || [];
    if (!routes.length) { Shell.toast('Execute a análise primeiro','warning'); return; }
    const text = routes.map(r=>`${r.method.padEnd(8)} ${r.path}`).join('\n');
    _copy(text, 'Rotas copiadas!');
  }

  // ── Estrutura ──────────────────────────────────────────────
  function exportStructure() {
    const files = Shell.getState('projectFiles') || {};
    const name  = Shell.getState('projectName') || 'projeto';
    if (!Object.keys(files).length) { Shell.toast('Importe um projeto primeiro','warning'); return; }

    const paths = Object.keys(files)
      .filter(p=>!p.includes('node_modules')).sort();

    let tree = `# 🗂️ Estrutura — ${name}\n\n\`\`\`\n`;
    tree += `${name}/\n`;

    const shown = new Set();
    paths.forEach(p => {
      p.split('/').forEach((part, i, arr) => {
        const key = arr.slice(0,i+1).join('/');
        if (shown.has(key)) return;
        shown.add(key);
        const pad   = '  '.repeat(i);
        const isDir = i < arr.length-1;
        tree += `${pad}${isDir?'📁 ':'📄 '}${part}${isDir?'/':''}\n`;
      });
    });

    tree += `\`\`\`\n\n**Total:** ${paths.length} arquivos\n`;

    const size = _dl(`estrutura-${slug(name)}.md`, tree, 'text/markdown');
    addHistory('🗂️', `estrutura-${slug(name)}.md`, size);
    Shell.toast('Estrutura exportada!', 'success');
  }

  function copyStructure() {
    const files = Shell.getState('projectFiles') || {};
    if (!Object.keys(files).length) { Shell.toast('Importe um projeto primeiro','warning'); return; }
    const paths = Object.keys(files).filter(p=>!p.includes('node_modules')).sort().join('\n');
    _copy(paths, 'Estrutura copiada!');
  }

  // ── Scripts ────────────────────────────────────────────────
  function exportScripts() {
    const scripts = Shell.getState('scripts') || {};
    const name    = Shell.getState('projectName') || 'projeto';

    if (!scripts.bat) {
      Shell.toast('Gere os scripts primeiro (Módulo 6)', 'warning');
      Shell.navigate('scripts');
      return;
    }

    const files = [
      { name:'setup.bat',  content:scripts.bat,      type:'text/plain' },
      { name:'setup.sh',   content:scripts.sh,       type:'text/plain' },
      { name:'setup.ps1',  content:scripts.ps1,      type:'text/plain' },
      { name:'Makefile',   content:scripts.makefile, type:'text/plain' },
    ];

    files.forEach((f, i) => {
      setTimeout(() => {
        const size = _dl(f.name, f.content, f.type);
        addHistory('⚙️', f.name, size);
      }, i * 300);
    });

    Shell.toast('4 scripts baixados!', 'success');
  }

  // ── Sessão completa ────────────────────────────────────────
  function exportSession() {
    const name = Shell.getState('projectName') || 'projeto';
    const session = {
      version:     '1.0',
      date:        new Date().toISOString(),
      projectName: name,
      projectFiles: Shell.getState('projectFiles') || {},
      dependencies: Shell.getState('dependencies') || [],
      routes:       Shell.getState('routes')       || [],
      bugs:         Shell.getState('bugs')         || [],
      plan:         Shell.getState('plan')         || '',
      scripts:      Shell.getState('scripts')      || {},
    };

    const json = JSON.stringify(session, null, 2);
    const size = _dl(`sessao-${slug(name)}-${Date.now()}.json`, json, 'application/json');
    addHistory('💿', `sessao-${slug(name)}.json`, size);
    Shell.toast('Sessão salva! Carregue depois sem reimportar.', 'success');
  }

  function importSession() {
    document.getElementById('session-file-input')?.click();
  }

  function loadSession(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const session = JSON.parse(e.target.result);

        if (!session.version || !session.projectName) {
          Shell.toast('Arquivo de sessão inválido', 'error');
          return;
        }

        // Restaura todos os estados
        Shell.setState('projectName',  session.projectName);
        Shell.setState('projectFiles', session.projectFiles || {});
        Shell.setState('dependencies', session.dependencies || []);
        Shell.setState('routes',       session.routes       || []);
        Shell.setState('bugs',         session.bugs         || []);
        Shell.setState('plan',         session.plan         || '');
        Shell.setState('scripts',      session.scripts      || {});

        updateSummary();
        Shell.toast(`✅ Sessão "${session.projectName}" carregada!`, 'success');

        // Atualiza nome do projeto no header
        const nameEl = document.getElementById('project-name-display');
        if (nameEl) nameEl.textContent = session.projectName;

      } catch(err) {
        Shell.toast('Erro ao carregar sessão: arquivo inválido', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  // ── Pacote para IA ─────────────────────────────────────────
  function exportForAI() {
    const name   = Shell.getState('projectName')  || 'projeto';
    const files  = Shell.getState('projectFiles') || {};
    const deps   = Shell.getState('dependencies') || [];
    const routes = Shell.getState('routes')       || [];
    const bugs   = Shell.getState('bugs')         || [];
    const plan   = Shell.getState('plan')         || '';
    const date   = new Date().toLocaleDateString('pt-BR');

    const fws = (typeof CodeAnalyzer !== 'undefined' && CodeAnalyzer.getFrameworks)
      ? CodeAnalyzer.getFrameworks().map(f=>f.name).join(', ')
      : 'Não detectado';

    const paths = Object.keys(files)
      .filter(p=>!p.includes('node_modules')).sort();

    const errors   = bugs.filter(b=>b.type==='error');
    const warnings = bugs.filter(b=>b.type==='warning');

    let md = `# 🤖 Contexto do Projeto para IA — ${name}\n\n`;
    md += `> Gerado pelo ProjetoLens em ${date}\n`;
    md += `> Cole este contexto no início da conversa com a IA\n\n`;
    md += `---\n\n`;

    md += `## 📌 Resumo Executivo\n\n`;
    md += `- **Projeto:** ${name}\n`;
    md += `- **Tecnologias:** ${fws}\n`;
    md += `- **Arquivos:** ${paths.length}\n`;
    md += `- **Dependências:** ${deps.length} (${deps.filter(d=>d.type==='prod').length} prod, ${deps.filter(d=>d.type==='dev').length} dev)\n`;
    md += `- **Rotas de API:** ${routes.length}\n`;
    md += `- **Problemas:** ${errors.length} erros, ${warnings.length} avisos\n\n`;

    md += `## 🏗️ Tecnologias Detectadas\n\n`;
    md += fws ? fws.split(', ').map(f=>`- ${f}`).join('\n') : '- Não detectado';
    md += '\n\n';

    md += `## 🗂️ Estrutura Principal\n\n\`\`\`\n`;
    // Só primeiros 2 níveis
    const topDirs = new Set();
    paths.forEach(p => {
      const parts = p.split('/');
      topDirs.add(parts[0] + (parts.length>1 ? '/' : ''));
      if (parts.length>1) topDirs.add(`  ${parts[0]}/${parts[1]}${parts.length>2?'/':''}`);
    });
    md += [...topDirs].slice(0,30).join('\n');
    md += `\n\`\`\`\n\n`;

    md += `## 🧩 Dependências Principais\n\n`;
    const mainDeps = deps.filter(d=>d.type==='prod' && d.relevance==='relevante').slice(0,10);
    md += mainDeps.map(d=>`- \`${d.name}@${d.version}\` — ${d.description||'ver NPM'}`).join('\n');
    md += '\n\n';

    if (routes.length) {
      md += `## 🛣️ Rotas de API (${routes.length} total)\n\n`;
      routes.slice(0,15).forEach(r => {
        md += `- \`${r.method} ${r.path}\` (${r.framework})\n`;
      });
      if (routes.length>15) md += `- ... e mais ${routes.length-15} rotas\n`;
      md += '\n';
    }

    if (errors.length) {
      md += `## ❌ Problemas Críticos (${errors.length})\n\n`;
      errors.slice(0,5).forEach(b => {
        md += `- **${b.msg}** em \`${b.file}:${b.line}\`\n`;
      });
      md += '\n';
    }

    // Arquivos mais importantes
    const keyFiles = paths.filter(p => {
      const n = p.split('/').pop();
      return ['package.json','index.js','index.ts','app.js','app.ts',
              'server.js','server.ts','main.js','main.ts'].includes(n);
    });

    if (keyFiles.length) {
      md += `## 📄 Arquivos-Chave\n\n`;
      keyFiles.slice(0,5).forEach(f => {
        const content = files[f] || '';
        const lines   = content.split('\n').slice(0,30).join('\n');
        md += `### \`${f}\`\n\n\`\`\`\n${lines}\n${content.split('\n').length>30?'...(truncado)':''}\n\`\`\`\n\n`;
      });
    }

    md += `---\n\n`;
    md += `## 💬 Instrução para a IA\n\n`;
    md += `> Analise o contexto acima e me ajude a:\n`;
    md += `> 1. Entender a arquitetura do projeto\n`;
    md += `> 2. Corrigir os problemas identificados\n`;
    md += `> 3. Melhorar a estrutura e qualidade do código\n`;
    md += `> 4. Recriar o projeto em um novo ambiente\n\n`;
    md += `*(Substitua esta instrução pela sua pergunta específica)*\n`;

    const size = _dl(`contexto-ia-${slug(name)}.md`, md, 'text/markdown');
    addHistory('🤖', `contexto-ia-${slug(name)}.md`, size);
    Shell.setState('aiContext', md);
    Shell.toast('Contexto para IA gerado!', 'success');
  }

  function copyForAI() {
    let ctx = Shell.getState('aiContext');
    if (!ctx) {
      exportForAI();
      ctx = Shell.getState('aiContext');
    }
    if (ctx) _copy(ctx, 'Contexto copiado! Cole na IA.');
  }

  // ── Exportar tudo ──────────────────────────────────────────
  async function exportAll() {
    const files  = Shell.getState('projectFiles') || {};
    const name   = Shell.getState('projectName')  || 'projeto';

    if (!Object.keys(files).length) {
      Shell.toast('Importe um projeto primeiro', 'warning');
      return;
    }

    const list = document.getElementById('export-file-list');
    if (list) list.innerHTML = '';

    setProgress(5, 'Preparando exportação completa...');
    await tick(100);

    const toExport = [];

    // Plano
    const plan = Shell.getState('plan');
    if (plan) {
      toExport.push({ name:`plano-${slug(name)}.md`, content:plan, type:'text/markdown', icon:'📋' });
    }
    setProgress(20, 'Coletando plano...', { icon:'📋', name:`plano-${slug(name)}.md`, done:true });
    await tick();

    // Bugs
    const bugs = Shell.getState('bugs') || [];
    if (bugs.length) {
      const bugsMD = bugs.map(b=>`[${b.type}] ${b.msg} — ${b.file}:${b.line}`).join('\n');
      toExport.push({ name:`bugs-${slug(name)}.md`, content:`# Bugs\n\n${bugsMD}`, type:'text/markdown', icon:'🐛' });
    }
    setProgress(35, 'Coletando bugs...', { icon:'🐛', name:`bugs-${slug(name)}.md`, done:true });
    await tick();

    // Rotas
    const routes = Shell.getState('routes') || [];
    if (routes.length) {
      const routesMD = routes.map(r=>`${r.method.padEnd(8)} ${r.path} — ${r.file}`).join('\n');
      toExport.push({ name:`rotas-${slug(name)}.md`, content:`# Rotas\n\n${routesMD}`, type:'text/markdown', icon:'🛣️' });
    }
    setProgress(50, 'Coletando rotas...', { icon:'🛣️', name:`rotas-${slug(name)}.md`, done:true });
    await tick();

    // Scripts
    const scripts = Shell.getState('scripts') || {};
    if (scripts.bat) {
      toExport.push({ name:'setup.bat',  content:scripts.bat,      type:'text/plain', icon:'⚙️' });
      toExport.push({ name:'setup.sh',   content:scripts.sh,       type:'text/plain', icon:'⚙️' });
      toExport.push({ name:'setup.ps1',  content:scripts.ps1,      type:'text/plain', icon:'⚙️' });
      toExport.push({ name:'Makefile',   content:scripts.makefile, type:'text/plain', icon:'⚙️' });
    }
    setProgress(65, 'Coletando scripts...', { icon:'⚙️', name:'setup.bat + .sh + .ps1 + Makefile', done:true });
    await tick();

    // Deps JSON
    const deps = Shell.getState('dependencies') || [];
    if (deps.length) {
      toExport.push({
        name: `deps-${slug(name)}.json`,
        content: JSON.stringify({ project:name, dependencies:deps }, null, 2),
        type: 'application/json',
        icon: '🧩',
      });
    }
    setProgress(75, 'Coletando dependências...', { icon:'🧩', name:`deps-${slug(name)}.json`, done:true });
    await tick();

    // Contexto IA
    exportForAI();
    const aiCtx = Shell.getState('aiContext') || '';
    if (aiCtx) {
      toExport.push({ name:`contexto-ia-${slug(name)}.md`, content:aiCtx, type:'text/markdown', icon:'🤖' });
    }
    setProgress(85, 'Gerando contexto IA...', { icon:'🤖', name:`contexto-ia-${slug(name)}.md`, done:true });
    await tick();

    // Sessão JSON
    const session = JSON.stringify({
      version:'1.0', date:new Date().toISOString(),
      projectName:name, projectFiles:files,
      dependencies:deps, routes, bugs,
      plan, scripts,
    }, null, 2);
    toExport.push({ name:`sessao-${slug(name)}.json`, content:session, type:'application/json', icon:'💿' });
    setProgress(95, 'Salvando sessão...', { icon:'💿', name:`sessao-${slug(name)}.json`, done:true });
    await tick();

    // Baixa tudo em sequência
    toExport.forEach((f, i) => {
      setTimeout(() => {
        _dl(f.name, f.content, f.type);
        addHistory(f.icon, f.name, _sizeStr(f.content));
      }, i * 250);
    });

    setProgress(100, `✅ ${toExport.length} arquivos exportados!`);
    setTimeout(hideProgress, 3000);

    Shell.toast(`✅ ${toExport.length} arquivos exportados!`, 'success');
  }

  // ── Exportar ZIP (usando JSZip se disponível, senão sequencial) ──
  function exportZIP() {
    const name = Shell.getState('projectName') || 'projeto';

    // Tenta usar JSZip
    if (typeof JSZip !== 'undefined') {
      _exportZIPWithJSZip(name);
    } else {
      // Fallback: baixa arquivos separados
      Shell.toast('JSZip não carregado — baixando arquivos separados', 'info');
      exportAll();
    }
  }

  async function _exportZIPWithJSZip(name) {
    const zip    = new JSZip();
    const files  = Shell.getState('projectFiles') || {};
    const plan   = Shell.getState('plan')         || '';
    const bugs   = Shell.getState('bugs')         || [];
    const routes = Shell.getState('routes')       || [];
    const deps   = Shell.getState('dependencies') || [];
    const scripts= Shell.getState('scripts')      || {};

    setProgress(10, 'Criando ZIP...');

    // Arquivos do projeto
    const folder = zip.folder(slug(name));
    let count = 0;
    for (const [path, content] of Object.entries(files)) {
      if (path.includes('node_modules')) continue;
      folder.file(path, content);
      count++;
    }
    setProgress(40, `${count} arquivos adicionados...`);
    await tick();

    // Plano
    if (plan) zip.file('_projetolens/plano.md', plan);

    // Scripts
    if (scripts.bat) {
      zip.file('_projetolens/setup.bat',  scripts.bat);
      zip.file('_projetolens/setup.sh',   scripts.sh);
      zip.file('_projetolens/setup.ps1',  scripts.ps1);
      zip.file('_projetolens/Makefile',   scripts.makefile);
    }

    // Relatório
    const report = bugs.map(b=>`[${b.type}] ${b.msg} — ${b.file}:${b.line}`).join('\n');
    zip.file('_projetolens/bugs.md', `# Bugs\n\n${report}`);

    // Deps
    zip.file('_projetolens/deps.json', JSON.stringify({dependencies:deps},null,2));

    setProgress(80, 'Comprimindo...');
    await tick();

    const blob = await zip.generateAsync({ type:'blob', compression:'DEFLATE' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `${slug(name)}-projetolens.zip`;
    a.click();
    URL.revokeObjectURL(url);

    setProgress(100, '✅ ZIP gerado!');
    setTimeout(hideProgress, 2000);

    const sz = blob.size < 1024*1024
      ? `${(blob.size/1024).toFixed(0)}KB`
      : `${(blob.size/1024/1024).toFixed(1)}MB`;

    addHistory('📦', `${slug(name)}.zip`, sz);
    Shell.toast(`ZIP gerado! ${sz}`, 'success');
  }

  // ════════════════════════════════════════════════════════════
  //  HELPERS
  // ════════════════════════════════════════════════════════════

  function _dl(filename, content, type) {
    const blob = new Blob([content], { type });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    return _sizeStr(content);
  }

  function _sizeStr(content) {
    const size = new Blob([content]).size;
    return size < 1024 ? `${size}B` : size < 1024*1024
      ? `${(size/1024).toFixed(1)}KB`
      : `${(size/1024/1024).toFixed(1)}MB`;
  }

  function _copy(text, msg) {
    navigator.clipboard.writeText(text)
      .then(() => Shell.toast(msg || 'Copiado!', 'success'))
      .catch(() => Shell.toast('Erro ao copiar', 'error'));
  }

  function slug(str) {
    return (str||'projeto').replace(/[\s@/\\]/g,'-').toLowerCase();
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    window.addEventListener('shell:navigate', e => {
      if (e.detail.moduleId === 'exporter') updateSummary();
    });
    // Atualiza ao carregar
    updateSummary();
  }

  document.addEventListener('DOMContentLoaded', init);

  // ── API Pública ────────────────────────────────────────────
  return {
    exportAll,
    exportZIP,
    exportPlan,    copyPlan,
    exportBugs,    copyBugs,
    exportDeps,    exportDepsJSON,  copyDeps,
    exportRoutes,  exportRoutesJSON, copyRoutes,
    exportStructure, copyStructure,
    exportScripts,
    exportSession, importSession, loadSession,
    exportForAI,   copyForAI,
    updateSummary,
  };

})();
