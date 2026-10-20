# 🔬 Laboratório (19/10) — feito a partir do ProjetoLens do Claude 4.6

Feito a partir dos pedaços que o Claude 4.6 entregou soltos ("SUBSTITUA isto por aquilo").
Agora está **montado de verdade, em módulos**, testado no navegador e no tamanho de celular.

## 🧪 NOVO: o Laboratório (etapa 1)
No menu, seção **Laboratório**:

### 🗺️ Mapa de ligações
- Toque num arquivo e veja **o que ele usa**, **quem usa ele** e os **pacotes de fora** (react, axios…).
- Mostra as **peças centrais** (as mais usadas), os **soltos** (ninguém chama) e quem **chama arquivo que não existe**.
- **📦 Extrair com tudo que precisa**: o arquivo + tudo o que ele usa (e o que esses usam), num zip, com um LEIA-ESTE-PEDACO.md. Serve para **guardar a lógica boa** e levar para outro projeto (ex.: juntar tudo do jurídico num "bolo" só).
- **🧠 Mapa mental** (.md em Mermaid) e **📋 relatório das ligações** (.md).

### 🧪 Prévia
- Escolha a página (ou o `main.tsx`/`main.jsx`) e **▶ Rodar**. Ela junta sozinha CSS, JS, imagens, JSON e módulos.
- **JSX/TSX/TS** são convertidos na hora (Sucrase; reserva: Babel). Apelido `@/` funciona.
- **Pacotes** (react, lodash…) vêm pelo **CDN esm.sh**, na **mesma versão** do package.json.
- **Tailwind** entra sozinho pelo CDN quando o projeto usa (v3 ou v4).
- **➕ Juntar arquivos soltos**: ver juntos pedaços que não se chamam (um .html + um .css + um .js).
- **✍️ Colar código**: cola e vê na hora.
- **Console da prévia**: o que a página escreve e os erros (em vermelho), aqui embaixo.
- **🧾 O que eu fiz**: a lista do que foi trocado (útil para levar para a IA).
- Limite honesto: chamadas ao **servidor** (`/api/…`) não respondem na prévia. Para isso: Servidorzinho no PC.
- Precisa de **internet** só para o CDN (pacotes, Tailwind, conversor).

### 🔎 Terminal com pesquisa de verdade (precisa de internet)
| Comando | O que faz |
|---|---|
| `pesquisar <palavras>` (ou `npm search`) | acha pacotes no npm |
| `info <pacote>` (ou `npm view`) | versão, tamanho, downloads, licença, dependências; avisa se a do seu projeto é velha |
| `cdn <pacote>` | como usar **sem instalar** (jsDelivr, esm.sh, unpkg) |
| `comparar <a> <b>` | lado a lado, e diz qual é o mais leve e o mais usado |
| `alternativas <pacote>` | outros pacotes que fazem o mesmo |
| `substitutos` | para cada pacote do projeto: dá para usar pelo CDN? |
As descrições dos pacotes vêm em inglês (a tradução entra com a IA, na etapa 4).

### ⚖️ Comparar A × B (etapa 2)
- **📁 Dois arquivos** do projeto, **✍️ dois códigos colados**, ou **📦 dois projetos inteiros** (o importado × outro .zip/.tar.gz).
- Linha por linha: **➕ verde** = entrou · **➖ vermelho** = saiu (com o número da linha).
- Nos projetos: quais **mudaram**, quais são **novos**, quais **sumiram**, quais são **iguais**.
- **📄 Baixar (.md)** ou **📋 Copiar para a IA**: as diferenças prontas, "mastigadas".
- Opção de não contar diferença só de espaço.

### 🧰 Ferramentas (etapa 3)
Abrem aqui dentro, cada uma guardando os próprios dados: **Faxina de Repetidos**, **Arrumador de Backups**, **Numerador de Códigos**, **Preparador Universal**, **Colador de Links**.
**Kits para baixar** (rodam fora do navegador): Kit do Replit (`kit-replit.cjs`), Servidorzinho (`servir.py`), Organizador do Celular (`organizar.py`), Juntar (`juntar.py`).

