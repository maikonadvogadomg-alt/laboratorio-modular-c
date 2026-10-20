
// ============================================================
//  MÓDULO 5 — CONCLUSÃO DO PLANNER
//  Cole este bloco DEPOIS do MDRenderer e ANTES do </body>
// ============================================================

const Planner = (() => {

  let planType    = 'monolitico';
  let currentView = 'preview';
  let planParts   = {};
  let planModules = [];
  let fullPlan    = '';

  const sections = {
    overview:true, tech:true, structure:true, deps:true,
    routes:true, bugs:true, modules:true, steps:true, scripts:true,
  };

  function setPlanType(type, el) {
    planType = type;
    document.querySelectorAll('#ptt-mono,#ptt-mod,#ptt-both')
      .forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
  }

  function toggleSection(key) {
    sections[key] = !sections[key];
    const tog = document.getElementById(`tog-${key}`);
    if (tog) tog.classList.toggle('on', sections[key]);
  }

  function setProgress(pct, text) {
    const bar  = document.getElementById('gen-progress-bar');
    const txt  = document.getElementById('gen-progress-text');
    const wrap = document.getElementById('gen-progress');
    if (wrap) wrap.classList.add('visible');
    if (bar)  bar.style.width = `${pct}%`;
    if (txt)  txt.textContent = text;
  }

  function hideProgress() {
    const wrap = document.getElementById('gen-progress');
    if (wrap) wrap.classList.remove('visible');
  }

  function tick() { return new Promise(r => setTimeout(r, 30)); }

  // ── Gerar plano ────────────────────────────────────────────
  async function generate() {
    const files  = Shell.getState('projectFiles')  || {};
    const deps   = Shell.getState('dependencies')  || [];
    const routes = Shell.getState('routes')        || [];
    const bugs   = Shell.getState('bugs')          || [];
    const name   = Shell.getState('projectName')   || 'Projeto';

    setProgress(5,  'Coletando dados do projeto...');   await tick();
    planParts = {}; planModules = [];

    setProgress(15, 'Gerando visão geral...');          await tick();
    if (sections.overview)  planParts.overview  = genOverview(name, files, deps, routes, bugs);

    setProgress(25, 'Detectando tecnologias...');       await tick();
    if (sections.tech)      planParts.tech      = genTech(deps);

    setProgress(35, 'Mapeando estrutura...');           await tick();
    if (sections.structure) planParts.structure = genStructure(files);

    setProgress(45, 'Listando dependências...');        await tick();
    if (sections.deps)      planParts.deps      = genDeps(deps);

    setProgress(55, 'Documentando rotas...');           await tick();
    if (sections.routes)    planParts.routes    = genRoutes(routes);

    setProgress(62, 'Listando problemas...');           await tick();
    if (sections.bugs)      planParts.bugs      = genBugs(bugs);

    setProgress(72, 'Planejando módulos...');           await tick();
    if (sections.modules) {
      planModules          = genModules(name, files, deps, routes);
      planParts.modules    = renderModulesMD(planModules);
    }

    setProgress(82, 'Gerando passos de recriação...');  await tick();
    if (sections.steps)     planParts.steps     = genSteps(name, deps, planModules);

    setProgress(92, 'Gerando scripts de setup...');     await tick();
    if (sections.scripts)   planParts.scripts   = genSetupScripts(name, deps, files);

    fullPlan = Object.values(planParts).filter(Boolean).join('\n\n---\n\n');

    setProgress(100, 'Plano gerado!'); await tick();
    hideProgress();

    Shell.setState('plan', fullPlan);
    renderPlan();

    document.getElementById('planner-empty').style.display   = 'none';
    document.getElementById('planner-content').style.display = 'block';
    document.getElementById('btn-dl-all').style.display      = '';
    document.getElementById('btn-copy-all').style.display    = '';

    Shell.toast(`✅ Plano gerado com ${Object.keys(planParts).length} seções!`, 'success');
  }

  // ════════════════════════════════════════════════════════════
  //  GERADORES DE SEÇÃO
  // ════════════════════════════════════════════════════════════

  function genOverview(name, files, deps, routes, bugs) {
    const date    = new Date().toLocaleDateString('pt-BR');
    const fws     = (typeof CodeAnalyzer !== 'undefined' && CodeAnalyzer.getFrameworks)
                    ? CodeAnalyzer.getFrameworks() : [];
    const fwNames = fws.map(f => f.name).join(', ') || 'Não detectado';
    return `# 📋 Plano do Projeto: ${name}

> Gerado automaticamente pelo **ProjetoLens** em ${date}

## 📌 Visão Geral

| Item | Detalhe |
|------|---------|
| **Nome** | ${name} |
| **Arquivos** | ${Object.keys(files).length} arquivos |
| **Dependências** | ${deps.length} pacotes |
| **Rotas de API** | ${routes.length} rotas |
| **Erros** | ${bugs.filter(b=>b.type==='error').length} erros, ${bugs.filter(b=>b.type==='warning').length} avisos |
| **Tecnologias** | ${fwNames} |
| **Data** | ${date} |

## 🎯 Objetivo do Projeto

> *(Descreva aqui o objetivo principal do projeto)*

## 🔑 Funcionalidades Principais

- [ ] *(Liste as funcionalidades identificadas)*
- [ ] *(Complete com base nas rotas detectadas)*
- [ ] *(Adicione conforme análise do código)*`;
  }

  function genTech(deps) {
    const fws     = (typeof CodeAnalyzer !== 'undefined' && CodeAnalyzer.getFrameworks)
                    ? CodeAnalyzer.getFrameworks() : [];
    const fwList  = fws.map(f => `- ${f.icon} **${f.name}**`).join('\n') || '- Não detectado';
    const prodRel = deps.filter(d => d.type==='prod' && d.relevance==='relevante').slice(0,12);
    const devList = deps.filter(d => d.type==='dev').slice(0,6);
    return `## 🏗️ Tecnologias e Frameworks

### Detectados Automaticamente
${fwList}

### Dependências Principais de Produção

| Pacote | Versão | Descrição |
|--------|--------|-----------|
${prodRel.map(d=>`| \`${d.name}\` | ${d.version} | ${d.description||'Ver NPM'} |`).join('\n')||'| - | - | Nenhuma encontrada |'}

### Ferramentas de Desenvolvimento

| Pacote | Versão |
|--------|--------|
${devList.map(d=>`| \`${d.name}\` | ${d.version} |`).join('\n')||'| - | - |'}`;
  }

  function genStructure(files) {
    const paths = Object.keys(files).filter(p => !p.includes('node_modules'));
    const dirs  = new Set();
    for (const p of paths) {
      const parts = p.split(/[/\\]/);
      if (parts.length >= 2) dirs.add(parts[0]);
      if (parts.length >= 3) dirs.add(`${parts[0]}/${parts[1]}`);
    }
    const keyNames = ['package.json','index.js','index.ts','app.js','app.ts',
                      'main.js','main.ts','server.js','server.ts','.env.example',
                      '.gitignore','README.md','Dockerfile','docker-compose.yml',
                      'vite.config.ts','next.config.js','tailwind.config.js','tsconfig.json'];
    const keyFiles = paths.filter(p => keyNames.includes(p.split('/').pop()));
    const typeCount = {};
    for (const f of paths) {
      const ext = f.split('.').pop().toLowerCase();
      typeCount[ext] = (typeCount[ext]||0) + 1;
    }
    const topTypes = Object.entries(typeCount)
      .sort((a,b)=>b[1]-a[1]).slice(0,8)
      .map(([ext,n])=>`| \`.${ext}\` | ${n} arquivo${n>1?'s':''} |`).join('\n');

    return `## 🗂️ Estrutura do Projeto

### Diretórios Principais

\`\`\`
${[...dirs].slice(0,30).map(d=>`📁 ${d}/`).join('\n')||'(estrutura não detectada)'}
\`\`\`

### Arquivos-Chave

${keyFiles.map(f=>`- \`${f}\``).join('\n')||'- Nenhum arquivo-chave padrão encontrado'}

