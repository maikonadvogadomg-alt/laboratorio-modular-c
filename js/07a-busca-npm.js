
// ============================================================
//  BUSCADOR NPM — usa API pública do registry.npmjs.org
// ============================================================
const NpmSearch = (() => {

  let lastResults = [];
  let searchTimer = null;

  async function search() {
    const input = document.getElementById('npm-search-input');
    const query = input?.value?.trim();
    if (!query) return;

    const resultsEl = document.getElementById('npm-results');
    if (!resultsEl) return;

    resultsEl.innerHTML = `
      <div style="padding:16px; text-align:center; color:var(--text-muted); font-size:12px;">
        <div class="dep-spinner" style="margin:0 auto 8px;"></div>
        Buscando "${query}"...
      </div>`;

    try {
      // API pública do NPM — sem necessidade de chave
      const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=8`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Erro na API do NPM');
      const data = await res.json();
      lastResults = data.objects || [];
      renderResults(lastResults, query);
    } catch(err) {
      // Fallback: busca offline com deps já carregadas
      const deps = Shell.getState('dependencies') || [];
      const filtered = deps.filter(d =>
        d.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8);

      if (filtered.length > 0) {
        lastResults = filtered.map(d => ({
          package: {
            name: d.name,
            version: d.version,
            description: d.description || 'Dependência do projeto',
            links: { npm: `https://www.npmjs.com/package/${d.name}` },
          },
          score: { final: 1 },
        }));
        renderResults(lastResults, query);
        Terminal.writeLine(`⚠️ Busca offline — mostrando deps do projeto`, 'warn');
      } else {
        resultsEl.innerHTML = `
          <div style="padding:16px; text-align:center; color:var(--accent-red); font-size:12px;">
            ❌ Erro ao buscar. Verifique sua conexão.<br>
            <span style="color:var(--text-muted)">${err.message}</span>
          </div>`;
      }
    }
  }

  function renderResults(results, query) {
    const resultsEl = document.getElementById('npm-results');
    if (!resultsEl) return;

    if (!results.length) {
      resultsEl.innerHTML = `
        <div style="padding:16px; text-align:center; color:var(--text-muted); font-size:12px;">
          Nenhum pacote encontrado para "${query}"
        </div>`;
      return;
    }

    resultsEl.innerHTML = results.map((r, i) => {
      const pkg     = r.package || r;
      const name    = pkg.name    || '';
      const version = pkg.version || 'latest';
      const desc    = pkg.description || 'Sem descrição';
      const weekly  = r.downloads?.weekly
        ? `${(r.downloads.weekly/1000).toFixed(0)}k/sem`
        : '';
      const score   = r.score?.final
        ? `⭐ ${(r.score.final * 100).toFixed(0)}%`
        : '';

      // Traduz descrição comum para PT-BR
      const descPT = translateDesc(desc);

      return `
        <div class="npm-result">
          <div class="npm-result-name">📦 ${name}
            <span style="font-size:10px; color:var(--text-muted); font-weight:400;"> v${version}</span>
          </div>
          <div class="npm-result-desc">${descPT}</div>
          <div class="npm-result-meta">
            ${weekly ? `<span>⬇️ ${weekly}</span>` : ''}
            ${score  ? `<span>${score}</span>`      : ''}
          </div>
          <div class="npm-result-actions">
            <button class="btn btn-primary" style="font-size:10px; padding:2px 8px;"
                    onclick="NpmSearch.install('${name}','prod')">
              + Produção
            </button>
            <button class="btn btn-secondary" style="font-size:10px; padding:2px 8px;"
                    onclick="NpmSearch.install('${name}','dev')">
              + Dev
            </button>
            <button class="btn btn-secondary" style="font-size:10px; padding:2px 8px;"
                    onclick="window.open('https://www.npmjs.com/package/${name}','_blank')">
              🔗
            </button>
          </div>
        </div>`;
    }).join('');
  }

  // Tradução simples de termos comuns de descrições NPM
  function translateDesc(desc) {
    if (!desc) return 'Sem descrição';
    return desc
      .replace(/fast/gi,        'rápido')
      .replace(/lightweight/gi, 'leve')
      .replace(/simple/gi,      'simples')
      .replace(/powerful/gi,    'poderoso')
      .replace(/flexible/gi,    'flexível')
      .replace(/middleware/gi,  'middleware')
      .replace(/framework/gi,   'framework')
      .replace(/library/gi,     'biblioteca')
      .replace(/utility/gi,     'utilitário')
      .replace(/helper/gi,      'auxiliar')
      .replace(/parser/gi,      'parser')
      .replace(/validator/gi,   'validador')
      .replace(/router/gi,      'roteador')
      .replace(/server/gi,      'servidor')
      .replace(/client/gi,      'cliente')
      .replace(/database/gi,    'banco de dados')
      .replace(/authentication/gi, 'autenticação')
      .replace(/authorization/gi,  'autorização')
      .replace(/encryption/gi,     'criptografia')
      .replace(/testing/gi,        'testes')
      .replace(/logging/gi,        'logs')
      .replace(/bundler/gi,        'empacotador')
      .replace(/compiler/gi,       'compilador')
      .replace(/generator/gi,      'gerador')
      .replace(/manager/gi,        'gerenciador');
  }

  function install(pkgName, type) {
    const flag = type === 'dev' ? ' --save-dev' : '';
    Terminal.runCmd(`npm install ${pkgName}${flag}`);
    Shell.toast(`Instalando ${pkgName}...`, 'info');
  }

  // Busca com debounce ao digitar
  function setupLiveSearch() {
    const input = document.getElementById('npm-search-input');
    if (!input) return;
    input.addEventListener('input', () => {
      clearTimeout(searchTimer);
      if (input.value.length >= 2) {
        searchTimer = setTimeout(search, 500);
      }
    });
  }

  return { search, install, setupLiveSearch };
})();