### 📱 Terminal de verdade (Termux)
A **mesma ponte do Mini SK**, que já funciona:
1. No Termux, só da 1ª vez: `pkg install -y ttyd`
2. No Termux, toda vez: `ttyd -W -i 127.0.0.1 -p 7681 bash` (deixe o Termux aberto)
3. No Laboratório: 📱 Terminal de verdade → **🔌 Conectar**.
- **🧩 Ligar a ponte** → **⬆ Mandar o projeto** (vai para `~/laboratorio/NOME`) → rode `npm install` / `npm run build` → **⬇ Trazer do Termux** (a pasta `dist` volta e a 🧪 Prévia abre ela).
- Botões prontos: `npm install`, `npm run build`, `ls -la`, `termux-wake-lock`.
- Só o seu celular enxerga (127.0.0.1) e a ponte de arquivos pede um código guardado no aparelho.
- Abra o Laboratório pelo **Chrome** (arquivo ou site): dentro do chat ele não conecta.

### 🔪 Desmontar HTML (para aprender) — NOVO 20/10
Abra um HTML (do projeto, de um arquivo ou colado) e veja:
- **🧩 Partes**: estilos, códigos, seções que o próprio código marca, bibliotecas de fora, botões da tela.
- **⚙️ Funções**: cada função com **o que faz** (em português), **quem ela chama**, **quem chama ela**, onde ela mexe na tela — e o código dela.
- **🎨 Cores**: toque na bolinha e troque a cor — muda no código todo e aparece na hora. Dá para baixar o HTML com as cores novas.
- **⚠️ Problemas**: nome declarado 2 vezes que **trava o app** (achou o defeito do Iara na hora), botão chamando função que não existe, id que o código procura e a tela não tem, função gigante.
- **✂️ Picar**: separa em `index.html` + `css/` + `js/` **sem mudar o que faz** (as funções vão primeiro, o resto depois, na ordem), dá nome pelos títulos do código, e **roda as duas versões para comparar os erros**. Baixa o zip ou abre no Laboratório como projeto.
- **📋 Plano**: o plano completo em .md, "mastigado", com o **pedido pronto para a IA**.
- **Rodando**: a página roda ao lado, com o console.
Testado: Faxina (picada em 9 arquivos com os nomes originais), AI Code Studio (picado em 22 arquivos pelas seções) — as duas versões picadas rodam **igual** às originais.

### 👁 Visualizar (no 📱 Terminal de verdade) — NOVO 20/10
Depois do `npm run dev` (ou `node server.cjs`, `python servir.py`…), escolha a **porta** (5173, 5000, 3000, 8080, 4173, 7745 ou outra) e veja aqui dentro — ou ↗ abra no Chrome.

### 📂 Seus códigos (nas 🧰 Ferramentas)
Os códigos do Claude antigo que vieram na pasta "alguns códigos montar", do jeito que vieram: **AI Code Studio** (chat com Gemini, Claude, GPT, Groq — ponha a sua chave nele), **Projeto Lab**, **Replicador de Projeto**, **Iara Suite** (a versão que eu já tinha consertado: a original travava por usar o nome `buildTarget` duas vezes) e **Juntador de Arquivos**.
⚠️ O arquivo **PLANO_RECUPERACAO** ficou de fora de propósito: ele tem o endereço de um banco Neon com senha.

### Testado (19/10)
Projeto HTML (CSS com @import, imagem, módulos, JSON), projeto React/Vite com TSX + Tailwind + "@/", juntar soltos, extrair pedaço, todos os comandos de pesquisa, a comparação de duas versões reais do Jurídico (achou a mudança da porta no main.cjs) as 10 ferramentas abrindo aqui dentro, e a ponte do Termux mandando o projeto e trazendo a pasta `dist` de volta (testada com a mesma ponte rodando no computador). Também no tamanho de celular. Zero erros.

Conserto extra: o importador do 4.6 tratava `.cjs`, `.mjs`, `.ini`, `.webmanifest`… como "binário" e não lia o texto. Agora lê.

## Próximas etapas
4. IA com sua chave (plano modular, tradução das dependências, memória do que aprendeu) · 5. Proxy em cascata (com base no manual do Replit), Drive e manual completo.