### Distribuição por Tipo

| Extensão | Quantidade |
|----------|------------|
${topTypes}

**Total:** ${paths.length} arquivos`;
  }

  function genDeps(deps) {
    if (!deps.length) return `## 🧩 Dependências\n\nNenhuma dependência encontrada.`;
    const rel  = deps.filter(d=>d.relevance==='relevante');
    const opc  = deps.filter(d=>d.relevance==='opcional');
    const sub  = deps.filter(d=>d.relevance==='substituivel');
    const dev  = deps.filter(d=>d.type==='dev');
    const th   = `| Pacote | Versão | Tipo | Descrição | CDN |\n|--------|--------|------|-----------|-----|`;
    const row  = d => `| \`${d.name}\` | \`${d.version}\` | ${d.type} | ${d.description||'-'} | ${d.hasCDN?'✅':'❌'} |`;
    return `## 🧩 Dependências

**Total:** ${deps.length} | **Produção:** ${deps.filter(d=>d.type==='prod').length} | **Dev:** ${dev.length}

### ✅ Essenciais (${rel.length})
${th}
${rel.map(row).join('\n')||'| - | - | - | - | - |'}

### ⚠️ Opcionais (${opc.length})
${th}
${opc.map(row).join('\n')||'| - | - | - | - | - |'}

### 🔄 Substituíveis por CDN (${sub.length})
${th}
${sub.map(row).join('\n')||'| - | - | - | - | - |'}

### Instalar tudo
\`\`\`bash
npm install ${rel.map(d=>d.name).join(' ')||'# dependências aqui'}
npm install -D ${dev.map(d=>d.name).join(' ')||'# devDeps aqui'}
\`\`\``;
  }

  function genRoutes(routes) {
    if (!routes.length) return `## 🛣️ Rotas de API\n\nNenhuma rota detectada.`;
    const byFW = {};
    for (const r of routes) {
      if (!byFW[r.framework]) byFW[r.framework] = [];
      byFW[r.framework].push(r);
    }
    let md = `## 🛣️ Rotas de API\n\n**Total:** ${routes.length} rotas\n\n`;
    for (const [fw, rs] of Object.entries(byFW)) {
      md += `### ${fw} (${rs.length})\n\n`;
      md += `| Método | Rota | Arquivo |\n|--------|------|---------|\n`;
      md += rs.map(r=>`| \`${r.method}\` | \`${r.path}\` | \`${r.file.split('/').pop()}:${r.line}\` |`).join('\n');
      md += '\n\n';
    }
    return md;
  }

  function genBugs(bugs) {
    if (!bugs.length) return `## 🐛 Problemas\n\n✅ Nenhum problema crítico detectado!`;
    const errors   = bugs.filter(b=>b.type==='error');
    const warnings = bugs.filter(b=>b.type==='warning');
    const todos    = bugs.filter(b=>b.type==='todo');
    let md = `## 🐛 Problemas Encontrados\n\n`;
    md += `**Resumo:** ${errors.length} erros | ${warnings.length} avisos | ${todos.length} TODOs\n\n`;
    if (errors.length) {
      md += `### ❌ Erros Críticos\n\n`;
      for (const b of errors) {
        md += `#### ${b.msg}\n- **Arquivo:** \`${b.file}:${b.line}\`\n`;
        if (b.lineContent) md += `- **Código:** \`${b.lineContent.substring(0,80)}\`\n`;
        md += '\n';
      }
    }
    if (warnings.length) {
      md += `### ⚠️ Avisos\n\n`;
      md += warnings.slice(0,10).map(b=>`- **${b.msg}** — \`${b.file}:${b.line}\``).join('\n');
      md += '\n\n';
    }
    if (todos.length) {
      md += `### 📝 TODOs\n\n`;
      md += todos.slice(0,8).map(b=>`- [ ] \`${b.file}:${b.line}\` — ${b.lineContent||b.msg}`).join('\n');
    }
    return md;
  }

  function genModules(name, files, deps, routes) {
    const paths   = Object.keys(files).filter(p=>!p.includes('node_modules'));
    const modules = [];

    // 1 — Setup
    modules.push({
      num:1, icon:'⚙️', name:'Configuração e Setup',
      desc:'Estrutura base, variáveis de ambiente, ferramentas',
      files: paths.filter(p=>{
        const n=p.split('/').pop();
        return ['.env','.gitignore','tsconfig','vite.config','webpack.config',
                'next.config','tailwind.config','jest.config','eslint','.prettierrc']
               .some(k=>n.includes(k));
      }),
      deps: deps.filter(d=>['typescript','vite','webpack','eslint','prettier','jest','vitest'].some(k=>d.name.includes(k))),
      independent:true,
      steps:['Criar pasta do projeto','npm init -y','Instalar devDependencies',
             'Configurar TypeScript','Configurar bundler','Criar .env'],
    });

    // 2 — Banco de dados
    const dbFiles = paths.filter(p=>
      ['model','schema','migration','prisma','entity','database'].some(k=>p.includes(k)));
    if (dbFiles.length || deps.some(d=>['prisma','mongoose','sequelize','typeorm','drizzle','pg','mysql'].some(k=>d.name.includes(k)))) {
      modules.push({
        num:2, icon:'🗄️', name:'Banco de Dados e Modelos',
        desc:'Conexão, schemas, migrations e modelos de dados',
        files:dbFiles,
        deps:deps.filter(d=>['prisma','mongoose','sequelize','typeorm','drizzle','pg','mysql','sqlite'].some(k=>d.name.includes(k))),
        independent:true,
        steps:['Instalar ORM/driver','Configurar string de conexão no .env',
               'Definir schemas/modelos','Criar migrations','Testar conexão'],
      });
    }

    // 3 — Auth
    const authFiles = paths.filter(p=>
      ['auth','login','jwt','passport','session','middleware'].some(k=>p.includes(k)));
    if (authFiles.length || deps.some(d=>['jsonwebtoken','bcrypt','passport','next-auth','clerk'].some(k=>d.name.includes(k)))) {
      modules.push({
        num:modules.length+1, icon:'🔐', name:'Autenticação e Autorização',
        desc:'Login, JWT, sessões e controle de acesso',
        files:authFiles,
        deps:deps.filter(d=>['jsonwebtoken','bcrypt','passport','next-auth','clerk','jose'].some(k=>d.name.includes(k))),
        independent:false, dependsOn:['Banco de Dados'],
        steps:['Instalar deps de auth','Implementar hash de senha',
               'Criar JWT','Middleware de autenticação','Rotas de login/logout','Testar fluxo'],
      });
    }

    // 4 — API Backend
    const apiFiles = paths.filter(p=>
      ['route','controller','handler','api','service','server'].some(k=>p.includes(k)));
    if (apiFiles.length || routes.length) {
      modules.push({
        num:modules.length+1, icon:'🚂', name:'API e Rotas Backend',
        desc:`${routes.length} rotas detectadas — endpoints REST e lógica de negócio`,
        files:apiFiles,
        deps:deps.filter(d=>['express','fastify','koa','cors','helmet','morgan'].some(k=>d.name.includes(k))),
        independent:false, dependsOn:['Banco de Dados','Autenticação'],
        routes:routes.slice(0,20),
        steps:['Configurar servidor HTTP','Middlewares (cors, helmet)',
               'Criar rotas e controllers','Conectar com dados','Validação de entrada','Testar endpoints'],
      });
    }

    // 5 — Frontend
    const uiFiles = paths.filter(p=>
      ['component','page','view','layout','screen'].some(k=>p.includes(k)) ||
      ['.jsx','.tsx','.vue','.svelte'].some(e=>p.endsWith(e)));
    const fws = (typeof CodeAnalyzer!=='undefined' && CodeAnalyzer.getFrameworks)
                ? CodeAnalyzer.getFrameworks().map(f=>f.name) : [];
    if (uiFiles.length || fws.some(f=>['React','Vue','Svelte','Angular'].includes(f))) {
      modules.push({
        num:modules.length+1, icon:'🎨', name:'Interface do Usuário',
        desc:'Componentes, páginas, layouts e estilização',
        files:uiFiles.slice(0,20),
        deps:deps.filter(d=>['react','vue','svelte','tailwindcss','styled-components'].some(k=>d.name.includes(k))),
        independent:false, dependsOn:['API Backend'],
        steps:['Configurar framework UI','Criar componentes base',
               'Roteamento frontend','Conectar com API','Estilização','Testar responsividade'],
      });
    }

    // 6 — Testes
    const testFiles = paths.filter(p=>
      ['.test.','.spec.','__tests__','/tests/'].some(k=>p.includes(k)));
    if (testFiles.length || deps.some(d=>['jest','vitest','mocha','cypress','playwright'].some(k=>d.name.includes(k)))) {
      modules.push({
        num:modules.length+1, icon:'🧪', name:'Testes',
        desc:'Testes unitários, integração e E2E',
        files:testFiles,
        deps:deps.filter(d=>['jest','vitest','mocha','chai','cypress','playwright'].some(k=>d.name.includes(k))),
        independent:true,
        steps:['Configurar framework de testes','Testes unitários',
               'Testes de integração','Testes E2E','Integrar CI/CD'],
      });
    }

    // 7 — Deploy
    const infraFiles = paths.filter(p=>
      ['Dockerfile','docker-compose','.github','nginx','vercel','netlify','railway'].some(k=>p.includes(k)));
    modules.push({
      num:modules.length+1, icon:'🚀', name:'Deploy e Infraestrutura',
      desc:'Containerização, CI/CD e ambiente de produção',
      files:infraFiles, deps:[],
      independent:false, dependsOn:['Todos os módulos anteriores'],
      steps:['Criar Dockerfile','Variáveis de produção','Pipeline CI/CD',
             'Escolher plataforma','Configurar domínio/SSL','Monitoramento'],
    });

    return modules;
  }

  function renderModulesMD(modules) {
    let md = `## 🧩 Plano Modular\n\n`;
    md += `> Cada módulo pode ser desenvolvido e testado de forma independente\n\n`;
    md += `**Total:** ${modules.length} módulos\n\n`;
    for (const mod of modules) {
      md += `### ${mod.icon} Módulo ${mod.num}: ${mod.name}\n\n`;
      md += `**Descrição:** ${mod.desc}\n\n`;
      md += `**Independente:** ${mod.independent
        ? '✅ Sim'
        : `⚠️ Depende de: ${mod.dependsOn?.join(', ')}`}\n\n`;
      if (mod.deps?.length) {
        md += `**Dependências:**\n`;
        md += mod.deps.slice(0,6).map(d=>`- \`${d.name}@${d.version}\``).join('\n')+'\n\n';
      }
      if (mod.files?.length) {
        md += `**Arquivos:**\n`;
        md += mod.files.slice(0,8).map(f=>`- \`${f}\``).join('\n')+'\n\n';
      }
      if (mod.routes?.length) {
        md += `**Rotas:**\n`;
        md += mod.routes.slice(0,6).map(r=>`- \`${r.method} ${r.path}\``).join('\n')+'\n\n';
      }
      md += `**Passos:**\n`;
      md += mod.steps.map((s,i)=>`${i+1}. ${s}`).join('\n')+'\n\n---\n\n';
    }
    return md;
  }

  function genSteps(name, deps, modules) {
    const slug     = name.replace(/\s/g,'-').toLowerCase();
    const prodDeps = deps.filter(d=>d.type==='prod').map(d=>d.name).join(' ');
    const devDeps  = deps.filter(d=>d.type==='dev').map(d=>d.name).join(' ');
    return `## 📝 Passos para Recriar o Projeto

### 1️⃣ Preparação

\`\`\`bash
node --version
mkdir ${slug} && cd ${slug}
npm init -y
\`\`\`

### 2️⃣ Instalar Dependências

\`\`\`bash
npm install ${prodDeps||'# adicione aqui'}
npm install -D ${devDeps||'# adicione aqui'}
\`\`\`

### 3️⃣ Criar Estrutura de Pastas
> Execute o script BAT/SH do módulo "Scripts"

### 4️⃣ Configurar Ambiente

\`\`\`bash
cp .env.example .env
# Edite .env com suas credenciais
\`\`\`

### 5️⃣ Implementar Módulos em Ordem

${modules.map((m,i)=>`${i+1}. ${m.icon} **${m.name}** — ${m.desc}`).join('\n')}

### 6️⃣ Executar

\`\`\`bash
npm run dev   # desenvolvimento
npm test      # testes
npm run build # produção
\`\`\`

### ✅ Checklist Final

- [ ] Variáveis de ambiente configuradas
- [ ] Banco conectado e migrations rodadas
- [ ] Testes passando
- [ ] Build de produção funcionando
- [ ] Deploy realizado`;
  }

  function genSetupScripts(name, deps, files) {
    const slug  = name.replace(/\s/g,'-').toLowerCase();
    const paths = Object.keys(files)
      .filter(p=>!p.includes('node_modules') && p.includes('/'))
      .map(p=>p.split('/').slice(0,-1).join('/'))
      .filter((v,i,a)=>a.indexOf(v)===i)
      .slice(0,30);
    const bat = paths.map(p=>`mkdir "${p.replace(/\//g,'\\')}" 2>nul`).join('\n');
    const sh  = paths.map(p=>`mkdir -p "${p}"`).join('\n');
    return `## ⚙️ Scripts de Setup

### Windows (.bat)

\`\`\`bat
@echo off
echo Criando estrutura: ${name}
mkdir "${slug}"
cd "${slug}"
${bat}
echo Pronto! Execute: npm install
\`\`\`

### Linux/Mac (.sh)

\`\`\`bash
#!/bin/bash
echo "Criando estrutura: ${name}"
mkdir -p "${slug}" && cd "${slug}"
${sh}
echo "✅ Pronto! Execute: npm install"
\`\`\``;
  }

  // ════════════════════════════════════════════════════════════
  //  RENDERIZAÇÃO
  // ════════════════════════════════════════════════════════════

  function renderPlan() {
    // Preview
    const preview = document.getElementById('plan-preview-content');
    if (preview) preview.innerHTML = MDRenderer.render(fullPlan);

    // Raw
    const raw = document.getElementById('plan-raw-content');
    if (raw) raw.value = fullPlan;

    // Partes
    renderParts();

    // Módulos
    renderModularView();
  }

  function renderParts() {
    const container = document.getElementById('parts-container');
    if (!container) return;
    const labels = {
      overview: {icon:'📌',title:'Visão Geral'},
      tech:     {icon:'🏗️',title:'Tecnologias'},
      structure:{icon:'🗂️',title:'Estrutura'},
      deps:     {icon:'🧩',title:'Dependências'},
      routes:   {icon:'🛣️',title:'Rotas de API'},
      bugs:     {icon:'🐛',title:'Problemas'},
      modules:  {icon:'🧩',title:'Módulos'},
      steps:    {icon:'📝',title:'Passos'},
      scripts:  {icon:'⚙️',title:'Scripts'},
    };
    container.innerHTML = Object.entries(planParts).map(([key,content])=>{
      if (!content) return '';
      const lb   = labels[key]||{icon:'📄',title:key};
      const size = new Blob([content]).size;
      const sz   = size<1024?`${size}B`:`${(size/1024).toFixed(1)}KB`;
      return `
        <div class="plan-section">
          <div class="plan-section-header"
               onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
            <div class="plan-section-title">${lb.icon} ${lb.title}</div>
            <div class="plan-section-actions" onclick="event.stopPropagation()">
              <button class="btn btn-secondary" style="padding:3px 8px;font-size:11px;"
                      onclick="Planner._copyPart('${key}')">📋 Copiar</button>
              <button class="btn btn-secondary" style="padding:3px 8px;font-size:11px;"
                      onclick="Planner.downloadPart('${key}')">⬇️ Baixar</button>
              <span style="font-size:11px;color:var(--text-muted);padding:0 4px;">${sz}</span>
            </div>
          </div>
          <div class="plan-section-body" style="display:none;">
            <div class="md-preview">${MDRenderer.render(content)}</div>
            <textarea class="md-editor" style="margin-top:10px;min-height:150px;">${content}</textarea>
          </div>
        </div>`;
    }).join('');
  }

  function renderModularView() {
    const container = document.getElementById('modular-container');
    if (!container || !planModules.length) return;
    container.innerHTML = planModules.map(mod=>`
      <div class="module-plan-card">
        <div class="module-plan-header"
             onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
          <div class="module-plan-num">${mod.num}</div>
          <div class="module-plan-title">${mod.icon} ${mod.name}</div>
          <span style="font-size:11px;color:${mod.independent?'var(--accent-green)':'var(--accent-yellow)'};">
            ${mod.independent?'✅ Independente':'⚠️ Tem dependências'}
          </span>
        </div>
        <div class="module-plan-body" style="display:none;">
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:10px;">${mod.desc}</p>
          ${mod.dependsOn?`<p style="font-size:12px;color:var(--accent-yellow);">⚠️ Depende de: ${mod.dependsOn.join(', ')}</p>`:''}
          ${mod.deps?.length?`
            <div style="margin:10px 0;">
              <div style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:6px;">DEPENDÊNCIAS</div>
              <div style="display:flex;flex-wrap:wrap;gap:5px;">
                ${mod.deps.slice(0,8).map(d=>`<span style="background:var(--bg-hover);border:1px solid var(--border);border-radius:10px;padding:2px 8px;font-size:11px;font-family:var(--font-mono);">${d.name}</span>`).join('')}
              </div>
            </div>`:''}
          ${mod.files?.length?`
            <div style="margin:10px 0;">
              <div style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:6px;">ARQUIVOS</div>
              ${mod.files.slice(0,6).map(f=>`<div style="font-family:var(--font-mono);font-size:11px;color:var(--accent);padding:2px 0;">📄 ${f}</div>`).join('')}
            </div>`:''}
          <div style="margin:10px 0;">
            <div style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:6px;">PASSOS</div>
            ${mod.steps.map((s,i)=>`<div style="font-size:12px;padding:3px 0;color:var(--text-secondary);">${i+1}. ${s}</div>`).join('')}
          </div>
          <div style="display:flex;gap:6px;margin-top:10px;">
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;"
                    onclick="Planner._copyModuleMD(${mod.num-1})">📋 Copiar MD</button>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;"
                    onclick="Planner._downloadModuleMD(${mod.num-1})">⬇️ Baixar MD</button>
          </div>
        </div>
      </div>`).join('');
  }

  // ── Trocar view ────────────────────────────────────────────
  function setView(view, el) {
    currentView = view;
    ['preview','raw','parts','modular'].forEach(v => {
      const el2 = document.getElementById(`view-${v}`);
      if (el2) el2.style.display = v===view ? 'block' : 'none';
    });
    document.querySelectorAll('#planner-content .plan-type-tab')
      .forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
  }

  // ── Download / Copiar ──────────────────────────────────────
  function downloadAll() {
    if (!fullPlan) { Shell.toast('Gere o plano primeiro','warning'); return; }
    const name = Shell.getState('projectName')||'projeto';
    _download(`plano-${name}.md`, fullPlan, 'text/markdown');
    Shell.toast('Plano completo baixado!','success');
  }

  function copyAll() {
    if (!fullPlan) { Shell.toast('Gere o plano primeiro','warning'); return; }
    navigator.clipboard.writeText(fullPlan)
      .then(()=>Shell.toast('Plano copiado!','success'))
      .catch(()=>Shell.toast('Erro ao copiar','error'));
  }

  function downloadPart(key) {
    const content = planParts[key];
    if (!content) { Shell.toast('Parte não encontrada — gere o plano primeiro','warning'); return; }
    _download(`plano-${key}.md`, content, 'text/markdown');
    Shell.toast(`Parte "${key}" baixada!`,'success');
  }

  function _copyPart(key) {
    const content = planParts[key];
    if (!content) { Shell.toast('Gere o plano primeiro','warning'); return; }
    navigator.clipboard.writeText(content)
      .then(()=>Shell.toast('Copiado!','success'))
      .catch(()=>Shell.toast('Erro ao copiar','error'));
  }

  function _copyModuleMD(idx) {
    const mod = planModules[idx];
    if (!mod) return;
    const md = renderModulesMD([mod]);
    navigator.clipboard.writeText(md)
      .then(()=>Shell.toast(`Módulo ${mod.num} copiado!`,'success'))
      .catch(()=>Shell.toast('Erro ao copiar','error'));
  }

  function _downloadModuleMD(idx) {
    const mod = planModules[idx];
    if (!mod) return;
    const md = renderModulesMD([mod]);
    _download(`modulo-${mod.num}-${mod.name.replace(/\s/g,'-').toLowerCase()}.md`, md, 'text/markdown');
    Shell.toast(`Módulo ${mod.num} baixado!`,'success');
  }

  function _download(filename, content, type) {
    const blob = new Blob([content],{type});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href=url; a.download=filename; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    window.addEventListener('shell:navigate', e => {
      if (e.detail.moduleId === 'planner') {
        const saved = Shell.getState('plan');
        if (saved && !fullPlan) {
          fullPlan = saved;
          document.getElementById('planner-empty').style.display   = 'none';
          document.getElementById('planner-content').style.display = 'block';
          document.getElementById('btn-dl-all').style.display      = '';
          document.getElementById('btn-copy-all').style.display    = '';
          const preview = document.getElementById('plan-preview-content');
          if (preview) preview.innerHTML = MDRenderer.render(fullPlan);
          const raw = document.getElementById('plan-raw-content');
          if (raw) raw.value = fullPlan;
        }
      }
    });
  }

  // ── API Pública ────────────────────────────────────────────
  return {
    init, generate,
    setPlanType, toggleSection,
    setView, setView,
    downloadAll, copyAll,
    downloadPart, _copyPart,
    _copyModuleMD, _downloadModuleMD,
    getPlan: () => fullPlan,
    getParts: () => planParts,
    getModules: () => planModules,
  };

})();

document.addEventListener('DOMContentLoaded', Planner.init);
