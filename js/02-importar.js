
// ============================================================
//  MÓDULO 2 — IMPORTADOR UNIVERSAL
//  ZIP, TAR, TAZ, GZ, Pasta — sem limite
// ============================================================

// Carrega libs externas necessárias
(function loadLibs() {
  // JSZip para ZIP
  if (!window.JSZip) {
    const s = document.createElement('script');
    s.src = 'lib/jszip.min.js';
    document.head.appendChild(s);
  }
  // pako para GZ/TAR.GZ
  if (!window.pako) {
    const s = document.createElement('script');
    s.src = 'lib/pako.min.js';
    document.head.appendChild(s);
  }
})();

const Importer = (() => {

  let currentFile = null;
  let currentContent = null;
  let allFiles = {};   // { path: content }
  let fileTree = [];   // estrutura em árvore

  // ── Extensões e ícones ─────────────────────────────────────
  const EXT_ICONS = {
    js:'📜', ts:'📘', jsx:'⚛️', tsx:'⚛️',
    html:'🌐', css:'🎨', scss:'🎨', sass:'🎨',
    json:'📋', md:'📝', txt:'📄', env:'🔒',
    py:'🐍', rb:'💎', php:'🐘', java:'☕',
    go:'🐹', rs:'🦀', cpp:'⚙️', c:'⚙️',
    sh:'💻', bat:'💻', ps1:'💻',
    png:'🖼️', jpg:'🖼️', jpeg:'🖼️', gif:'🖼️', svg:'🖼️', ico:'🖼️',
    pdf:'📕', zip:'📦', tar:'📦', gz:'📦',
    sql:'🗄️', db:'🗄️', sqlite:'🗄️',
    xml:'📋', yaml:'📋', yml:'📋', toml:'📋',
    lock:'🔒', gitignore:'🙈', dockerfile:'🐳',
    default:'📄',
  };

  function getIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (filename === 'Dockerfile' || filename === 'dockerfile') return '🐳';
    if (filename.startsWith('.')) return '🔒';
    return EXT_ICONS[ext] || EXT_ICONS.default;
  }

  function isTextFile(filename) {
    const textExts = ['js','ts','jsx','tsx','html','css','scss','sass','json','md',
      'txt','env','py','rb','php','java','go','rs','cpp','c','h','sh','bat',
      'ps1','xml','yaml','yml','toml','sql','gitignore','dockerfile','lock',
      'config','rc','htaccess','nginx','conf','log','csv','svg','vue','svelte',
      'cjs','mjs','cts','mts','ini','example','webmanifest','mdx','prisma','graphql','gql','kt','swift','cs','xaml','properties','gradle','editorconfig','npmrc','nvmrc','prettierrc','eslintrc','babelrc','tsbuildinfo','txt'];
    const ext = filename.split('.').pop().toLowerCase();
    const base = filename.toLowerCase();
    return textExts.includes(ext) ||
           base.includes('dockerfile') ||
           base.startsWith('.') ||
           !filename.includes('.');
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)}KB`;
    return `${(bytes/1024/1024).toFixed(1)}MB`;
  }

  // ── Progress ───────────────────────────────────────────────
  function showProgress(msg, pct) {
    const el = document.getElementById('import-progress');
    const bar = document.getElementById('progress-bar');
    const txt = document.getElementById('progress-text');
    const pct_el = document.getElementById('progress-percent');
    if (!el) return;
    el.classList.add('visible');
    if (bar) bar.style.width = `${pct}%`;
    if (txt) txt.textContent = msg;
    if (pct_el) pct_el.textContent = `${Math.round(pct)}%`;
  }

  function logProgress(msg) {
    const log = document.getElementById('progress-log');
    if (!log) return;
    const line = document.createElement('div');
    line.textContent = `> ${msg}`;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  }

  function hideProgress() {
    const el = document.getElementById('import-progress');
    if (el) el.classList.remove('visible');
  }

  // ── Drop Zone ──────────────────────────────────────────────
  function initDropZone() {
    const dz = document.getElementById('drop-zone');
    const fi = document.getElementById('file-input-zip');
    const folderInput = document.getElementById('folder-input');
    if (!dz) return;

    dz.addEventListener('dragover', (e) => {
      e.preventDefault();
      dz.classList.add('drag-over');
    });
    dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
    dz.addEventListener('drop', (e) => {
      e.preventDefault();
      dz.classList.remove('drag-over');
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) processFiles(files);
    });

    if (fi) fi.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) processFiles(files);
    });

    if (folderInput) folderInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) processFolderFiles(files);
    });
  }

  function openFolderPicker() {
    document.getElementById('folder-input').click();
  }

  function openFilePicker() {
    document.getElementById('file-input-zip').click();
  }

  // ── Processar pasta ────────────────────────────────────────
  async function processFolderFiles(files) {
    allFiles = {}; window.LabBin = {};
    showProgress('Lendo arquivos da pasta...', 5);
    logProgress(`${files.length} arquivos encontrados`);

    let done = 0;
    for (const file of files) {
      const path = file.webkitRelativePath || file.name;
      showProgress(`Lendo: ${path}`, 5 + (done / files.length) * 90);
      try {
        if (isTextFile(file.name)) {
          const text = await file.text();
          allFiles[path] = text;
          logProgress(`✓ ${path}`);
        } else {
          (window.LabBin = window.LabBin || {})[path] = file; allFiles[path] = `[Arquivo binário: ${formatSize(file.size)}]`;
        }
      } catch(e) {
        logProgress(`✗ Erro: ${path}`);
      }
      done++;
    }

    showProgress('Finalizando...', 98);
    await finalizeImport(files[0]?.webkitRelativePath?.split('/')[0] || 'Projeto');
  }

  // ── Processar arquivos compactados ─────────────────────────
  async function processFiles(files) {
    for (const file of files) {
      const name = file.name.toLowerCase();
      if (name.endsWith('.zip')) {
        await processZip(file);
      } else if (name.endsWith('.tar.gz') || name.endsWith('.tgz') || name.endsWith('.tar')) {
        await processTar(file);
      } else if (name.endsWith('.gz') || name.endsWith('.taz')) {
        await processGz(file);
      } else {
        // Arquivo único
        allFiles = {}; window.LabBin = {};
        const text = await file.text();
        allFiles[file.name] = text;
        await finalizeImport(file.name);
      }
    }
  }

  // ── ZIP ────────────────────────────────────────────────────
  async function processZip(file) {
    allFiles = {}; window.LabBin = {};
    showProgress('Abrindo ZIP...', 5);
    logProgress(`Arquivo: ${file.name} (${formatSize(file.size)})`);

    // Aguarda JSZip carregar
    let attempts = 0;
    while (!window.JSZip && attempts < 50) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }
    if (!window.JSZip) {
      Shell.toast('JSZip não carregou. Verifique sua conexão.', 'error');
      return;
    }

    try {
      const zip = await JSZip.loadAsync(file);
      const entries = Object.keys(zip.files);
      let done = 0;

      for (const path of entries) {
        const entry = zip.files[path];
        if (entry.dir) { done++; continue; }

        showProgress(`Extraindo: ${path}`, 10 + (done / entries.length) * 85);
        logProgress(`✓ ${path}`);

        try {
          if (isTextFile(path.split('/').pop())) {
            const content = await entry.async('string');
            allFiles[path] = content;
          } else {
            const blob = await entry.async('blob');
            (window.LabBin = window.LabBin || {})[path] = blob; allFiles[path] = `[Arquivo binário: ${formatSize(blob.size)}]`;
          }
        } catch(e) {
          allFiles[path] = `[Erro ao ler: ${e.message}]`;
        }
        done++;
      }

      const projectName = file.name.replace(/\.zip$/i, '');
      await finalizeImport(projectName);

    } catch(e) {
      Shell.toast(`Erro ao abrir ZIP: ${e.message}`, 'error');
      hideProgress();
    }
  }

  // ── TAR / TAR.GZ ──────────────────────────────────────────
  async function processTar(file) {
    allFiles = {}; window.LabBin = {};
    showProgress('Lendo arquivo TAR...', 5);
    logProgress(`Arquivo: ${file.name} (${formatSize(file.size)})`);

    try {
      let buffer = await file.arrayBuffer();
      let uint8 = new Uint8Array(buffer);

      // Descomprime GZ se necessário
      const name = file.name.toLowerCase();
      if (name.endsWith('.tar.gz') || name.endsWith('.tgz')) {
        let attempts = 0;
        while (!window.pako && attempts < 50) {
          await new Promise(r => setTimeout(r, 100));
          attempts++;
        }
        if (window.pako) {
          showProgress('Descomprimindo GZ...', 15);
          uint8 = pako.inflate(uint8);
          logProgress('GZ descomprimido');
        }
      }

      showProgress('Parseando TAR...', 30);
      parseTar(uint8);

      const projectName = file.name.replace(/\.(tar\.gz|tgz|tar|taz)$/i, '');
      await finalizeImport(projectName);

    } catch(e) {
      Shell.toast(`Erro ao processar TAR: ${e.message}`, 'error');
      hideProgress();
    }
  }

  function parseTar(uint8) {
    let offset = 0;
    let fileCount = 0;

    while (offset < uint8.length - 512) {
      const header = uint8.slice(offset, offset + 512);
      const name = readTarString(header, 0, 100);
      if (!name || name === '') break;

      const sizeOct = readTarString(header, 124, 12);
      const size = parseInt(sizeOct.trim(), 8) || 0;
      const typeFlag = String.fromCharCode(header[156]);

      offset += 512;

      if (typeFlag !== '5' && size > 0 && name) {
        const content = uint8.slice(offset, offset + size);
        if (isTextFile(name.split('/').pop())) {
          try {
            allFiles[name] = new TextDecoder('utf-8', { fatal: false }).decode(content);
          } catch(e) {
            allFiles[name] = `[Erro de encoding]`;
          }
        } else {
          (window.LabBin = window.LabBin || {})[name] = new Blob([content]); allFiles[name] = `[Arquivo binário: ${formatSize(size)}]`;
        }
        fileCount++;
        logProgress(`✓ ${name}`);
      }

      offset += Math.ceil(size / 512) * 512;
      if (fileCount > 50000) break; // segurança
    }
  }

  function readTarString(buf, offset, length) {
    let str = '';
    for (let i = offset; i < offset + length; i++) {
      if (buf[i] === 0) break;
      str += String.fromCharCode(buf[i]);
    }
    return str.trim();
  }

  // ── GZ simples ─────────────────────────────────────────────
  async function processGz(file) {
    allFiles = {}; window.LabBin = {};
    showProgress('Descomprimindo GZ...', 10);
    let attempts = 0;
    while (!window.pako && attempts < 50) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }
    try {
      const buffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(buffer);
      const decompressed = pako.inflate(uint8);
      const text = new TextDecoder().decode(decompressed);
      const name = file.name.replace(/\.gz$/i, '');
      allFiles[name] = text;
      logProgress(`✓ ${name}`);
      await finalizeImport(name);
    } catch(e) {
      Shell.toast(`Erro ao descomprimir GZ: ${e.message}`, 'error');
      hideProgress();
    }
  }

  // ── Colar package.json ─────────────────────────────────────
  function pasteJSON() {
    Shell.openModal('📋 Colar package.json', `
      <p style="color:var(--text-secondary); font-size:13px; margin-bottom:12px;">
        Cole o conteúdo do seu package.json abaixo:
      </p>
      <textarea id="paste-json-area" style="
        width:100%; height:200px; background:var(--bg-main);
        border:1px solid var(--border); border-radius:var(--radius);
        color:var(--text-primary); font-family:var(--font-mono);
        font-size:12px; padding:10px; resize:vertical;
      " placeholder='{"name":"meu-projeto","dependencies":{"react":"^18.0.0"}}'></textarea>
      <div style="display:flex; gap:8px; margin-top:12px;">
        <button class="btn btn-primary" onclick="Importer.processPastedJSON()">
          ✅ Processar
        </button>
        <button class="btn btn-secondary" onclick="Shell.closeModal()">
          Cancelar
        </button>
      </div>
    `);
  }

  function processPastedJSON() {
    const area = document.getElementById('paste-json-area');
    if (!area) return;
    try {
      const json = JSON.parse(area.value);
      allFiles = { 'package.json': area.value };
      Shell.closeModal();
      finalizeImport(json.name || 'Projeto-Colado');
    } catch(e) {
      Shell.toast('JSON inválido: ' + e.message, 'error');
    }
  }

  // ── Finalizar importação ───────────────────────────────────
  async function finalizeImport(projectName) {
    showProgress('Construindo árvore de arquivos...', 95);

    // Limpa nome do projeto
    const cleanName = projectName.replace(/[/\\]/g, '').trim() || 'Projeto';

    // Constrói árvore
    fileTree = buildTree(allFiles);

    // Salva no estado global
    Shell.setState('projectName', cleanName);
    Shell.setState('projectFiles', allFiles);
    Shell.setState('projectTree', fileTree);

    // Atualiza UI
    showProgress('Pronto!', 100);
    logProgress(`✅ ${Object.keys(allFiles).length} arquivos carregados`);

    setTimeout(() => {
      hideProgress();
      showImportStats(cleanName);
      renderFileTree(fileTree);
      document.getElementById('btn-clear-project').style.display = '';
    }, 600);

    Shell.toast(`✅ "${cleanName}" importado com sucesso!`, 'success');
  }

  // ── Construir árvore ───────────────────────────────────────
  function buildTree(files) {
    const root = {};
    for (const path of Object.keys(files)) {
      const parts = path.split(/[/\\]/);
      let node = root;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;
        if (i === parts.length - 1) {
          node[part] = { __file: true, __path: path };
        } else {
          if (!node[part]) node[part] = {};
          node = node[part];
        }
      }
    }
    return root;
  }

  // ── Renderizar árvore ──────────────────────────────────────
  function renderFileTree(tree, filter = '') {
    const container = document.getElementById('file-tree-container');
    const countEl   = document.getElementById('tree-count');
    if (!container) return;

    const allPaths = Object.keys(allFiles);
    const filtered = filter
      ? allPaths.filter(p => p.toLowerCase().includes(filter.toLowerCase()))
      : null;

    if (countEl) countEl.textContent = allPaths.length;

    let html = '';

    if (filter) {
      // Modo flat com filtro
      for (const path of (filtered || [])) {
        const name = path.split('/').pop();
        const icon = getIcon(name);
        html += `
          <div class="tree-item" onclick="Importer.openFile('${path.replace(/'/g,"\\'")}')">
            <span class="tree-icon">${icon}</span>
            <span class="tree-name" title="${path}">${name}</span>
            <span class="tree-size">${getFileSize(path)}</span>
          </div>`;
      }
    } else {
      html = renderTreeNode(tree, 0);
    }

    container.innerHTML = html || '<div style="padding:16px;color:var(--text-muted);font-size:12px;">Nenhum resultado</div>';
  }

  function renderTreeNode(node, depth) {
    let html = '';
    const indent = depth * 14;
    const entries = Object.entries(node).sort(([a, av], [b, bv]) => {
      const aIsDir = !av.__file;
      const bIsDir = !bv.__file;
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b);
    });

    for (const [name, val] of entries) {
      if (name.startsWith('__')) continue;
      if (val.__file) {
        const icon = getIcon(name);
        const path = val.__path;
        html += `
          <div class="tree-item" style="padding-left:${8 + indent}px"
               onclick="Importer.openFile('${path.replace(/'/g,"\\'")}')">
            <span class="tree-icon">${icon}</span>
            <span class="tree-name" title="${path}">${name}</span>
            <span class="tree-size">${getFileSize(path)}</span>
          </div>`;
      } else {
        html += `
          <div class="tree-item is-dir" style="padding-left:${8 + indent}px"
               onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'':'none'">
            <span class="tree-icon">📁</span>
            <span class="tree-name">${name}</span>
          </div>
          <div class="tree-children">
            ${renderTreeNode(val, depth + 1)}
          </div>`;
      }
    }
    return html;
  }

  function getFileSize(path) {
    const content = allFiles[path];
    if (!content) return '';
    return formatSize(new Blob([content]).size);
  }

  function filterTree(value) {
    renderFileTree(fileTree, value);
  }

  // ── Abrir arquivo ──────────────────────────────────────────
  function openFile(path) {
    const content = allFiles[path];
    if (content === undefined) { Shell.toast('Arquivo não encontrado', 'error'); return; }

    currentFile = path;
    currentContent = content;

    // Ativa aba do explorador se não estiver
    if (Shell.getState('activeModule') !== 'explorer') {
      Shell.navigate('explorer');
    }

    const name = path.split('/').pop();
    const icon = getIcon(name);

    // Atualiza header
    const nameEl = document.getElementById('file-viewer-name');
    const pathEl = document.getElementById('file-viewer-path');
    const iconEl = document.getElementById('file-viewer-icon');
    if (nameEl) nameEl.textContent = name;
    if (pathEl) pathEl.textContent = path;
    if (iconEl) iconEl.textContent = icon;

    // Mostra botões
    ['btn-copy-file','btn-download-file'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = '';
    });

    // Esconde empty, mostra code
    const empty = document.getElementById('file-viewer-empty');
    const code  = document.getElementById('code-display');
    if (empty) empty.style.display = 'none';
    if (code)  { code.style.display = 'block'; }

    // Highlight e exibe
    if (code) {
      code.innerHTML = highlight(content, name);
    }

    // Marca ativo na árvore
    document.querySelectorAll('.tree-item').forEach(el => {
      el.classList.remove('active');
    });
  }

  // ── Syntax Highlight básico ────────────────────────────────
  function highlight(code, filename) {
    const ext = filename.split('.').pop().toLowerCase();
    // Escapa HTML
    let h = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    if (['js','ts','jsx','tsx','mjs'].includes(ext)) {
      h = h
        .replace(/(\/\/.*$)/gm, '<span class="cmt">$1</span>')
        .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="cmt">$1</span>')
        .replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|default|async|await|new|this|typeof|instanceof|try|catch|finally|throw|switch|case|break|continue|of|in|true|false|null|undefined|void)\b/g, '<span class="kw">$1</span>')
        .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, '<span class="str">$1</span>')
        .replace(/\b(\d+\.?\d*)\b/g, '<span class="num">$1</span>');
    } else if (ext === 'json') {
      h = h
        .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span class="atr">$1</span>:')
        .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="str">$1</span>')
        .replace(/\b(true|false|null)\b/g, '<span class="kw">$1</span>')
        .replace(/\b(\d+\.?\d*)\b/g, '<span class="num">$1</span>');
    } else if (['html','htm','xml','svg'].includes(ext)) {
      h = h
        .replace(/(&lt;\/?)([\w-]+)/g, '<span class="tag">$1$2</span>')
        .replace(/([\w-]+)=/g, '<span class="atr">$1</span>=')
        .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="str">$1</span>')
        .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="cmt">$1</span>');
    } else if (['css','scss','sass'].includes(ext)) {
      h = h
        .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="cmt">$1</span>')
        .replace(/([\w-]+)\s*:/g, '<span class="atr">$1</span>:')
        .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span class="str">$1</span>')
        .replace(/#[0-9a-fA-F]{3,8}\b/g, m => `<span style="color:${m}">${m}</span>`);
    } else if (ext === 'py') {
      h = h
        .replace(/(#.*$)/gm, '<span class="cmt">$1</span>')
        .replace(/\b(def|class|import|from|return|if|elif|else|for|while|in|not|and|or|True|False|None|try|except|finally|with|as|pass|break|continue|lambda|yield|async|await)\b/g, '<span class="kw">$1</span>')
        .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span class="str">$1</span>');
    }

    return h;
  }

  // ── Copiar / Baixar arquivo atual ──────────────────────────
  function copyCurrentFile() {
    if (!currentContent) return;
    navigator.clipboard.writeText(currentContent)
      .then(() => Shell.toast('Copiado!', 'success'))
      .catch(() => Shell.toast('Erro ao copiar', 'error'));
  }

  function downloadCurrentFile() {
    if (!currentFile || !currentContent) return;
    const name = currentFile.split('/').pop();
    const blob = new Blob([currentContent], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
    Shell.toast(`Baixando ${name}`, 'info');
  }

  // ── Stats de importação ────────────────────────────────────
  function showImportStats(projectName) {
    const statsDiv = document.getElementById('import-stats');
    const statsGrid = document.getElementById('project-stats');
    if (!statsDiv || !statsGrid) return;

    const files = Object.keys(allFiles);
    const total = files.length;

    // Conta por tipo
    const types = {};
    for (const f of files) {
      const ext = f.split('.').pop().toLowerCase();
      types[ext] = (types[ext] || 0) + 1;
    }

    // Top 3 tipos
    const topTypes = Object.entries(types)
      .sort((a,b) => b[1]-a[1])
      .slice(0,3)
      .map(([ext, count]) => `${ext}(${count})`)
      .join(', ');

    // Conta package.json
    const pkgCount = files.filter(f => f.endsWith('package.json')).length;

    // Tamanho total
    let totalSize = 0;
    for (const content of Object.values(allFiles)) {
      totalSize += new Blob([content]).size;
    }

    statsGrid.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon">📄</div>
        <div class="stat-val">${total}</div>
        <div class="stat-label">Arquivos totais</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-val">${pkgCount}</div>
        <div class="stat-label">package.json encontrados</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💾</div>
        <div class="stat-val">${formatSize(totalSize)}</div>
        <div class="stat-label">Tamanho total</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🗂️</div>
        <div class="stat-val" style="font-size:14px">${topTypes || 'variado'}</div>
        <div class="stat-label">Tipos principais</div>
      </div>
    `;

    statsDiv.style.display = 'block';
  }

  // ── Limpar projeto ─────────────────────────────────────────
  function clearProject() {
    Shell.openModal('🗑️ Limpar Projeto', `
      <p style="color:var(--text-secondary); margin-bottom:16px;">
        Tem certeza que deseja remover o projeto atual da memória?
      </p>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-danger" onclick="Importer._confirmClear()">Sim, limpar</button>
        <button class="btn btn-secondary" onclick="Shell.closeModal()">Cancelar</button>
      </div>
    `);
  }

  function _confirmClear() {
    allFiles = {}; window.LabBin = {};
    fileTree = [];
    currentFile = null;
    currentContent = null;
    Shell.setState('projectName', null);
    Shell.setState('projectFiles', {});
    Shell.setState('projectTree', []);
    Shell.setState('dependencies', []);
    Shell.setState('routes', []);
    Shell.setState('bugs', []);
    document.getElementById('import-stats').style.display = 'none';
    document.getElementById('btn-clear-project').style.display = 'none';
    const log = document.getElementById('progress-log');
    if (log) log.innerHTML = '';
    renderFileTree({});
    Shell.closeModal();
    Shell.toast('Projeto removido', 'info');
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    initDropZone();

    // Escuta restauração de sessão
    window.addEventListener('shell:statechange', (e) => {
      if (e.detail.key === 'projectFiles') {
        allFiles = e.detail.value || {};
        fileTree = Shell.getState('projectTree') || {};
        if (Object.keys(allFiles).length > 0) {
          renderFileTree(fileTree);
          showImportStats(Shell.getState('projectName') || 'Projeto');
          document.getElementById('btn-clear-project').style.display = '';
          document.getElementById('import-stats').style.display = 'block';
        }
      }
    });
  }

  // ── API Pública ────────────────────────────────────────────
  return {
    init,
    openFolderPicker, openFilePicker,
    pasteJSON, processPastedJSON,
    openFile, filterTree,
    copyCurrentFile, downloadCurrentFile,
    clearProject, _confirmClear,
    getAllFiles: () => allFiles,
  };

})();

// Inicializa quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', Importer.init);