## O que foi feito na montagem
- Juntei os pedaços na casca (`index.html`): cada tela no seu lugar, cada código no seu arquivo.
- **Tirei os repetidos**: 2.4=2.5, 7.2=7.4, 7.3=7.5, 8.2=8.3.3, 8.3=84, 9.3=9.4 e o "2 módulo" (= 2.0+2.1+2.2+2.4).
- **Completei 3 pedaços que vieram cortados** (a resposta do 4.6 acabou no meio):
  - Plano (5.4 cortado) → usei o 5.5, que é a versão completa.
  - Scripts (6.2 cortado) → emendei com o 6.4, que é a continuação dele.
  - Terminal (7.3 cortado) → escrevi as 8 funções que faltaram (escrever linha, histórico, copiar, salvar…).
- **Consertos:**
  - A aba CDN mostrava código quebrado na tela.
  - A lista de dependências colocava as etiquetas "vivas" na página e carregava bibliotecas da internet sem querer (até o Tailwind).
  - Abrir .tar.gz dependia da internet → agora vai a peça junto (`lib/pako.min.js`).
  - O botão ☰ não fazia nada → agora abre/fecha o menu (no celular, por cima da tela, com os nomes).
  - O celular ficava espremido pela barra lateral → arrumado.
  - O menu dizia "Terminal REAL / WebContainers", mas é **simulado** (ele mesmo escreve isso) → rótulo corrigido.

## O que é de verdade e o que não é
| Módulo | Situação |
|---|---|
| 📦 Importar (zip, tar, tar.gz, pasta) | ✅ funciona |
| 📁 Explorador (ver e copiar os arquivos) | ✅ funciona |
| 🧩 Dependências (todos os package.json, monorepo, unificar) | ✅ funciona · descrição do npm precisa de internet |
| 🔍 Analisador (frameworks, bugs, estrutura) | ✅ funciona |
| 🛣️ Rotas de API | ✅ funciona |
| 🌐 Alternativas CDN | ✅ funciona (gera as etiquetas jsDelivr/unpkg) |
| 📋 Plano (monolítico / modular / por partes, em MD) | ✅ funciona |
| ⚙️ Scripts BAT/SH/PS1/Makefile | ✅ gera os arquivos |
| 💾 Exportar (zip, MDs, sessão, pacote para IA) | ✅ funciona |
| 💻 Terminal | ⚠️ **simulado**: os comandos de consulta (ls, cat, tree, grep, deps, routes, bugs…) leem o projeto de verdade; `npm install`/`npm run` só mostram o comando para rodar no seu computador. A **busca no npm** (ao lado) é de verdade. |

## Testado
Importei a versão completa do Jurídico: 114 arquivos, 113 dependências, 101 rotas, plano de 27 mil letras, scripts BAT e SH, zip e pacote para IA. Também um .tar.gz. Zero erros.

## Os arquivos
- `index.html` — a casca (menu, telas)
- `css/00-casca.css` … `css/09-integracao.css` — o visual de cada módulo · `css/10-celular.css` (novo)
- `js/00-casca.js` — estado, navegação, auto-salvar
- `js/02-importar.js`, `03-dependencias.js`, `04-analisar.js`, `05a-markdown.js`, `05-plano.js`, `06-scripts.js`, `06b-scripts-fim.js`, `07a-busca-npm.js`, `07-terminal.js`, `08-exportar.js`, `09-integracao.js` · `10-celular.js` (novo)
- `js/11-lab-base.js` (quem chama quem), `12-lab-mapa.js`, `13-lab-previa.js`, `14-lab-pesquisa.js`, `15-lab-comparar.js` (+ `15a-tar.js`), `16-lab-ferramentas.js`, `17-lab-termux.js`, `18-lab-desmontar.js` · `css/11-lab.css` — o Laboratório
- `ferramentas/` — as 5 ferramentas + os 5 códigos seus · `kits/` — os 4 kits
- `lib/` — JSZip, pako e acorn (o leitor de JavaScript) — para funcionar sem internet
- O importador agora também **guarda as imagens** (antes jogava fora) — a Prévia precisa delas.
