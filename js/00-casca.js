
// ============================================================
//  SHELL PRINCIPAL — ProjetoLens
//  Estado global, navegação, abas, toast, modal, autosave
// ============================================================

const Shell = (() => {

  // ── Estado Global ──────────────────────────────────────────
  const state = {
    projectName:   null,
    projectFiles:  {},      // { "caminho/arquivo.js": "conteúdo" }
    projectTree:   [],      // árvore de arquivos
    dependencies:  [],      // deps encontradas
    routes:        [],      // rotas de API encontradas
    bugs:          [],      // bugs detectados
    plan:          null,    // plano gerado
    scripts:       null,    // scripts gerados
    activeModule:  'welcome',
    openTabs:      [{ id: 'welcome', label: '🏠 Início', icon: '🏠' }],
    activeTab:     'welcome',
    lastSaved:     null,
  };

  // ── AutoSave ───────────────────────────────────────────────
  let autoSaveTimer = null;

  function triggerAutoSave() {
    const ind = document.getElementById('autosave-indicator');
    const txt = document.getElementById('autosave-text');
    if (ind) { ind.className = 'saving'; txt.textContent = 'Salvando...'; }
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      try {
        const toSave = {
          projectName:  state.projectName,
          projectFiles: state.projectFiles,
          projectTree:  state.projectTree,
          dependencies: state.dependencies,
          routes:       state.routes,
          bugs:         state.bugs,
          plan:         state.plan,
          scripts:      state.scripts,
          savedAt:      new Date().toISOString(),
        };
        localStorage.setItem('projetolens_session', JSON.stringify(toSave));
        state.lastSaved = toSave.savedAt;
        if (ind) { ind.className = 'saved'; txt.textContent = 'Salvo ✓'; }
        setTimeout(() => {
          if (ind) { ind.className = ''; txt.textContent = 'Pronto'; }
        }, 2000);
      } catch(e) {
        if (ind) { ind.className = ''; txt.textContent = 'Erro ao salvar'; }
        console.warn('AutoSave erro:', e);
      }
    }, 800);
  }

  function restoreSession() {
    try {
      const raw = localStorage.getItem('projetolens_session');
      if (!raw) { toast('Nenhuma sessão encontrada', 'warning'); return; }
      const data = JSON.parse(raw);
      Object.assign(state, {
        projectName:  data.projectName,
        projectFiles: data.projectFiles || {},
        projectTree:  data.projectTree  || [],
        dependencies: data.dependencies || [],
        routes:       data.routes       || [],
        bugs:         data.bugs         || [],
        plan:         data.plan,
        scripts:      data.scripts,
      });
      updateStatusBar();
      updateBadges();
      updateSidebarInfo();
      toast(`Sessão restaurada: ${data.projectName || 'Projeto'}`, 'success');
      if (state.projectName) navigate('explorer');
    } catch(e) {
      toast('Erro ao restaurar sessão', 'error');
    }
  }

  // ── Navegação ──────────────────────────────────────────────
  function navigate(moduleId) {
    // Esconde todos os painéis
    document.querySelectorAll('.module-panel').forEach(p => p.classList.remove('active'));
    // Ativa o painel alvo
    const panel = document.getElementById(`panel-${moduleId}`);
    if (panel) panel.classList.add('active');

    // Atualiza nav items
    document.querySelectorAll('.nav-item').forEach(n => {
      n.classList.toggle('active', n.dataset.module === moduleId);
    });

    state.activeModule = moduleId;

    // Gerencia abas
    openTab(moduleId);

    // Atualiza statusbar
    const labels = {
      welcome:  '🏠 Início',
      importer: '📦 Importar',
      explorer: '📁 Explorador',
      deps:     '🧩 Dependências',
      analyzer: '🔍 Analisador',
      routes:   '🛣️ Rotas',
      cdn:      '🌐 CDN',
      mapa:     '🗺️ Mapa',
      previa:   '🧪 Prévia',
      comparar: '⚖️ Comparar',
      ferramentas: '🧰 Ferramentas',
      termux:   '📱 Termux',
      desmontar: '🔪 Desmontar',
      planner:  '📋 Plano',
      scripts:  '⚙️ Scripts',
      exporter: '💾 Exportar',
      terminal: '💻 Terminal',
    };
    const sb = document.getElementById('sb-module');
    if (sb) sb.textContent = labels[moduleId] || moduleId;

    // Dispara evento para módulos escutarem
    window.dispatchEvent(new CustomEvent('shell:navigate', { detail: { moduleId } }));
  }

  // ── Abas ───────────────────────────────────────────────────
  const tabLabels = {
    welcome:  '🏠 Início',
    importer: '📦 Importar',
    explorer: '📁 Explorador',
    deps:     '🧩 Deps',
    analyzer: '🔍 Analisar',
    routes:   '🛣️ Rotas',
    cdn:      '🌐 CDN',
      mapa:     '🗺️ Mapa',
      previa:   '🧪 Prévia',
      comparar: '⚖️ Comparar',
      ferramentas: '🧰 Ferramentas',
      termux:   '📱 Termux',
      desmontar: '🔪 Desmontar',
    planner:  '📋 Plano',
    scripts:  '⚙️ Scripts',
    exporter: '💾 Exportar',
    terminal: '💻 Terminal',
  };

  function openTab(id) {
    if (!state.openTabs.find(t => t.id === id)) {
      state.openTabs.push({ id, label: tabLabels[id] || id });
    }
    activateTab(id);
    renderTabs();
  }

  function activateTab(id) {
    state.activeTab = id;
    document.querySelectorAll('.module-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById(`panel-${id}`);
    if (panel) panel.classList.add('active');
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === id);
    });
    document.querySelectorAll('.nav-item').forEach(n => {
      n.classList.toggle('active', n.dataset.module === id);
    });
    state.activeModule = id;
  }

  function closeTab(id) {
    if (id === 'welcome') return; // welcome não fecha
    state.openTabs = state.openTabs.filter(t => t.id !== id);
    if (state.activeTab === id) {
      const last = state.openTabs[state.openTabs.length - 1];
      if (last) activateTab(last.id);
    }
    renderTabs();
  }

  function renderTabs() {
    const bar = document.getElementById('tabs-bar');
    if (!bar) return;
    bar.innerHTML = state.openTabs.map(t => `
      <div class="tab ${t.id === state.activeTab ? 'active' : ''}"
           data-tab="${t.id}"
           onclick="Shell.activateTab('${t.id}')">
        <span>${t.label}</span>
        ${t.id !== 'welcome' ? `<span class="tab-close" onclick="event.stopPropagation();Shell.closeTab('${t.id}')">✕</span>` : ''}
      </div>
    `).join('');
  }

  // ── Toast ──────────────────────────────────────────────────
  function toast(msg, type = 'info', duration = 3000) {
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
    container.appendChild(el);
    setTimeout(() => { el.remove(); }, duration);
  }

  // ── Modal ──────────────────────────────────────────────────
  function openModal(title, htmlContent) {
    document.getElementById('modal-title-text').textContent = title;
    document.getElementById('modal-body').innerHTML = htmlContent;
    document.getElementById('modal-overlay').classList.add('open');
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
  }

  // ── Status Bar ─────────────────────────────────────────────
  function updateStatusBar() {
    const fileCount = Object.keys(state.projectFiles).length;
    const depCount  = state.dependencies.length;
    const sbFiles   = document.getElementById('sb-files');
    const sbDeps    = document.getElementById('sb-deps');
    const sdot      = document.getElementById('status-dot');
    const stxt      = document.getElementById('status-text');
    if (sbFiles) sbFiles.textContent = `📄 ${fileCount} arquivos`;
    if (sbDeps)  sbDeps.textContent  = `🧩 ${depCount} deps`;
    if (state.projectName) {
      if (sdot) { sdot.className = 'status-dot green'; }
      if (stxt) stxt.textContent = state.projectName;
    }
  }

  function updateBadges() {
    const b = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (val > 0) { el.style.display = ''; el.textContent = val; }
      else el.style.display = 'none';
    };
    b('badge-explorer', Object.keys(state.projectFiles).length);
    b('badge-deps',     state.dependencies.length);
    b('badge-bugs',     state.bugs.length);
    b('badge-routes',   state.routes.length);
  }

  function updateSidebarInfo() {
    const name = document.getElementById('sidebar-project-name');
    const info = document.getElementById('sidebar-project-info');
    if (name) name.textContent = state.projectName || 'Sem projeto';
    if (info) {
      const fc = Object.keys(state.projectFiles).length;
      info.textContent = fc > 0 ? `${fc} arquivos carregados` : 'Importe um projeto';
    }
  }

  // ── Relógio na statusbar ───────────────────────────────────
  function startClock() {
    const el = document.getElementById('sb-time');
    if (!el) return;
    const tick = () => {
      const now = new Date();
      el.textContent = now.toLocaleTimeString('pt-BR');
    };
    tick();
    setInterval(tick, 1000);
  }

  // ── Verificar sessão anterior ──────────────────────────────
  function checkPreviousSession() {
    const raw = localStorage.getItem('projetolens_session');
    if (raw) {
      const wr = document.getElementById('welcome-restore');
      if (wr) wr.style.display = 'block';
    }
  }

  // ── Atualizar estado (chamado pelos módulos) ───────────────
  function setState(key, value) {
    state[key] = value;
    updateStatusBar();
    updateBadges();
    updateSidebarInfo();
    triggerAutoSave();
    window.dispatchEvent(new CustomEvent('shell:statechange', { detail: { key, value } }));
  }

  function getState(key) {
    return key ? state[key] : { ...state };
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    startClock();
    checkPreviousSession();
    renderTabs();

    // Fechar modal ao clicar fora
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') closeModal();
    });

    // Atalhos de teclado
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); triggerAutoSave(); toast('Salvo!', 'success'); }
      if (e.key === 'Escape') closeModal();
    });

    console.log('%c🔬 ProjetoLens Shell iniciado', 'color:#1f6feb;font-weight:bold;font-size:14px');
  }

  // ── API Pública ────────────────────────────────────────────
  return {
    navigate, activateTab, openTab, closeTab, renderTabs,
    toast, openModal, closeModal,
    setState, getState,
    restoreSession, triggerAutoSave,
    updateStatusBar, updateBadges, updateSidebarInfo,
    state,
    init,
  };

})();

// Inicializa quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', Shell.init);
