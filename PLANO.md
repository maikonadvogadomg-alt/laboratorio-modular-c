# 📋 Plano do projeto: Laboratorio-modular-20-10 (2)

_Gerado em 20/10/2026, 12:36:43 — sem IA, lendo os arquivos._

## 📊 Visão geral
| Item | Valor |
|---|---|
| Arquivos | 81 |
| Linhas | 23.893 |
| Telas/páginas | 12 |
| Rotas do backend | 0 |
| Chamadas do app | 0 |
| Tabelas do banco | 0 |
| Variáveis de ambiente | 2 |

**Linguagens:** JavaScript (29), Imagem (15), HTML (12), CSS (11), Python (3), Markdown (3), Outros (2), Imagem SVG (2), JSON (2), YAML (1), Ícone (1)

## 💡 O que fazer (em ordem)
1. 🧹 Tirar a Replit de 6 arquivo(s) (🏗️ Preparar → Fazer tudo)
2. 🔐 Criar um .env.example com: BASE_PATH, PORT (os valores você coloca no servidor, nunca no código)
3. 📝 Criar um README.md explicando como rodar

## 🚀 Por onde começa
- `index.html`

## ⌨️ Comandos (package.json)
| Pasta | Comando | O que roda |
|---|---|---|
| . | `npm run desktop` | `electron .` |
| . | `npm run exe` | `electron-builder --win portable --publish never` |

## 📱 Telas e páginas
| Endereço | Arquivo |
|---|---|
| `ferramentas/ai-code-studio.html` | ferramentas/ai-code-studio.html |
| `ferramentas/arrumador.html` | ferramentas/arrumador.html |
| `ferramentas/colador.html` | ferramentas/colador.html |
| `ferramentas/faxina.html` | ferramentas/faxina.html |
| `ferramentas/iara-suite.html` | ferramentas/iara-suite.html |
| `ferramentas/juntador.html` | ferramentas/juntador.html |
| `ferramentas/numerador.html` | ferramentas/numerador.html |
| `ferramentas/preparador.html` | ferramentas/preparador.html |
| `ferramentas/projeto-lab.html` | ferramentas/projeto-lab.html |
| `ferramentas/replicador.html` | ferramentas/replicador.html |
| `hub.html` | hub.html |
| `index.html` | index.html |

## 🖥️ Rotas do backend
_Nenhum encontrado._

## 📡 O que o app pede ao servidor
_Nenhum encontrado._

## 🔌 O que falta no backend
✅ Tudo que o app chama tem rota no projeto (ou o app não usa servidor).

## 🗄️ Banco de dados
_Nenhuma tabela encontrada._

## 🔐 Variáveis de ambiente (configurar no servidor)
- `BASE_PATH`
- `PORT`

_Só os nomes. Os valores (chaves, senhas) nunca vão no código nem no GitHub._

## 🌐 Serviços de fora que ele acessa
- api.npmjs.org
- cdn.jsdelivr.net
- cdn.tailwindcss.com
- data.jsdelivr.com
- esm.sh
- github.com
- nodejs.org
- raw.github.com
- raw.githubusercontent.com
- registry.npmjs.org
- stuartk.com
- stuk.github.io
- unpkg.com
- www.npmjs.com

## 🧹 Arquivos com coisa da Replit
- js/15a-tar.js
- js/16-lab-ferramentas.js
- kits/kit-replit.cjs
- kits/organizar.py
- kits/servir.py
- service-worker.js

## 🔁 Roteiro para recriar fora da Replit
1. Importar o projeto no Mini SK e tocar em 🏗️ Preparar → ✅ Fazer tudo (tira a Replit, cria os arquivos que faltam).
2. Não tem backend: o site sozinho basta (Netlify ou GitHub Pages).
3. Variáveis: cadastrar 2 variável(is) no servidor (lista acima).
4. Testar a prévia; se der erro, 🤖 Mandar os erros para a IA.
5. App: 📲 Instalável (PWA), 📦 APK ou 🖥️ Desktop (.exe) pelo 🏗️ Preparar.

## 🌳 Árvore de arquivos
```
├─ 📁 .github/
│  └─ 📁 workflows/
│     └─ desktop-exe.yml
├─ 📁 css/
│  ├─ 00-casca.css
│  ├─ 02-importar.css
│  ├─ 03-dependencias.css
│  ├─ 04-analisar.css
│  ├─ 05-plano.css
│  ├─ 06-scripts.css
│  ├─ 07-terminal.css
│  ├─ 08-exportar.css
│  ├─ 09-integracao.css
│  ├─ 10-celular.css
│  └─ 11-lab.css
├─ 📁 electron/
│  ├─ main.cjs
│  └─ preload.cjs
├─ 📁 ferramentas/
│  ├─ ai-code-studio.html
│  ├─ arrumador.html
│  ├─ colador.html
│  ├─ faxina.html
│  ├─ iara-suite.html
│  ├─ juntador.html
│  ├─ numerador.html
│  ├─ preparador.html
│  ├─ projeto-lab.html
│  └─ replicador.html
├─ 📁 icons/
│  ├─ apple-touch-icon.png
│  ├─ icon-128.png
│  ├─ icon-144.png
│  ├─ icon-152.png
│  ├─ icon-16.png
│  ├─ icon-180.png
│  ├─ icon-192.png
│  ├─ icon-32.png
│  ├─ icon-384.png
│  ├─ icon-48.png
│  ├─ icon-512.png
│  ├─ icon-72.png
│  ├─ icon-96.png
│  ├─ icon.svg
│  ├─ maskable-192.png
│  ├─ maskable-512.png
│  └─ maskable.svg
├─ 📁 js/
│  ├─ 00-casca.js
│  ├─ 02-importar.js
│  ├─ 03-dependencias.js
│  ├─ 04-analisar.js
│  ├─ 05-plano.js
│  ├─ 05a-markdown.js
│  ├─ 06-scripts.js
│  ├─ 06b-scripts-fim.js
│  ├─ 07-terminal.js
│  ├─ 07a-busca-npm.js
│  ├─ 08-exportar.js
│  ├─ 09-integracao.js
│  ├─ 10-celular.js
│  ├─ 11-lab-base.js
│  ├─ 12-lab-mapa.js
│  ├─ 13-lab-previa.js
│  ├─ 14-lab-pesquisa.js
│  ├─ 15-lab-comparar.js
│  ├─ 15a-tar.js
│  ├─ 16-lab-ferramentas.js
│  ├─ 17-lab-termux.js
│  └─ 18-lab-desmontar.js
├─ 📁 kits/
│  ├─ juntar.py
│  ├─ kit-replit.cjs
│  ├─ organizar.py
│  └─ servir.py
├─ 📁 lib/
│  ├─ acorn.min.js
│  ├─ jszip.min.js
│  └─ pako.min.js
├─ .gitignore
├─ favicon.ico
├─ hub.html
├─ hub.webmanifest
├─ index.html
├─ LEIA-ME.md
├─ manifest.json
├─ package.json
├─ PLANO.md
├─ RECEITA.md
└─ service-worker.js
```
