
// ============================================================
//  MÓDULO 9 — INTEGRAÇÃO FINAL
//  Liga todos os módulos, atalhos, status bar, fluxo guiado
// ============================================================
const Integration = (() => {

  // ── Estado do fluxo ────────────────────────────────────────
  const flowSteps = [
    { id:'importer',  icon:'📦', title:'Importar',   done:false },
    { id:'deps',      icon:'🧩', title:'Deps',        done:false },
    { id:'analyzer',  icon:'🔍', title:'Analisar',    done:false },
    { id:'planner',   icon:'📋', title:'Plano',       done:false },
    { id:'scripts',   icon:'⚙️', title:'Scripts',     done:false },
    { id:'exporter',  icon:'💾', title:'Exportar',    done:false },
  ];

  // ── Inicialização principal ────────────────────────────────
  function init() {
    // Remove loader após 1.4s
    setTimeout(() => {
      const loader = document.getElementById('app-loader');
      if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 400);
      }
    }, 1400);

    // Inicia relógio da status bar
    updateClock();
    setInterval(updateClock, 1000);

    // Atualiza status bar
    updateStatusBar();

    // Atalhos de teclado globais
    setupKeyboardShortcuts();

    // Drag-and-drop global
    setupGlobalDrop();

    // Observa mudanças de estado
    setupStateWatcher();

    // Atualiza welcome flow
    updateWelcomeFlow();

    // Patch do Shell.toast para usar novo sistema
    patchShellToast();

    // Patch do Shell.updateBadges
    patchShellBadges();

    // Patch do Shell.navigate para atualizar flow
    patchShellNavigate();

    // Restaura sessão do localStorage se existir
    restoreLocalSession();

    console.log('✅ ProjetoLens — todos os módulos carregados!');
  }

  // ── Relógio ────────────────────────────────────────────────
  function updateClock() {
    const el = document.getElementById('sb-time');
    if (el) el.textContent = new Date().toLocaleTimeString('pt-BR');
  }

  // ── Status bar ─────────────────────────────────────────────
  function updateStatusBar() {
    const files  = Shell.getState('projectFiles')  || {};
    const deps   = Shell.getState('dependencies')  || [];
    const bugs   = Shell.getState('bugs')          || [];
    const name   = Shell.getState('projectName')   || 'Nenhum projeto';

    const fileCount = Object.keys(files).filter(p=>!p.includes('node_modules')).length;
    const errCount  = bugs.filter(b=>b.type==='error').length;

    setText('sb-project', name);
    setText('sb-files',   `${fileCount} arquivo${fileCount!==1?'s':''}`);
    setText('sb-deps',    `${deps.length} dep${deps.length!==1?'s':''}`);
    setText('sb-bugs',    `${bugs.length} bug${bugs.length!==1?'s':''}`);

    const dot = document.getElementById('sb-dot');
    if (dot) {
      dot.style.background = fileCount > 0
        ? (errCount > 0 ? '#f85149' : '#3fb950')
        : '#484f58';
    }
  }

  // ── Atalhos de teclado ─────────────────────────────────────
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ignora quando está digitando em inputs
      const tag = document.activeElement?.tagName;
      if (['INPUT','TEXTAREA','SELECT'].includes(tag)) return;

      // Ctrl/Cmd + número = navegar módulo
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
          e.preventDefault();
          const modules = [
            'home','importer','deps','analyzer',
            'routes','planner','scripts','terminal','exporter'
          ];
          if (modules[num-1]) Shell.navigate(modules[num-1]);
          return;
        }

        switch(e.key.toLowerCase()) {
          case 'i': e.preventDefault(); Shell.navigate('importer');  break;
          case 'a': e.preventDefault(); Shell.navigate('analyzer');  break;
          case 'p': e.preventDefault(); Shell.navigate('planner');   break;
          case 't': e.preventDefault(); Shell.navigate('terminal');  break;
          case 'e': e.preventDefault(); Shell.navigate('exporter');  break;
          case 's': e.preventDefault(); Exporter?.exportSession?.(); break;
          case 'k': e.preventDefault(); showCommandPalette();        break;
        }
      }

      // F5 = analisar
      if (e.key === 'F5') {
        e.preventDefault();
        CodeAnalyzer?.analyze?.();
      }

      // Escape = fechar modais
      if (e.key === 'Escape') {
        closeCommandPalette();
        closeModal();
      }
    });
  }

  // ── Drag-and-drop global ───────────────────────────────────
  function setupGlobalDrop() {
    let dragCounter = 0;

    document.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      if (dragCounter === 1) showDropOverlay();
    });

    document.addEventListener('dragleave', (e) => {
      dragCounter--;
      if (dragCounter === 0) hideDropOverlay();
    });

    document.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    document.addEventListener('drop', (e) => {
      e.preventDefault();
      dragCounter = 0;
      hideDropOverlay();

      const files = [...(e.dataTransfer.files || [])];
      if (!files.length) return;

      // Redireciona para o Importer
      Shell.navigate('importer');
      setTimeout(() => {
        if (typeof Importer !== 'undefined' && Importer.handleDroppedFiles) {
          Importer.handleDroppedFiles(files);
        } else {
          Shell.toast('Arraste para a área de importação', 'info');
        }
      }, 200);
    });
  }

  function showDropOverlay() {
    let overlay = document.getElementById('drop-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'drop-overlay';
      overlay.style.cssText = `
        position:fixed; inset:0; z-index:9998;
        background:rgba(31,111,235,0.15);
        border:3px dashed var(--accent);
        display:flex; align-items:center; justify-content:center;
        pointer-events:none;
        backdrop-filter:blur(4px);
      `;
      overlay.innerHTML = `
        <div style="text-align:center; color:var(--accent);">
          <div style="font-size:64px; margin-bottom:12px;">📦</div>
          <div style="font-size:20px; font-weight:700;">Solte para importar</div>
          <div style="font-size:14px; opacity:0.7; margin-top:6px;">ZIP, pasta ou arquivo</div>
        </div>`;
      document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
  }

  function hideDropOverlay() {
    const overlay = document.getElementById('drop-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  // ── Observador de estado ───────────────────────────────────
  function setupStateWatcher() {
    // Sobrescreve Shell.setState para reagir a mudanças
    const originalSet = Shell.setState.bind(Shell);
    Shell.setState = function(key, value) {
      originalSet(key, value);
      onStateChange(key, value);
    };
  }

  function onStateChange(key, value) {
    updateStatusBar();

    // Marca etapas do fluxo como concluídas
    if (key === 'projectFiles' && Object.keys(value||{}).length > 0) {
      markFlowDone('importer');
      // Auto-salva no localStorage (sem os arquivos grandes)
      autoSaveSession();
    }
    if (key === 'dependencies' && (value||[]).length > 0) {
      markFlowDone('deps');
    }
    if (key === 'bugs' && (value||[]).length >= 0) {
      markFlowDone('analyzer');
      updateBugBadge(value||[]);
    }
    if (key === 'plan' && value) {
      markFlowDone('planner');
    }
    if (key === 'scripts' && value?.bat) {
      markFlowDone('scripts');
    }

    updateWelcomeFlow();
  }

  function markFlowDone(stepId) {
    const step = flowSteps.find(s => s.id === stepId);
    if (step) step.done = true;
  }

  // ── Atualizar welcome flow ─────────────────────────────────
  function updateWelcomeFlow() {
    const container = document.getElementById('welcome-flow-container');
    if (!container) return;

    const currentModule = Shell.getCurrentModule?.() || 'home';

    container.innerHTML = flowSteps.map((step, i) => {
      const isActive = step.id === currentModule;
      const cls = step.done ? 'done' : isActive ? 'active' : '';
      return `
        <div class="flow-step ${cls}" onclick="Shell.navigate('${step.id}')">
          ${step.done ? '<div class="flow-step-badge">✓</div>' : ''}
          <div class="flow-step-num">${i+1}</div>
          <div class="flow-step-icon">${step.icon}</div>
          <div class="flow-step-title">${step.title}</div>
        </div>`;
    }).join('');
  }

  // ── Badges de bugs na navegação ────────────────────────────
  function updateBugBadge(bugs) {
    const errCount = (bugs||[]).filter(b=>b.type==='error').length;
    const badge    = document.getElementById('nav-bug-badge');
    if (!badge) return;
    badge.textContent = errCount;
    badge.style.display = errCount > 0 ? 'inline-flex' : 'none';
  }

  // ── Patch Shell.toast ──────────────────────────────────────
  function patchShellToast() {
    Shell.toast = function(msg, type, duration) {
      showToast(msg, type || 'info', duration || 3500);
    };
  }

  function showToast(msg, type, duration) {
    const stack = document.getElementById('toast-stack');
    if (!stack) return;

    const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
    const id    = `toast-${Date.now()}`;

    const toast = document.createElement('div');
    toast.id    = id;
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type]||'ℹ️'}</span>
      <span class="toast-msg">${msg}</span>
      <span class="toast-close" onclick="Integration.closeToast('${id}')">×</span>`;

    stack.appendChild(toast);

    // Remove automaticamente
    setTimeout(() => closeToast(id), duration);

    // Limita a 5 toasts
    const toasts = stack.querySelectorAll('.toast');
    if (toasts.length > 5) toasts[0].remove();
  }

  function closeToast(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('out');
    setTimeout(() => el.remove(), 200);
  }

  // ── Patch Shell.updateBadges ───────────────────────────────
  function patchShellBadges() {
    Shell.updateBadges = function() {
      const bugs = Shell.getState('bugs') || [];
      updateBugBadge(bugs);
      updateStatusBar();
    };
  }

  // ── Patch Shell.navigate ───────────────────────────────────
  function patchShellNavigate() {
    const originalNav = Shell.navigate.bind(Shell);
    Shell.navigate = function(moduleId) {
      originalNav(moduleId);
      updateWelcomeFlow();
      updateStatusBar();
    };
  }

  // ── Command Palette (Ctrl+K) ───────────────────────────────
  function showCommandPalette() {
    let palette = document.getElementById('cmd-palette');
    if (palette) { palette.style.display = 'flex'; focusPalette(); return; }

    palette = document.createElement('div');
    palette.id = 'cmd-palette';
    palette.style.cssText = `
      position:fixed; inset:0; z-index:9997;
      background:rgba(0,0,0,0.7); backdrop-filter:blur(6px);
      display:flex; align-items:flex-start; justify-content:center;
      padding-top:15vh;
    `;

    const commands = [
      { icon:'📦', label:'Importar Projeto',      action:()=>Shell.navigate('importer'),  key:'Ctrl+I' },
      { icon:'🧩', label:'Ver Dependências',       action:()=>Shell.navigate('deps'),      key:'Ctrl+2' },
      { icon:'🔍', label:'Analisar Código',        action:()=>CodeAnalyzer?.analyze?.(),   key:'F5' },
      { icon:'📋', label:'Gerar Plano',            action:()=>Planner?.generate?.(),       key:'Ctrl+P' },
      { icon:'⚙️', label:'Gerar Scripts',          action:()=>ScriptGen?.generate?.(),     key:'Ctrl+6' },
      { icon:'💻', label:'Abrir Terminal',         action:()=>Shell.navigate('terminal'),  key:'Ctrl+T' },
      { icon:'💾', label:'Exportar Sessão',        action:()=>Exporter?.exportSession?.(), key:'Ctrl+S' },
      { icon:'🤖', label:'Gerar Contexto para IA', action:()=>Exporter?.exportForAI?.(),  key:'' },
      { icon:'📦', label:'Exportar ZIP',           action:()=>Exporter?.exportZIP?.(),    key:'' },
      { icon:'🗑️', label:'Limpar Terminal',        action:()=>Terminal?.clear?.(),         key:'' },
      { icon:'🌙', label:'Alternar Tema',          action:()=>Shell.toggleTheme?.(),       key:'' },
    ];

    palette.innerHTML = `
      <div style="
        background:var(--bg-card); border:1px solid var(--border);
        border-radius:var(--radius-lg); width:100%; max-width:520px;
        overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.5);
      ">
        <div style="display:flex; align-items:center; gap:10px; padding:12px 16px; border-bottom:1px solid var(--border);">
          <span style="color:var(--text-muted);">🔍</span>
          <input id="palette-input" type="text" placeholder="Digite um comando..."
            style="flex:1; background:none; border:none; outline:none; color:var(--text-primary); font-size:14px; font-family:var(--font-main);"
            oninput="Integration.filterPalette(this.value)"
            onkeydown="Integration.handlePaletteKey(event)">
          <span class="kbd">Esc</span>
        </div>
        <div id="palette-list" style="max-height:320px; overflow-y:auto;">
          ${commands.map((c,i) => `
            <div class="palette-item" data-idx="${i}"
                 style="display:flex; align-items:center; gap:10px; padding:10px 16px;
                        cursor:pointer; transition:background var(--transition);"
                 onmouseenter="this.classList.add('palette-active')"
                 onmouseleave="this.classList.remove('palette-active')"
                 onclick="Integration.runPaletteCmd(${i})">
              <span style="font-size:18px;">${c.icon}</span>
              <span style="flex:1; font-size:13px; color:var(--text-primary);">${c.label}</span>
              ${c.key ? `<span class="kbd">${c.key}</span>` : ''}
            </div>`).join('')}
        </div>
        <div style="padding:8px 16px; border-top:1px solid var(--border); font-size:11px; color:var(--text-muted); display:flex; gap:12px;">
          <span><span class="kbd">↑↓</span> navegar</span>
          <span><span class="kbd">Enter</span> executar</span>
          <span><span class="kbd">Esc</span> fechar</span>
        </div>
      </div>`;

    // Fecha ao clicar fora
    palette.addEventListener('click', (e) => {
      if (e.target === palette) closeCommandPalette();
    });

    document.body.appendChild(palette);

    // Armazena comandos para uso posterior
    palette._commands = commands;

    focusPalette();
  }

  function focusPalette() {
    setTimeout(() => document.getElementById('palette-input')?.focus(), 50);
  }

  function closeCommandPalette() {
    const p = document.getElementById('cmd-palette');
    if (p) p.style.display = 'none';
  }

  let paletteIdx = 0;

  function handlePaletteKey(e) {
    const items = document.querySelectorAll('.palette-item:not([style*="display:none"])');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      paletteIdx = Math.min(paletteIdx+1, items.length-1);
      highlightPaletteItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      paletteIdx = Math.max(paletteIdx-1, 0);
      highlightPaletteItem(items);
    } else if (e.key === 'Enter') {
      const active = document.querySelector('.palette-item.palette-active');
      if (active) active.click();
      else if (items[0]) items[0].click();
    } else if (e.key === 'Escape') {
      closeCommandPalette();
    }
  }

  function highlightPaletteItem(items) {
    items.forEach((item, i) => {
      item.classList.toggle('palette-active', i === paletteIdx);
      if (i === paletteIdx) item.scrollIntoView({ block:'nearest' });
    });
  }

  function filterPalette(query) {
    const items = document.querySelectorAll('.palette-item');
    const q     = query.toLowerCase();
    items.forEach(item => {
      const label = item.querySelector('span:nth-child(2)')?.textContent.toLowerCase() || '';
      item.style.display = label.includes(q) ? 'flex' : 'none';
    });
    paletteIdx = 0;
  }

  function runPaletteCmd(idx) {
    const palette = document.getElementById('cmd-palette');
    if (!palette?._commands?.[idx]) return;
    closeCommandPalette();
    setTimeout(() => palette._commands[idx].action(), 100);
  }

  // ── Modal genérico ─────────────────────────────────────────
  function closeModal() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(m => m.remove());
  }

  // ── Auto-save no localStorage ──────────────────────────────
  function autoSaveSession() {
    try {
      const session = {
        projectName:  Shell.getState('projectName'),
        dependencies: Shell.getState('dependencies') || [],
        routes:       Shell.getState('routes')       || [],
        bugs:         Shell.getState('bugs')         || [],
        plan:         Shell.getState('plan')         || '',
        scripts:      Shell.getState('scripts')      || {},
        savedAt:      Date.now(),
      };
      // Não salva os arquivos (podem ser muito grandes)
      localStorage.setItem('projetolens_session', JSON.stringify(session));
    } catch(e) {
      // localStorage cheio ou indisponível — ignora silenciosamente
    }
  }

  function restoreLocalSession() {
    try {
      const raw = localStorage.getItem('projetolens_session');
      if (!raw) return;

      const session = JSON.parse(raw);
      const age     = Date.now() - (session.savedAt || 0);

      // Só restaura se for de menos de 24h
      if (age > 24 * 60 * 60 * 1000) return;

      if (session.projectName) {
        Shell.setState('projectName',  session.projectName);
        Shell.setState('dependencies', session.dependencies || []);
        Shell.setState('routes',       session.routes       || []);
        Shell.setState('bugs',         session.bugs         || []);
        Shell.setState('plan',         session.plan         || '');
        Shell.setState('scripts',      session.scripts      || {});

        const mins = Math.round(age / 60000);
        Shell.toast(
          `📂 Sessão restaurada: "${session.projectName}" (${mins}min atrás)`,
          'info', 4000
        );

        updateStatusBar();
        updateWelcomeFlow();
      }
    } catch(e) {
      // Sessão corrompida — ignora
      localStorage.removeItem('projetolens_session');
    }
  }

  // ── Helpers ────────────────────────────────────────────────
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // ── Atualiza painel home com flow ──────────────────────────
  function injectWelcomeFlow() {
    const homePanel = document.getElementById('panel-home');
    if (!homePanel) return;

    // Injeta container do flow se não existir
    if (!document.getElementById('welcome-flow-container')) {
      const div = document.createElement('div');
      div.id    = 'welcome-flow-container';
      div.className = 'welcome-flow';
      div.style.marginTop = '20px';

      // Insere após o primeiro card do home
      const firstCard = homePanel.querySelector('.card');
      if (firstCard) firstCard.after(div);
      else homePanel.querySelector('div')?.appendChild(div);
    }

    updateWelcomeFlow();
  }

  // ── Estilo hover da palette ────────────────────────────────
  function injectPaletteStyle() {
    const style = document.createElement('style');
    style.textContent = `
      .palette-item:hover,
      .palette-item.palette-active {
        background: var(--bg-hover) !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ── Expõe Shell.getCurrentModule se não existir ────────────
  function patchShellGetModule() {
    if (!Shell.getCurrentModule) {
      Shell.getCurrentModule = () => Shell.getState('currentModule') || 'home';
    }
  }

  // ── Atalhos visíveis no painel home ───────────────────────
  function injectShortcutsPanel() {
    const homePanel = document.getElementById('panel-home');
    if (!homePanel) return;
    if (document.getElementById('shortcuts-panel')) return;

    const div = document.createElement('div');
    div.id    = 'shortcuts-panel';
    div.className = 'card';
    div.style.marginTop = '16px';
    div.innerHTML = `
      <div class="card-title">⌨️ Atalhos de Teclado</div>
      <div class="help-grid">
        <div class="help-card">
          <div class="help-card-title">🧭 Navegação</div>
          <div class="help-card-list">
            <div class="help-item"><span class="help-item-key">Ctrl+1</span> Home</div>
            <div class="help-item"><span class="help-item-key">Ctrl+2</span> Importar</div>
            <div class="help-item"><span class="help-item-key">Ctrl+3</span> Dependências</div>
            <div class="help-item"><span class="help-item-key">Ctrl+4</span> Analisador</div>
            <div class="help-item"><span class="help-item-key">Ctrl+5</span> Rotas</div>
            <div class="help-item"><span class="help-item-key">Ctrl+6</span> Plano</div>
            <div class="help-item"><span class="help-item-key">Ctrl+7</span> Scripts</div>
            <div class="help-item"><span class="help-item-key">Ctrl+8</span> Terminal</div>
            <div class="help-item"><span class="help-item-key">Ctrl+9</span> Exportar</div>
          </div>
        </div>
        <div class="help-card">
          <div class="help-card-title">⚡ Ações Rápidas</div>
          <div class="help-card-list">
            <div class="help-item"><span class="help-item-key">Ctrl+K</span> Command Palette</div>
            <div class="help-item"><span class="help-item-key">Ctrl+I</span> Importar projeto</div>
            <div class="help-item"><span class="help-item-key">Ctrl+A</span> Analisar código</div>
            <div class="help-item"><span class="help-item-key">Ctrl+P</span> Gerar plano</div>
            <div class="help-item"><span class="help-item-key">Ctrl+T</span> Terminal</div>
            <div class="help-item"><span class="help-item-key">Ctrl+S</span> Salvar sessão</div>
            <div class="help-item"><span class="help-item-key">Ctrl+E</span> Exportar</div>
            <div class="help-item"><span class="help-item-key">F5</span> Analisar código</div>
            <div class="help-item"><span class="help-item-key">Esc</span> Fechar modal</div>
          </div>
        </div>
        <div class="help-card">
          <div class="help-card-title">📁 Importação</div>
          <div class="help-card-list">
            <div class="help-item"><span class="help-item-key">Drag & Drop</span> Qualquer área</div>
            <div class="help-item"><span class="help-item-key">ZIP</span> Projeto comprimido</div>
            <div class="help-item"><span class="help-item-key">JSON</span> Sessão salva</div>
            <div class="help-item"><span class="help-item-key">Pasta</span> Estrutura completa</div>
          </div>
        </div>
      </div>`;

    homePanel.appendChild(div);
  }

  // ── Inicialização completa ─────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    init();
    patchShellGetModule();
    injectPaletteStyle();

    // Injeta elementos no home após DOM pronto
    setTimeout(() => {
      injectWelcomeFlow();
      injectShortcutsPanel();
      updateWelcomeFlow();
    }, 100);

    // Atualiza status bar a cada 5s
    setInterval(updateStatusBar, 5000);
  });

  return {
    closeToast,
    closeCommandPalette,
    filterPalette,
    handlePaletteKey,
    runPaletteCmd,
    updateStatusBar,
    updateWelcomeFlow,
    showToast,
  };

})();
