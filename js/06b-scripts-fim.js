
// ============================================================
//  MÓDULO 6 — CONCLUSÃO: highlight + download + init
// ============================================================

// Adiciona ao ScriptGen já existente via patch
(function patchScriptGen() {

  // ── Highlight de sintaxe ─────────────────────────────────
  function highlightScript(code, type) {
    let h = code
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');

    if (type === 'bat') {
      h = h
        .replace(/(::.*$)/gm,
          '<span class="sc-comment">$1</span>')
        .replace(/^(@echo|echo|pause|exit|cd|mkdir|copy|del|set|if|goto|call)\b/gim,
          '<span class="sc-keyword">$1</span>')
        .replace(/(npm|yarn|pnpm|bun|git|node)\s/g,
          '<span class="sc-cmd">$1</span> ')
        .replace(/%[^%]+%/g,
          '<span class="sc-var">$&</span>');
    }

    if (type === 'sh') {
      h = h
        .replace(/(#.*$)/gm,
          '<span class="sc-comment">$1</span>')
        .replace(/^(echo|mkdir|cd|cp|rm|touch|chmod|set|export|if|then|fi|else|done|for)\b/gim,
          '<span class="sc-keyword">$1</span>')
        .replace(/(npm|yarn|pnpm|bun|git|node)\s/g,
          '<span class="sc-cmd">$1</span> ')
        .replace(/\$\{?[\w]+\}?/g,
          '<span class="sc-var">$&</span>')
        .replace(/'[^']*'/g,
          '<span class="sc-string">$&</span>');
    }

    if (type === 'ps1') {
      h = h
        .replace(/(#.*$)/gm,
          '<span class="sc-comment">$1</span>')
        .replace(/\$([\w]+)/g,
          '<span class="sc-var">$$1</span>')
        .replace(/(Write-Host|New-Item|Set-Location|exit|if|try|catch)\b/g,
          '<span class="sc-keyword">$1</span>')
        .replace(/"[^"]*"/g,
          '<span class="sc-string">$&</span>');
    }

    if (type === 'makefile') {
      h = h
        .replace(/(#.*$)/gm,
          '<span class="sc-comment">$1</span>')
        .replace(/^([\w-]+):/gm,
          '<span class="sc-echo">$1</span>:')
        .replace(/\$\([^)]+\)/g,
          '<span class="sc-var">$&</span>');
    }

    return h;
  }

  // ── Copiar script ────────────────────────────────────────
  function copyScript(type) {
    const content = ScriptGen._getScript(type);
    if (!content) {
      Shell.toast('Gere os scripts primeiro', 'warning');
      return;
    }
    navigator.clipboard.writeText(content)
      .then(() => Shell.toast(`Script ${type.toUpperCase()} copiado!`, 'success'))
      .catch(() => Shell.toast('Erro ao copiar', 'error'));
  }

  // ── Downloads individuais ────────────────────────────────
  function downloadBAT() {
    const c = ScriptGen._getScript('bat');
    if (!c) { Shell.toast('Gere os scripts primeiro','warning'); return; }
    _dl('setup.bat', c, 'text/plain');
    Shell.toast('setup.bat baixado!', 'success');
  }

  function downloadSH() {
    const c = ScriptGen._getScript('sh');
    if (!c) { Shell.toast('Gere os scripts primeiro','warning'); return; }
    _dl('setup.sh', c, 'text/plain');
    Shell.toast('setup.sh baixado!', 'success');
  }

  function downloadPS1() {
    const c = ScriptGen._getScript('ps1');
    if (!c) { Shell.toast('Gere os scripts primeiro','warning'); return; }
    _dl('setup.ps1', c, 'text/plain');
    Shell.toast('setup.ps1 baixado!', 'success');
  }

  function downloadMakefile() {
    const c = ScriptGen._getScript('makefile');
    if (!c) { Shell.toast('Gere os scripts primeiro','warning'); return; }
    _dl('Makefile', c, 'text/plain');
    Shell.toast('Makefile baixado!', 'success');
  }

  // ── Baixar todos em sequência ────────────────────────────
  function downloadAll() {
    const s = ScriptGen._getAllScripts();
    if (!s.bat) { Shell.toast('Gere os scripts primeiro','warning'); return; }
    setTimeout(() => _dl('setup.bat',     s.bat,      'text/plain'), 0);
    setTimeout(() => _dl('setup.sh',      s.sh,       'text/plain'), 300);
    setTimeout(() => _dl('setup.ps1',     s.ps1,      'text/plain'), 600);
    setTimeout(() => _dl('Makefile',      s.makefile, 'text/plain'), 900);
    Shell.toast('4 scripts baixados!', 'success');
  }

  // ── Helper download ──────────────────────────────────────
  function _dl(filename, content, type) {
    const blob = new Blob([content], { type });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Expõe funções no objeto ScriptGen ───────────────────
  // (o objeto foi criado na parte anterior como IIFE,
  //  aqui adicionamos os métodos que faltaram)
  Object.assign(ScriptGen, {
    copyScript,
    downloadBAT,
    downloadSH,
    downloadPS1,
    downloadMakefile,
    downloadAll,
    _highlightScript: highlightScript,
  });

})();

// ── Init: restaura scripts salvos ao navegar ──────────────
window.addEventListener('shell:navigate', function(e) {
  if (e.detail.moduleId !== 'scripts') return;
  const saved = Shell.getState('scripts');
  if (!saved || !saved.bat) return;

  // Só renderiza se ainda não foi renderizado
  const batEl = document.getElementById('bat-code');
  if (batEl && !batEl.innerHTML) {
    ['bat','sh','ps1','makefile'].forEach(type => {
      const el    = document.getElementById(`${type}-code`);
      const stats = document.getElementById(`${type}-stats`);
      if (!el) return;
      const content = saved[type] || '';
      el.innerHTML  = ScriptGen._highlightScript(content, type);
      if (stats) {
        const lines = content.split('\n').length;
        const size  = new Blob([content]).size;
        const sz    = size < 1024 ? `${size}B` : `${(size/1024).toFixed(1)}KB`;
        stats.innerHTML = `
          <span>📄 ${lines} linhas</span>
          <span>💾 ${sz}</span>
          <span>🔧 ${type.toUpperCase()}</span>`;
      }
    });
    document.getElementById('scripts-empty').style.display   = 'none';
    document.getElementById('scripts-content').style.display = 'block';
    document.getElementById('btn-scripts-dl').style.display  = '';
  }
});

// ── Expõe _getScript e _getAllScripts no ScriptGen ────────
// (precisam acessar a variável `scripts` do closure original)
// Como o IIFE original não expôs, adicionamos um wrapper seguro:
if (typeof ScriptGen !== 'undefined' && !ScriptGen._getScript) {
  // Fallback: lê do estado global
  ScriptGen._getScript = function(type) {
    const s = Shell.getState('scripts') || {};
    return s[type] || '';
  };
  ScriptGen._getAllScripts = function() {
    return Shell.getState('scripts') || {};
  };
}
