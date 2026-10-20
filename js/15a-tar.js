/* tar.js — abre .tar.gz / .tgz / .taz / .tar (o formato que o Replit baixa) aqui mesmo, sem instalar nada.
   Devolve um JSZip com os mesmos arquivos, para o resto do app tratar igual a um .zip. */
window.AbrirTar = (function () {
  'use strict';
  const ehTar = (nome) => /\.(tar\.gz|tgz|taz|tar|gz)$/i.test(nome);
  async function descompactar(file) {
    const buf = new Uint8Array(await file.arrayBuffer());
    if (buf[0] === 0x1f && buf[1] === 0x8b) {   // gzip
      if (!window.DecompressionStream) throw new Error('Este navegador não sabe abrir .gz. Atualize o Chrome.');
      const ds = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
      return new Uint8Array(await new Response(ds).arrayBuffer());
    }
    return buf;
  }
  const texto = (b, i, n) => { let e = i; while (e < i + n && b[e]) e++; return new TextDecoder().decode(b.subarray(i, e)); };
  const octal = (b, i, n) => parseInt(texto(b, i, n).trim() || '0', 8) || 0;
  async function abrir(file) {
    const b = await descompactar(file);
    const z = new JSZip();
    let pos = 0, nomeLongo = null, paxPath = null, n = 0;
    while (pos + 512 <= b.length) {
      if (b[pos] === 0 && b[pos + 1] === 0) break;                 // fim do tar (bloco vazio)
      let nome = texto(b, pos, 100);
      const tam = octal(b, pos + 124, 12), tipo = String.fromCharCode(b[pos + 156] || 48);
      const prefixo = texto(b, pos + 345, 155);
      if (prefixo && texto(b, pos + 257, 6).startsWith('ustar')) nome = prefixo + '/' + nome;
      const ini = pos + 512, dados = b.subarray(ini, ini + tam);
      pos = ini + Math.ceil(tam / 512) * 512;
      if (tipo === 'L') { nomeLongo = texto(dados, 0, dados.length); continue; }          // nome comprido (GNU)
      if (tipo === 'x') { const m = new TextDecoder().decode(dados).match(/\d+ path=([^\n]+)\n/); paxPath = m ? m[1] : null; continue; }   // nome comprido (pax)
      if (tipo === 'g') continue;
      if (nomeLongo) { nome = nomeLongo; nomeLongo = null; }
      if (paxPath) { nome = paxPath; paxPath = null; }
      nome = nome.replace(/^\.\//, '');
      if (!nome || tipo === '5' || nome.endsWith('/')) continue;    // pasta
      if (tipo !== '0' && tipo !== '\u0000' && tipo !== '7') continue; // links etc.
      z.file(nome, dados.slice()); n++;
    }
    if (!n) throw new Error('Não achei arquivos dentro deste ' + file.name);
    return z;
  }
  return { ehTar, abrir };
})();
