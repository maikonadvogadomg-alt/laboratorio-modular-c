
// ============================================================
//  MÓDULO 6 — GERADOR DE SCRIPTS BAT / SH / PS1 / MAKEFILE
//  Comentados em PT-BR, completos, prontos para usar
// ============================================================

const ScriptGen = (() => {

  let scripts  = { bat:'', sh:'', ps1:'', makefile:'' };
  let currentTab = 'bat';

  const opts = {
    folders:  true,
    files:    true,
    npm:      true,
    env:      true,
    git:      true,
    readme:   true,
    pkgjson:  true,
    gitignore:true,
  };

  // ── Toggle opções ──────────────────────────────────────────
  function toggleOpt(key) {
    opts[key] = !opts[key];
    const el = document.getElementById(`opt-${key}`);
    if (el) {
      el.classList.toggle('checked', opts[key]);
      el.textContent = opts[key] ? '✓' : '';
    }
  }

  // ── Tabs ───────────────────────────────────────────────────
  function setTab(tab, el) {
    currentTab = tab;
    ['bat','sh','ps1','makefile'].forEach(t => {
      const p = document.getElementById(`script-panel-${t}`);
      if (p) p.style.display = t===tab ? 'block' : 'none';
    });
    document.querySelectorAll('.script-type-tab')
      .forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
  }

  // ── Gerar todos os scripts ─────────────────────────────────
  function generate() {
    const files   = Shell.getState('projectFiles')  || {};
    const deps    = Shell.getState('dependencies')  || [];
    const name    = Shell.getState('projectName')   || 'meu-projeto';
    const pkgMgr  = document.getElementById('pkg-manager')?.value   || 'npm';
    const nodeVer = document.getElementById('node-version')?.value  || '18';

    if (!Object.keys(files).length) {
      Shell.toast('Importe um projeto primeiro!', 'warning');
      Shell.navigate('importer');
      return;
    }

    // Coleta estrutura de pastas e arquivos
    const allPaths  = Object.keys(files).filter(p => !p.includes('node_modules') && !p.includes('.cache'));
    const dirs      = collectDirs(allPaths);
    const keyFiles  = collectKeyFiles(allPaths, files);
    const slug      = name.replace(/[\s@/\\]/g,'-').toLowerCase();

    // Coleta deps
    const prodDeps  = deps.filter(d => d.type==='prod').map(d=>`${d.name}@${d.version.replace(/[\^~]/,'')}`);
    const devDeps   = deps.filter(d => d.type==='dev').map(d=>`${d.name}@${d.version.replace(/[\^~]/,'')}`);

    // Gera cada script
    scripts.bat      = genBAT(name, slug, dirs, keyFiles, prodDeps, devDeps, pkgMgr, nodeVer, files, deps);
    scripts.sh       = genSH(name, slug, dirs, keyFiles, prodDeps, devDeps, pkgMgr, nodeVer, files, deps);
    scripts.ps1      = genPS1(name, slug, dirs, keyFiles, prodDeps, devDeps, pkgMgr, nodeVer, files, deps);
    scripts.makefile = genMakefile(name, slug, prodDeps, devDeps, pkgMgr, files, deps);

    // Salva no estado
    Shell.setState('scripts', scripts);

    // Renderiza
    renderScript('bat');
    renderScript('sh');
    renderScript('ps1');
    renderScript('makefile');

    document.getElementById('scripts-empty').style.display   = 'none';
    document.getElementById('scripts-content').style.display = 'block';
    document.getElementById('btn-scripts-dl').style.display  = '';

    Shell.toast(`✅ Scripts gerados! ${dirs.length} pastas, ${keyFiles.length} arquivos-chave`, 'success');
  }

  // ── Coletar pastas únicas ──────────────────────────────────
  function collectDirs(paths) {
    const dirs = new Set();
    for (const p of paths) {
      const parts = p.split(/[/\\]/);
      for (let i = 1; i < parts.length; i++) {
        dirs.add(parts.slice(0, i).join('/'));
      }
    }
    return [...dirs].sort();
  }

  // ── Coletar arquivos-chave com conteúdo ────────────────────
  function collectKeyFiles(paths, files) {
    const keyNames = [
      '.env.example','.gitignore','README.md','Dockerfile',
      'docker-compose.yml','vite.config.ts','vite.config.js',
      'next.config.js','next.config.ts','tailwind.config.js',
      'tailwind.config.ts','tsconfig.json','jest.config.js',
      'jest.config.ts','.eslintrc.js','.eslintrc.json',
      '.prettierrc','postcss.config.js','babel.config.js',
    ];
    return paths.filter(p => {
      const name = p.split('/').pop();
      return keyNames.includes(name);
    }).map(p => ({ path: p, content: files[p] || '' }));
  }

  // ════════════════════════════════════════════════════════════
  //  GERADOR BAT — WINDOWS
  // ════════════════════════════════════════════════════════════
  function genBAT(name, slug, dirs, keyFiles, prodDeps, devDeps, pkgMgr, nodeVer, files, deps) {
    const date   = new Date().toLocaleDateString('pt-BR');
    const pkgJson = buildPackageJSON(name, slug, deps, files);
    const installCmd = pkgMgr === 'yarn' ? 'yarn add' : pkgMgr === 'pnpm' ? 'pnpm add' : pkgMgr === 'bun' ? 'bun add' : 'npm install';
    const devFlag    = pkgMgr === 'yarn' ? '--dev' : pkgMgr === 'pnpm' ? '-D' : pkgMgr === 'bun' ? '-d' : '--save-dev';
    const runCmd     = pkgMgr === 'yarn' ? 'yarn' : pkgMgr === 'pnpm' ? 'pnpm' : pkgMgr === 'bun' ? 'bun' : 'npm run';

    let bat = '';
    bat += `@echo off\n`;
    bat += `chcp 65001 >nul\n`;
    bat += `setlocal EnableDelayedExpansion\n\n`;
    bat += `:: ================================================================\n`;
    bat += `:: Script de Setup — ${name}\n`;
    bat += `:: Gerado pelo ProjetoLens em ${date}\n`;
    bat += `:: Execute como Administrador se necessário\n`;
    bat += `:: ================================================================\n\n`;

    bat += `echo.\n`;
    bat += `echo  ╔══════════════════════════════════════╗\n`;
    bat += `echo  ║   Setup: ${name.substring(0,30).padEnd(30)} ║\n`;
    bat += `echo  ║   Gerado pelo ProjetoLens             ║\n`;
    bat += `echo  ╚══════════════════════════════════════╝\n`;
    bat += `echo.\n\n`;

    // Verificar Node.js
    bat += `:: ── Verificar Node.js ──────────────────────────────────────\n`;
    bat += `echo [1/6] Verificando Node.js...\n`;
    bat += `node --version >nul 2>&1\n`;
    bat += `if %errorlevel% neq 0 (\n`;
    bat += `    echo ERRO: Node.js nao encontrado!\n`;
    bat += `    echo Baixe em: https://nodejs.org (versao ${nodeVer} ou superior)\n`;
    bat += `    pause\n`;
    bat += `    exit /b 1\n`;
    bat += `)\n`;
    bat += `echo    OK: Node.js encontrado\n\n`;

    // Criar pasta raiz
    bat += `:: ── Criar pasta do projeto ─────────────────────────────────\n`;
    bat += `echo [2/6] Criando estrutura de pastas...\n`;
    if (opts.folders) {
      bat += `if not exist "${slug}" mkdir "${slug}"\n`;
      bat += `cd "${slug}"\n\n`;
      for (const dir of dirs.slice(0, 80)) {
        const winDir = dir.replace(/\//g, '\\');
        bat += `if not exist "${winDir}" mkdir "${winDir}" 2>nul\n`;
      }
    }
    bat += `echo    OK: ${dirs.length} pastas criadas\n\n`;

    // Criar package.json
    if (opts.pkgjson) {
      bat += `:: ── Criar package.json ─────────────────────────────────────\n`;
      bat += `echo [3/6] Criando package.json...\n`;
      bat += `(\n`;
      for (const line of pkgJson.split('\n')) {
        bat += `echo ${line.replace(/[<>|]/g,'').replace(/"/g,'\\"')}\n`;
      }
      bat += `) > package.json\n`;
      bat += `echo    OK: package.json criado\n\n`;
    }

    // Criar .gitignore
    if (opts.gitignore) {
      bat += `:: ── Criar .gitignore ───────────────────────────────────────\n`;
      bat += `echo [3/6] Criando .gitignore...\n`;
      bat += `(\n`;
      const gitignoreContent = buildGitignore();
      for (const line of gitignoreContent.split('\n')) {
        bat += `echo ${line||'.'}\n`;
      }
      bat += `) > .gitignore\n`;
      bat += `echo    OK: .gitignore criado\n\n`;
    }

    // Criar .env
    if (opts.env) {
      bat += `:: ── Criar arquivo .env ─────────────────────────────────────\n`;
      bat += `echo [3/6] Criando .env.example...\n`;
      const envContent = buildEnvExample(deps);
      bat += `(\n`;
      for (const line of envContent.split('\n')) {
        bat += `echo ${line||'.'}\n`;
      }
      bat += `) > .env.example\n`;
      bat += `echo    OK: .env.example criado\n`;
      bat += `copy .env.example .env >nul\n`;
      bat += `echo    OK: .env criado (edite com suas credenciais)\n\n`;
    }

    // Criar README
    if (opts.readme) {
      bat += `:: ── Criar README.md ────────────────────────────────────────\n`;
      bat += `echo [3/6] Criando README.md...\n`;
      bat += `(\n`;
      bat += `echo # ${name}\n`;
      bat += `echo.\n`;
      bat += `echo ## Instalacao\n`;
      bat += `echo.\n`;
      bat += `echo \`\`\`bash\n`;
      bat += `echo ${pkgMgr} install\n`;
      bat += `echo \`\`\`\n`;
      bat += `echo.\n`;
      bat += `echo ## Uso\n`;
      bat += `echo.\n`;
      bat += `echo \`\`\`bash\n`;
      bat += `echo ${runCmd} dev\n`;
      bat += `echo \`\`\`\n`;
      bat += `) > README.md\n`;
      bat += `echo    OK: README.md criado\n\n`;
    }

    // Criar arquivos-chave
    if (opts.files && keyFiles.length > 0) {
      bat += `:: ── Criar arquivos de configuracao ─────────────────────────\n`;
      bat += `echo [4/6] Criando arquivos de configuracao...\n`;
      for (const kf of keyFiles.slice(0, 15)) {
        const winPath = kf.path.replace(/\//g,'\\');
        bat += `type nul > "${winPath}" 2>nul\n`;
        bat += `echo    OK: ${kf.path}\n`;
      }
      bat += '\n';
    }

    // Instalar dependências
    if (opts.npm && (prodDeps.length > 0 || devDeps.length > 0)) {
      bat += `:: ── Instalar dependencias ──────────────────────────────────\n`;
      bat += `echo [5/6] Instalando dependencias (pode demorar)...\n`;
      if (prodDeps.length > 0) {
        bat += `echo    Instalando ${prodDeps.length} dependencias de producao...\n`;
        // Divide em chunks de 10 para não estourar linha
        for (let i = 0; i < prodDeps.length; i += 10) {
          const chunk = prodDeps.slice(i, i+10).join(' ');
          bat += `${installCmd} ${chunk}\n`;
        }
      }
      if (devDeps.length > 0) {
        bat += `echo    Instalando ${devDeps.length} dependencias de desenvolvimento...\n`;
        for (let i = 0; i < devDeps.length; i += 10) {
          const chunk = devDeps.slice(i, i+10).join(' ');
          bat += `${installCmd} ${devFlag} ${chunk}\n`;
        }
      }
      bat += `echo    OK: Dependencias instaladas\n\n`;
    }

    // Git init
    if (opts.git) {
      bat += `:: ── Inicializar Git ────────────────────────────────────────\n`;
      bat += `echo [6/6] Inicializando repositorio Git...\n`;
      bat += `git init >nul 2>&1\n`;
      bat += `git add . >nul 2>&1\n`;
      bat += `git commit -m "feat: setup inicial do projeto" >nul 2>&1\n`;
      bat += `echo    OK: Git inicializado\n\n`;
    }

    bat += `:: ── Finalizado ─────────────────────────────────────────────\n`;
    bat += `echo.\n`;
    bat += `echo  ╔══════════════════════════════════════╗\n`;
    bat += `echo  ║   ✅ Setup concluido com sucesso!     ║\n`;
    bat += `echo  ╚══════════════════════════════════════╝\n`;
    bat += `echo.\n`;
    bat += `echo  Proximo passo:\n`;
    bat += `echo    ${runCmd} dev\n`;
    bat += `echo.\n`;
    bat += `pause\n`;

    return bat;
  }

  // ════════════════════════════════════════════════════════════
  //  GERADOR SH — LINUX / MAC
  // ════════════════════════════════════════════════════════════
  function genSH(name, slug, dirs, keyFiles, prodDeps, devDeps, pkgMgr, nodeVer, files, deps) {
    const date   = new Date().toLocaleDateString('pt-BR');
    const pkgJson = buildPackageJSON(name, slug, deps, files);
    const installCmd = pkgMgr==='yarn'?'yarn add':pkgMgr==='pnpm'?'pnpm add':pkgMgr==='bun'?'bun add':'npm install';
    const devFlag    = pkgMgr==='yarn'?'--dev':pkgMgr==='pnpm'?'-D':pkgMgr==='bun'?'-d':'--save-dev';
    const runCmd     = pkgMgr==='yarn'?'yarn':pkgMgr==='pnpm'?'pnpm':pkgMgr==='bun'?'bun':'npm run';

    let sh = '';
    sh += `#!/bin/bash\n`;
    sh += `# ================================================================\n`;
    sh += `# Script de Setup — ${name}\n`;
    sh += `# Gerado pelo ProjetoLens em ${date}\n`;
    sh += `# Uso: chmod +x setup.sh && ./setup.sh\n`;
    sh += `# ================================================================\n\n`;

    sh += `set -e  # Para em caso de erro\n\n`;

    // Cores
    sh += `# Cores para output\n`;
    sh += `RED='\\033[0;31m'\n`;
    sh += `GREEN='\\033[0;32m'\n`;
    sh += `YELLOW='\\033[1;33m'\n`;
    sh += `BLUE='\\033[0;34m'\n`;
    sh += `NC='\\033[0m' # Sem cor\n\n`;

    sh += `echo -e "\${BLUE}"\n`;
    sh += `echo "  ╔══════════════════════════════════════╗"\n`;
    sh += `echo "  ║   Setup: ${name.substring(0,30).padEnd(30)} ║"\n`;
    sh += `echo "  ║   Gerado pelo ProjetoLens             ║"\n`;
    sh += `echo "  ╚══════════════════════════════════════╝"\n`;
    sh += `echo -e "\${NC}"\n\n`;

    // Verificar Node.js
    sh += `# ── Verificar Node.js ──────────────────────────────────────\n`;
    sh += `echo -e "\${YELLOW}[1/6] Verificando Node.js...\${NC}"\n`;
    sh += `if ! command -v node &> /dev/null; then\n`;
    sh += `    echo -e "\${RED}ERRO: Node.js não encontrado!\${NC}"\n`;
    sh += `    echo "Instale via: https://nodejs.org (versão ${nodeVer}+)"\n`;
    sh += `    echo "Ou via nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"\n`;
    sh += `    exit 1\n`;
    sh += `fi\n`;
    sh += `echo -e "\${GREEN}   ✓ Node.js $(node --version) encontrado\${NC}"\n\n`;

    // Criar estrutura
    if (opts.folders) {
      sh += `# ── Criar estrutura de pastas ───────────────────────────────\n`;
      sh += `echo -e "\${YELLOW}[2/6] Criando estrutura de pastas...\${NC}"\n`;
      sh += `mkdir -p "${slug}"\n`;
      sh += `cd "${slug}"\n\n`;
      for (const dir of dirs.slice(0, 80)) {
        sh += `mkdir -p "${dir}"\n`;
      }
      sh += `echo -e "\${GREEN}   ✓ ${dirs.length} pastas criadas\${NC}"\n\n`;
    }

    // package.json
    if (opts.pkgjson) {
      sh += `# ── Criar package.json ──────────────────────────────────────\n`;
      sh += `echo -e "\${YELLOW}[3/6] Criando arquivos de configuração...\${NC}"\n`;
      sh += `cat > package.json << 'PKGJSON'\n`;
      sh += pkgJson + '\n';
      sh += `PKGJSON\n`;
      sh += `echo -e "\${GREEN}   ✓ package.json criado\${NC}"\n\n`;
    }

    // .gitignore
    if (opts.gitignore) {
      sh += `# ── Criar .gitignore ────────────────────────────────────────\n`;
      sh += `cat > .gitignore << 'GITIGNORE'\n`;
      sh += buildGitignore() + '\n';
      sh += `GITIGNORE\n`;
      sh += `echo -e "\${GREEN}   ✓ .gitignore criado\${NC}"\n\n`;
    }

    // .env
    if (opts.env) {
      sh += `# ── Criar .env ──────────────────────────────────────────────\n`;
      sh += `cat > .env.example << 'ENVFILE'\n`;
      sh += buildEnvExample(deps) + '\n';
      sh += `ENVFILE\n`;
      sh += `cp .env.example .env\n`;
      sh += `echo -e "\${GREEN}   ✓ .env criado (edite com suas credenciais)\${NC}"\n\n`;
    }

    // README
    if (opts.readme) {
      sh += `# ── Criar README.md ─────────────────────────────────────────\n`;
      sh += `cat > README.md << 'README'\n`;
      sh += `# ${name}\n\n`;
      sh += `## Instalação\n\n\`\`\`bash\n${pkgMgr} install\n\`\`\`\n\n`;
      sh += `## Uso\n\n\`\`\`bash\n${runCmd} dev\n\`\`\`\n`;
      sh += `README\n`;
      sh += `echo -e "\${GREEN}   ✓ README.md criado\${NC}"\n\n`;
    }

    // Arquivos-chave vazios
    if (opts.files && keyFiles.length > 0) {
      sh += `# ── Criar arquivos de configuração ──────────────────────────\n`;
      sh += `echo -e "\${YELLOW}[4/6] Criando arquivos de configuração...\${NC}"\n`;
      for (const kf of keyFiles.slice(0, 15)) {
        sh += `touch "${kf.path}" 2>/dev/null || true\n`;
      }
      sh += `echo -e "\${GREEN}   ✓ Arquivos criados\${NC}"\n\n`;
    }

    // Instalar deps
    if (opts.npm && (prodDeps.length > 0 || devDeps.length > 0)) {
      sh += `# ── Instalar dependências ───────────────────────────────────\n`;
      sh += `echo -e "\${YELLOW}[5/6] Instalando dependências...\${NC}"\n`;
      if (prodDeps.length > 0) {
        sh += `echo "   Instalando ${prodDeps.length} deps de produção..."\n`;
        for (let i = 0; i < prodDeps.length; i += 10) {
          const chunk = prodDeps.slice(i, i+10).join(' ');
          sh += `${installCmd} ${chunk}\n`;
        }
      }
      if (devDeps.length > 0) {
        sh += `echo "   Instalando ${devDeps.length} deps de desenvolvimento..."\n`;
        for (let i = 0; i < devDeps.length; i += 10) {
          const chunk = devDeps.slice(i, i+10).join(' ');
          sh += `${installCmd} ${devFlag} ${chunk}\n`;
        }
      }
      sh += `echo -e "\${GREEN}   ✓ Dependências instaladas\${NC}"\n\n`;
    }

    // Git
    if (opts.git) {
      sh += `# ── Inicializar Git ─────────────────────────────────────────\n`;
      sh += `echo -e "\${YELLOW}[6/6] Inicializando Git...\${NC}"\n`;
      sh += `git init > /dev/null 2>&1 || true\n`;
      sh += `git add . > /dev/null 2>&1 || true\n`;
      sh += `git commit -m "feat: setup inicial do projeto" > /dev/null 2>&1 || true\n`;
      sh += `echo -e "\${GREEN}   ✓ Git inicializado\${NC}"\n\n`;
    }

    sh += `# ── Finalizado ──────────────────────────────────────────────\n`;
    sh += `echo -e "\${GREEN}"\n`;
    sh += `echo "  ╔══════════════════════════════════════╗"\n`;
    sh += `echo "  ║   ✅ Setup concluído com sucesso!     ║"\n`;
    sh += `echo "  ╚══════════════════════════════════════╝"\n`;
    sh += `echo -e "\${NC}"\n`;
    sh += `echo "  Próximo passo: ${runCmd} dev"\n`;

    return sh;
  }

  // ════════════════════════════════════════════════════════════
  //  GERADOR PS1 — POWERSHELL
  // ════════════════════════════════════════════════════════════
  function genPS1(name, slug, dirs, keyFiles, prodDeps, devDeps, pkgMgr, nodeVer, files, deps) {
    const date = new Date().toLocaleDateString('pt-BR');
    const runCmd = pkgMgr==='yarn'?'yarn':pkgMgr==='pnpm'?'pnpm':pkgMgr==='bun'?'bun':'npm run';

    let ps = '';
    ps += `# ================================================================\n`;
    ps += `# Script de Setup — ${name}\n`;
    ps += `# Gerado pelo ProjetoLens em ${date}\n`;
    ps += `# Uso: Set-ExecutionPolicy RemoteSigned; .\\setup.ps1\n`;
    ps += `# ================================================================\n\n`;

    ps += `$ErrorActionPreference = "Stop"\n`;
    ps += `$ProjectName = "${name}"\n`;
    ps += `$ProjectSlug = "${slug}"\n\n`;

    ps += `Write-Host "  Setup: $ProjectName" -ForegroundColor Cyan\n`;
    ps += `Write-Host "  Gerado pelo ProjetoLens" -ForegroundColor Gray\n\n`;

    // Verificar Node
    ps += `# Verificar Node.js\n`;
    ps += `Write-Host "[1/6] Verificando Node.js..." -ForegroundColor Yellow\n`;
    ps += `try { $nodeVersion = node --version } catch {\n`;
    ps += `    Write-Host "ERRO: Node.js nao encontrado! Instale em https://nodejs.org" -ForegroundColor Red\n`;
    ps += `    exit 1\n`;
    ps += `}\n`;
    ps += `Write-Host "   OK: Node.js $nodeVersion" -ForegroundColor Green\n\n`;

    // Pastas
    if (opts.folders) {
      ps += `# Criar estrutura de pastas\n`;
      ps += `Write-Host "[2/6] Criando pastas..." -ForegroundColor Yellow\n`;
      ps += `New-Item -ItemType Directory -Force -Path "$ProjectSlug" | Out-Null\n`;
      ps += `Set-Location "$ProjectSlug"\n`;
      for (const dir of dirs.slice(0, 80)) {
        ps += `New-Item -ItemType Directory -Force -Path "${dir.replace(/\//g,'\\')}" | Out-Null\n`;
      }
      ps += `Write-Host "   OK: ${dirs.length} pastas criadas" -ForegroundColor Green\n\n`;
    }

    // Deps
    if (opts.npm && (prodDeps.length > 0 || devDeps.length > 0)) {
      ps += `# Instalar dependências\n`;
      ps += `Write-Host "[5/6] Instalando dependencias..." -ForegroundColor Yellow\n`;
      const installCmd = pkgMgr==='yarn'?'yarn add':pkgMgr==='pnpm'?'pnpm add':pkgMgr==='bun'?'bun add':'npm install';
      const devFlag    = pkgMgr==='yarn'?'--dev':pkgMgr==='pnpm'?'-D':pkgMgr==='bun'?'-d':'--save-dev';
      if (prodDeps.length > 0) {
        for (let i = 0; i < prodDeps.length; i += 8) {
          const chunk = prodDeps.slice(i, i+8).join(' ');
          ps += `${installCmd} ${chunk}\n`;
        }
      }
      if (devDeps.length > 0) {
        for (let i = 0; i < devDeps.length; i += 8) {
          const chunk = devDeps.slice(i, i+8).join(' ');
          ps += `${installCmd} ${devFlag} ${chunk}\n`;
        }
      }
      ps += `Write-Host "   OK: Dependencias instaladas" -ForegroundColor Green\n\n`;
    }

    if (opts.git) {
      ps += `# Git\n`;
      ps += `Write-Host "[6/6] Inicializando Git..." -ForegroundColor Yellow\n`;
      ps += `git init 2>&1 | Out-Null\n`;
      ps += `git add . 2>&1 | Out-Null\n`;
      ps += `git commit -m "feat: setup inicial" 2>&1 | Out-Null\n`;
      ps += `Write-Host "   OK: Git inicializado" -ForegroundColor Green\n\n`;
    }

    ps += `Write-Host "✅ Setup concluido! Proximo: ${runCmd} dev" -ForegroundColor Green\n`;
    return ps;
  }

  // ════════════════════════════════════════════════════════════
  //  GERADOR MAKEFILE
  // ════════════════════════════════════════════════════════════
  function genMakefile(name, slug, prodDeps, devDeps, pkgMgr, files, deps) {
    const date   = new Date().toLocaleDateString('pt-BR');
    const runCmd = pkgMgr==='yarn'?'yarn':pkgMgr==='pnpm'?'pnpm run':pkgMgr==='bun'?'bun run':'npm run';
    const inst   = pkgMgr==='yarn'?'yarn':pkgMgr==='pnpm'?'pnpm install':pkgMgr==='bun'?'bun install':'npm install';

    // Detecta scripts do package.json
    const pkgFiles = Object.keys(files).filter(p => p.endsWith('package.json') && !p.includes('node_modules'));
    let scriptsList = ['dev','build','start','test','lint'];
    if (pkgFiles.length > 0) {
      try {
        const pkg = JSON.parse(files[pkgFiles[0]]);
        if (pkg.scripts) scriptsList = Object.keys(pkg.scripts);
      } catch(e) {}
    }

    let mk = '';
    mk += `# ================================================================\n`;
    mk += `# Makefile — ${name}\n`;
    mk += `# Gerado pelo ProjetoLens em ${date}\n`;
    mk += `# Uso: make setup | make dev | make build\n`;
    mk += `# ================================================================\n\n`;

    mk += `.PHONY: setup install dev build start test lint clean help\n\n`;

    mk += `# ── Setup completo do projeto ────────────────────────────────\n`;
    mk += `setup:\n`;
    mk += `\t@echo "🚀 Iniciando setup de ${name}..."\n`;
    mk += `\t@mkdir -p ${dirs_for_make(files)}\n`;
    mk += `\t@${inst}\n`;
    mk += `\t@echo "✅ Setup concluído!"\n\n`;

    mk += `# ── Instalar dependências ────────────────────────────────────\n`;
    mk += `install:\n`;
    mk += `\t@echo "📦 Instalando dependências..."\n`;
    mk += `\t${inst}\n\n`;

    // Scripts do package.json
    for (const script of scriptsList.slice(0, 10)) {
      mk += `# ── ${script} ─────────────────────────────────────────────────\n`;
      mk += `${script}:\n`;
      mk += `\t${runCmd} ${script}\n\n`;
    }

    mk += `# ── Limpar node_modules ─────────────────────────────────────\n`;
    mk += `clean:\n`;
    mk += `\t@echo "🗑️  Limpando node_modules e cache..."\n`;
    mk += `\t@rm -rf node_modules dist build .cache .next .nuxt\n`;
    mk += `\t@echo "✅ Limpeza concluída"\n\n`;

    mk += `# ── Reinstalar tudo ─────────────────────────────────────────\n`;
    mk += `reset: clean install\n\n`;

    mk += `# ── Ajuda ───────────────────────────────────────────────────\n`;
    mk += `help:\n`;
    mk += `\t@echo ""\n`;
    mk += `\t@echo "  ${name} — Comandos disponíveis:"\n`;
    mk += `\t@echo ""\n`;
    mk += `\t@echo "  make setup    — Setup completo do projeto"\n`;
    mk += `\t@echo "  make install  — Instalar dependências"\n`;
    for (const script of scriptsList.slice(0, 6)) {
      mk += `\t@echo "  make ${script.padEnd(10)}— ${runCmd} ${script}"\n`;
    }
    mk += `\t@echo "  make clean    — Remover node_modules"\n`;
    mk += `\t@echo "  make reset    — Limpar e reinstalar"\n`;
    mk += `\t@echo ""\n`;

    return mk;
  }

  function dirs_for_make(files) {
    const dirs = new Set();
    for (const p of Object.keys(files).filter(p=>!p.includes('node_modules'))) {
      const parts = p.split('/');
      if (parts.length > 1) dirs.add(parts[0]);
    }
    return [...dirs].slice(0,20).join(' ');
  }

  // ════════════════════════════════════════════════════════════
  //  HELPERS — package.json, .gitignore, .env
  // ════════════════════════════════════════════════════════════

  function buildPackageJSON(name, slug, deps, files) {
    // Tenta pegar o package.json original
    const pkgPath = Object.keys(files).find(p =>
      p.endsWith('package.json') && !p.includes('node_modules'));
    if (pkgPath) {
      try {
        const orig = JSON.parse(files[pkgPath]);
        // Remove campos desnecessários
        delete orig.readme;
        delete orig._id;
        delete orig._resolved;
        return JSON.stringify(orig, null, 2);
      } catch(e) {}
    }

    // Gera um novo
    const prodObj = {};
    const devObj  = {};
    for (const d of deps) {
      if (d.type === 'prod') prodObj[d.name] = d.version;
      else if (d.type === 'dev') devObj[d.name] = d.version;
    }

    return JSON.stringify({
      name: slug,
      version: '1.0.0',
      description: `Projeto ${name}`,
      main: 'index.js',
      scripts: {
        dev:   'node index.js',
        build: 'echo "build"',
        start: 'node index.js',
        test:  'echo "test"',
      },
      dependencies:    prodObj,
      devDependencies: devObj,
    }, null, 2);
  }

  function buildGitignore() {
    return `# Dependências
node_modules/
.pnp
.pnp.js

# Build
dist/
build/
.next/
.nuxt/
out/

# Ambiente
.env
.env.local
.env.*.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
*.log

# Cache
.cache/
.parcel-cache/
.eslintcache
.stylelintcache

# Editor
.vscode/
.idea/
*.swp
*.swo
.DS_Store
Thumbs.db

# Testes
coverage/
.nyc_output/

# TypeScript
*.tsbuildinfo`;
  }

  function buildEnvExample(deps) {
    let env = `# ================================================================\n`;
    env += `# Variáveis de Ambiente — copie para .env e preencha\n`;
    env += `# ================================================================\n\n`;
    env += `# Ambiente\nNODE_ENV=development\nPORT=3000\n\n`;

    if (deps.some(d => ['mongoose','mongodb'].some(k=>d.name.includes(k)))) {
      env += `# MongoDB\nMONGODB_URI=mongodb://localhost:27017/meu-banco\n\n`;
    }
    if (deps.some(d => ['pg','postgres','sequelize'].some(k=>d.name.includes(k)))) {
      env += `# PostgreSQL\nDATABASE_URL=postgresql://usuario:senha@localhost:5432/meu-banco\n\n`;
    }
    if (deps.some(d => d.name.includes('mysql'))) {
      env += `# MySQL\nMYSQL_URL=mysql://usuario:senha@localhost:3306/meu-banco\n\n`;
    }
    if (deps.some(d => ['jsonwebtoken','jose'].some(k=>d.name.includes(k)))) {
      env += `# JWT\nJWT_SECRET=troque-por-uma-chave-secreta-forte\nJWT_EXPIRES_IN=7d\n\n`;
    }
    if (deps.some(d => d.name.includes('redis'))) {
      env += `# Redis\nREDIS_URL=redis://localhost:6379\n\n`;
    }
    if (deps.some(d => d.name.includes('nodemailer'))) {
      env += `# Email\nSMTP_HOST=smtp.gmail.com\nSMTP_PORT=587\nSMTP_USER=seu@email.com\nSMTP_PASS=sua-senha\n\n`;
    }
    if (deps.some(d => d.name.includes('stripe'))) {
      env += `# Stripe\nSTRIPE_SECRET_KEY=sk_test_...\nSTRIPE_WEBHOOK_SECRET=whsec_...\n\n`;
    }

    env += `# API Keys (adicione conforme necessário)\n# API_KEY=\n# API_SECRET=\n`;
    return env;
  }

  // ════════════════════════════════════════════════════════════
  //  RENDERIZAÇÃO
  // ════════════════════════════════════════════════════════════

  function renderScript(type) {
    const el    = document.getElementById(`${type}-code`);
    const stats = document.getElementById(`${type}-stats`);
    if (!el) return;

    const content = scripts[type] || '';
    el.innerHTML  = highlightScript(content, type);

    if (stats) {
      const lines = content.split('\n').length;
      const size  = new Blob([content]).size;
      const sz    = size < 1024 ? `${size}B` : `${(size/1024).toFixed(1)}KB`;
      stats.innerHTML = `
        <span>📄 ${lines} linhas</span>
        <span>💾 ${sz}</span>
        <span>🔧 ${type.toUpperCase()}</span>`;
    }
  }

  // (a resposta do 4.6 foi cortada aqui; o 6.4 traz o realce completo)
  function highlightScript(code, type) {
    if (typeof ScriptGen !== 'undefined' && ScriptGen._highlightScript) return ScriptGen._highlightScript(code, type);
    return String(code).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return { toggleOpt, setTab, generate, _getScript: (t) => scripts[t] || '', _getAllScripts: () => scripts };
})();
