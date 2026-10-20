
// ============================================================
//  RENDERIZADOR MARKDOWN SIMPLES — usado pelo Planner
// ============================================================
const MDRenderer = {
  render(md) {
    if (!md) return '';
    let html = md
      // Escapa HTML perigoso
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      // Títulos
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^### (.+)$/gm,  '<h3>$1</h3>')
      .replace(/^## (.+)$/gm,   '<h2>$1</h2>')
      .replace(/^# (.+)$/gm,    '<h1>$1</h1>')
      // Negrito e itálico
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g,     '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,         '<em>$1</em>')
      // Código inline
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Blockquote
      .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
      // HR
      .replace(/^---+$/gm, '<hr>')
      // Listas não ordenadas
      .replace(/^\- (.+)$/gm, '<li>$1</li>')
      .replace(/^  - (.+)$/gm, '<li style="margin-left:16px">$1</li>')
      // Listas ordenadas
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      // Checkbox
      .replace(/\[x\]/gi, '✅').replace(/\[ \]/g, '⬜')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Agrupa <li> em <ul>
    html = html.replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`);

    // Tabelas
    html = html.replace(/(\|.+\|\n)+/g, match => {
      const rows = match.trim().split('\n');
      if (rows.length < 2) return match;
      const header = rows[0];
      const body   = rows.slice(2); // pula linha de separação
      const thCells = header.split('|').filter(c => c.trim())
        .map(c => `<th>${c.trim()}</th>`).join('');
      const bodyRows = body.map(row => {
        const cells = row.split('|').filter(c => c.trim())
          .map(c => `<td>${c.trim()}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `<table><thead><tr>${thCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
    });

    // Blocos de código
    html = html.replace(/```[\w]*\n([\s\S]*?)```/g,
      (_, code) => `<pre><code>${code}</code></pre>`);

    // Parágrafos (linhas que não são tags)
    html = html.split('\n').map(line => {
      if (!line.trim()) return '<br>';
      if (/^<[h1-6|ul|ol|li|pre|table|blockquote|hr]/.test(line)) return line;
      return `<p>${line}</p>`;
    }).join('\n');

    return html;
  }
};
