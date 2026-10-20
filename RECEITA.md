# 🧬 Receita para recriar: 🔬 Laboratório

_Gerada sem IA, lendo 80 arquivo(s). Serve para remontar este app como HTML modular — com qualquer IA, um arquivo por vez._

## 1. O que é

- **Nome:** 🔬 Laboratório
- **Partes de código:** 51 (12 tela, 28 logica, 0 servidor, 0 dados, 11 estilo)
- **Tem servidor (rotas /api):** não — dá para ser só HTML
- **Peças de fora (bibliotecas):** @capacitor/cli, child_process, electron, fs, http, os, path, react-native, react-native-webview, readline, url, x, zlib

## 2. Estrutura modular proposta

```
index.html            ← a página; chama os módulos NA ORDEM
css/app.css           ← o visual
js/00-core.js         ← a "locomotiva": cria window.APP (registrar, guardar, avisar)
js/10-preload.js      ← Ponte segura entre a janela e o computador. A página vê window.desktop (era electron/preload.cjs)
js/15-casca.js        ← SHELL PRINCIPAL — ProjetoLens Estado global, navegação, abas, toast, m (era js/00-casca.js)
js/20-importar.js     ← MÓDULO 2 — IMPORTADOR UNIVERSAL ZIP, TAR, TAZ, GZ, Pasta — sem limite  (era js/02-importar.js)
js/25-dependencias.js ← MÓDULO 3 — ANALISADOR DE DEPENDÊNCIAS Monorepo, NPM Registry, CDN, cla (era js/03-dependencias.js)
js/30-analisar.js     ← MÓDULO 4 — ANALISADOR DE CÓDIGO + ROTAS DE API Detecta frameworks, bug (era js/04-analisar.js)
js/35-plano.js        ← MÓDULO 5 — CONCLUSÃO DO PLANNER Cole este bloco DEPOIS do MDRenderer e (era js/05-plano.js)
js/40-05a-markdown.js ← RENDERIZADOR MARKDOWN SIMPLES — usado pelo Planner (era js/05a-markdown.js)
js/45-scripts.js      ← MÓDULO 6 — GERADOR DE SCRIPTS BAT / SH / PS1 / MAKEFILE Comentados em  (era js/06-scripts.js)
js/50-06b-scripts-fim.js← MÓDULO 6 — CONCLUSÃO: highlight + download + init Adiciona ao ScriptGe (era js/06b-scripts-fim.js)
js/55-terminal.js     ← MÓDULO 7 — TERMINAL PRINCIPAL Simula ambiente Node.js com comandos rea (era js/07-terminal.js)
js/60-07a-busca-npm.js← BUSCADOR NPM — usa API pública do registry.npmjs.org (era js/07a-busca-npm.js)
js/65-exportar.js     ← MÓDULO 8 — EXPORTADOR UNIVERSAL ZIP, MD, JSON, Sessão, Pacote para IA (era js/08-exportar.js)
js/70-integracao.js   ← MÓDULO 9 — INTEGRAÇÃO FINAL Liga todos os módulos, atalhos, status bar (era js/09-integracao.js)
js/75-celular.js      ← 10-celular.js — feito na montagem: o botão ☰ (o 4.6 desenhou, mas não  (era js/10-celular.js)
js/80-lab-base.js     ← LABORATÓRIO — 11-lab-base.js A peça que entende "quem chama quem" dent (era js/11-lab-base.js)
js/85-lab-mapa.js     ← LABORATÓRIO — 12-lab-mapa.js · 🗺️ MAPA DE LIGAÇÕES Escolhe um arquivo (era js/12-lab-mapa.js)
js/90-lab-previa.js   ← LABORATÓRIO — 13-lab-previa.js · 🧪 PRÉVIA DE VÁRIOS ARQUIVOS Escolhe  (era js/13-lab-previa.js)
js/91-lab-pesquisa.js ← LABORATÓRIO — 14-lab-pesquisa.js · 🔎 PESQUISA DE VERDADE NO TERMINAL  (era js/14-lab-pesquisa.js)
js/92-lab-comparar.js ← LABORATÓRIO — 15-lab-comparar.js · ⚖️ COMPARAR A × B 3 jeitos: 📁 Dois (era js/15-lab-comparar.js)
js/93-15a-tar.js      ← tar.js — abre .tar.gz / .tgz / .taz / .tar (o formato que o Replit bai (era js/15a-tar.js)
js/94-lab-ferramentas.js← LABORATÓRIO — 16-lab-ferramentas.js · 🧰 SUAS FERRAMENTAS NUM LUGAR SÓ (era js/16-lab-ferramentas.js)
js/95-lab-termux.js   ← LABORATÓRIO — 17-lab-termux.js · 📱 TERMINAL DE VERDADE (Termux) A mes (era js/17-lab-termux.js)
js/96-lab-desmontar.js← LABORATÓRIO — 18-lab-desmontar.js · 🔪 DESMONTAR HTML (para aprender)  (era js/18-lab-desmontar.js)
js/97-juntar.js       ← -*- coding: utf-8 -*- (era kits/juntar.py)
js/98-kit-replit.js   ← !/usr/bin/env node (era kits/kit-replit.cjs)
js/98-organizar.js    ← -*- coding: utf-8 -*- (era kits/organizar.py)
js/98-servir.js       ← -*- coding: utf-8 -*- (era kits/servir.py)
js/98-ai-code-studio.js← AI Code Studio — 🤖 AI Code Studio (era ferramentas/ai-code-studio.html)
js/98-arrumador.js    ← Arrumador de Backups — 🗃 Arrumador de Backups (era ferramentas/arrumador.html)
js/98-colador.js      ← Colador de Links — 🔗 Colador de Links (era ferramentas/colador.html)
js/98-faxina.js       ← 🧹 Faxina de Repetidos — 🧹 Faxina de Repetidos (era ferramentas/faxina.html)
js/98-iara-suite.js   ← Iara Suite — Code Editor · APK Builder · Site Extractor — Olá, Mundo! (era ferramentas/iara-suite.html)
js/98-juntador.js     ← Juntador de Arquivos — 🧩 Juntador de Arquivos (era ferramentas/juntador.html)
js/98-numerador.js    ← Numerador de Códigos — 🔢 Numerador de Códigos (era ferramentas/numerador.html)
js/98-preparador.js   ← Preparador Universal — 🧰 Preparador Universal (era ferramentas/preparador.html)
js/98-projeto-lab.js  ← Projeto Lab (era ferramentas/projeto-lab.html)
js/98-replicador.js   ← Replicador de Projeto (era ferramentas/replicador.html)
js/98-hub.js          ← Laboratorio-modular-c — Laboratorio-modular-c (era hub.html)
js/98-inicio.js       ← 🔬 Laboratório — 🔬 Laboratório (era index.html)
js/99-app.js          ← o último: monta a tela com o que embarcou
```

## 3. As partes, uma por uma

| # | Era | Vira | Tipo | O que faz | Usa |
|---|---|---|---|---|---|
| 1 | `electron/main.cjs` | css/app.css | logica | Abre o app numa janela de computador (Electron). Gerado pelo 🏗️ Preparar do Mini SK. Usa  | — |
| 2 | `electron/preload.cjs` | `js/10-preload.js` | logica | Ponte segura entre a janela e o computador. A página vê window.desktop | — |
| 3 | `js/00-casca.js` | `js/15-casca.js` | logica | SHELL PRINCIPAL — ProjetoLens Estado global, navegação, abas, toast, modal, autosave | — |
| 4 | `js/02-importar.js` | `js/20-importar.js` | logica | MÓDULO 2 — IMPORTADOR UNIVERSAL ZIP, TAR, TAZ, GZ, Pasta — sem limite Carrega libs externa | — |
| 5 | `js/03-dependencias.js` | `js/25-dependencias.js` | logica | MÓDULO 3 — ANALISADOR DE DEPENDÊNCIAS Monorepo, NPM Registry, CDN, classificação PT-BR | ${url} |
| 6 | `js/04-analisar.js` | `js/30-analisar.js` | logica | MÓDULO 4 — ANALISADOR DE CÓDIGO + ROTAS DE API Detecta frameworks, bugs, rotas, console.lo | — |
| 7 | `js/05-plano.js` | `js/35-plano.js` | logica | MÓDULO 5 — CONCLUSÃO DO PLANNER Cole este bloco DEPOIS do MDRenderer e ANTES do </body> | — |
| 8 | `js/05a-markdown.js` | `js/40-05a-markdown.js` | logica | RENDERIZADOR MARKDOWN SIMPLES — usado pelo Planner | — |
| 9 | `js/06-scripts.js` | `js/45-scripts.js` | logica | MÓDULO 6 — GERADOR DE SCRIPTS BAT / SH / PS1 / MAKEFILE Comentados em PT-BR, completos, pr | — |
| 10 | `js/06b-scripts-fim.js` | `js/50-06b-scripts-fim.js` | logica | MÓDULO 6 — CONCLUSÃO: highlight + download + init Adiciona ao ScriptGen já existente via p | — |
| 11 | `js/07-terminal.js` | `js/55-terminal.js` | logica | MÓDULO 7 — TERMINAL PRINCIPAL Simula ambiente Node.js com comandos reais úteis | — |
| 12 | `js/07a-busca-npm.js` | `js/60-07a-busca-npm.js` | logica | BUSCADOR NPM — usa API pública do registry.npmjs.org | — |
| 13 | `js/08-exportar.js` | `js/65-exportar.js` | logica | MÓDULO 8 — EXPORTADOR UNIVERSAL ZIP, MD, JSON, Sessão, Pacote para IA | — |
| 14 | `js/09-integracao.js` | `js/70-integracao.js` | logica | MÓDULO 9 — INTEGRAÇÃO FINAL Liga todos os módulos, atalhos, status bar, fluxo guiado | — |
| 15 | `js/10-celular.js` | `js/75-celular.js` | logica | 10-celular.js — feito na montagem: o botão ☰ (o 4.6 desenhou, mas não ligou). No celular a | — |
| 16 | `js/11-lab-base.js` | `js/80-lab-base.js` | logica | LABORATÓRIO — 11-lab-base.js A peça que entende "quem chama quem" dentro do projeto import | — |
| 17 | `js/12-lab-mapa.js` | `js/85-lab-mapa.js` | logica | LABORATÓRIO — 12-lab-mapa.js · 🗺️ MAPA DE LIGAÇÕES Escolhe um arquivo e vê: o que ele USA | — |
| 18 | `js/13-lab-previa.js` | `js/90-lab-previa.js` | logica | LABORATÓRIO — 13-lab-previa.js · 🧪 PRÉVIA DE VÁRIOS ARQUIVOS Escolhe a página (ou o main. | — |
| 19 | `js/14-lab-pesquisa.js` | `js/91-lab-pesquisa.js` | logica | LABORATÓRIO — 14-lab-pesquisa.js · 🔎 PESQUISA DE VERDADE NO TERMINAL Comandos novos (prec | — |
| 20 | `js/15-lab-comparar.js` | `js/92-lab-comparar.js` | logica | LABORATÓRIO — 15-lab-comparar.js · ⚖️ COMPARAR A × B 3 jeitos: 📁 Dois arquivos do projeto | — |
| 21 | `js/15a-tar.js` | `js/93-15a-tar.js` | logica | tar.js — abre .tar.gz / .tgz / .taz / .tar (o formato que o Replit baixa) aqui mesmo, sem  | — |
| 22 | `js/16-lab-ferramentas.js` | `js/94-lab-ferramentas.js` | logica | LABORATÓRIO — 16-lab-ferramentas.js · 🧰 SUAS FERRAMENTAS NUM LUGAR SÓ Cada ferramenta abr | — |
| 23 | `js/17-lab-termux.js` | `js/95-lab-termux.js` | logica | LABORATÓRIO — 17-lab-termux.js · 📱 TERMINAL DE VERDADE (Termux) A mesma ponte do Mini SK  | — |
| 24 | `js/18-lab-desmontar.js` | `js/96-lab-desmontar.js` | logica | LABORATÓRIO — 18-lab-desmontar.js · 🔪 DESMONTAR HTML (para aprender) Pega um HTML complet | — |
| 25 | `kits/juntar.py` | `js/97-juntar.js` | logica | -*- coding: utf-8 -*- | x.css, x.js |
| 26 | `kits/kit-replit.cjs` | `js/98-kit-replit.js` | logica | !/usr/bin/env node | — |
| 27 | `kits/organizar.py` | `js/98-organizar.js` | logica | -*- coding: utf-8 -*- | — |
| 28 | `kits/servir.py` | `js/98-servir.js` | logica | -*- coding: utf-8 -*- | — |
| 29 | `ferramentas/ai-code-studio.html` | `js/98-ai-code-studio.js` | tela | AI Code Studio — 🤖 AI Code Studio | — |
| 30 | `ferramentas/arrumador.html` | `js/98-arrumador.js` | tela | Arrumador de Backups — 🗃 Arrumador de Backups | — |
| 31 | `ferramentas/colador.html` | `js/98-colador.js` | tela | Colador de Links — 🔗 Colador de Links | manifest.json |
| 32 | `ferramentas/faxina.html` | `js/98-faxina.js` | tela | 🧹 Faxina de Repetidos — 🧹 Faxina de Repetidos | — |
| 33 | `ferramentas/iara-suite.html` | `js/98-iara-suite.js` | tela | Iara Suite — Code Editor · APK Builder · Site Extractor — Olá, Mundo! | — |
| 34 | `ferramentas/juntador.html` | `js/98-juntador.js` | tela | Juntador de Arquivos — 🧩 Juntador de Arquivos | — |
| 35 | `ferramentas/numerador.html` | `js/98-numerador.js` | tela | Numerador de Códigos — 🔢 Numerador de Códigos | — |
| 36 | `ferramentas/preparador.html` | `js/98-preparador.js` | tela | Preparador Universal — 🧰 Preparador Universal | package.json |
| 37 | `ferramentas/projeto-lab.html` | `js/98-projeto-lab.js` | tela | Projeto Lab | — |
| 38 | `ferramentas/replicador.html` | `js/98-replicador.js` | tela | Replicador de Projeto | — |
| 39 | `hub.html` | `js/98-hub.js` | tela | Laboratorio-modular-c — Laboratorio-modular-c | hub.webmanifest, favicon.ico, icon.svg, apple-touch-icon.png |
| 40 | `css/00-casca.css` | css/app.css | estilo | ===== RESET & VARIÁVEIS ===== | — |
| 41 | `css/02-importar.css` | css/app.css | estilo | ===== IMPORTADOR ===== | — |
| 42 | `css/03-dependencias.css` | css/app.css | estilo | ===== DEPS MODULE ===== | — |
| 43 | `css/04-analisar.css` | css/app.css | estilo | ===== ANALYZER MODULE ===== | — |
| 44 | `css/05-plano.css` | css/app.css | estilo | ===== PLANNER MODULE ===== | — |
| 45 | `css/06-scripts.css` | css/app.css | estilo | ===== SCRIPTS MODULE ===== | — |
| 46 | `css/07-terminal.css` | css/app.css | estilo | ===== TERMINAL MODULE ===== | — |
| 47 | `css/08-exportar.css` | css/app.css | estilo | ===== EXPORTADOR MODULE ===== | — |
| 48 | `css/09-integracao.css` | css/app.css | estilo | ===== INTEGRAÇÃO FINAL ===== | — |
| 49 | `css/10-celular.css` | css/app.css | estilo | 10-celular.css — feito na montagem: o ProjetoLens no celular. A barra lateral sai do camin | — |
| 50 | `css/11-lab.css` | css/app.css | estilo | 11-lab.css — visual das telas do Laboratório (Mapa, Prévia) | — |
| 51 | `index.html` | `js/98-inicio.js` | tela | 🔬 Laboratório — 🔬 Laboratório | 00-casca.css, 02-importar.css, 03-dependencias.css, 04-analisar.css |

## 4. Montar passo a passo (cada bloco é um pedido pronto: 📋 Copiar → colar na IA)

### Passo 0 — combinar as regras com a IA

```text
Vamos recriar o app "🔬 Laboratório" como HTML MODULAR, que abre pelo index.html, sem servidor e sem nada da Replit.
Regras: (1) index.html chama os arquivos js/ na ordem, antes do </body>; (2) js/00-core.js cria window.APP com APP.registrar(modulo), APP.guardar(chave, valor) em IndexedDB/localStorage e APP.avisar(texto); (3) cada arquivo js/NN-nome.js cuida de UM assunto, começa com (function (APP) { e termina com })(window.APP); (4) js/99-app.js vem por último e monta a tela com os módulos registrados; (5) textos em português do Brasil.
Vou pedir UM arquivo por vez. Responda só com o arquivo completo, sem cortar nada. Primeiro: crie index.html, css/app.css e js/00-core.js.
```

### Passo 1 — `js/10-preload.js` (era `electron/preload.cjs`, 4 linhas)

```text
Crie js/10-preload.js. Ele faz: Ponte segura entre a janela e o computador. A página vê window.desktop.
O original usava as bibliotecas electron: em HTML puro, use a versão de CDN (ou faça sem ela, se for simples).
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 2 — `js/15-casca.js` (era `js/00-casca.js`, 327 linhas)

```text
Crie js/15-casca.js. Ele faz: SHELL PRINCIPAL — ProjetoLens Estado global, navegação, abas, toast, modal, autosave.
No app original ele tinha estas funções/partes: Shell, triggerAutoSave, restoreSession, navigate, openTab, activateTab, closeTab, renderTabs, toast, openModal, closeModal, updateStatusBar, updateBadges, updateSidebarInfo, startClock, tick, checkPreviousSession, setState.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 3 — `js/20-importar.js` (era `js/02-importar.js`, 745 linhas)

```text
Crie js/20-importar.js. Ele faz: MÓDULO 2 — IMPORTADOR UNIVERSAL ZIP, TAR, TAZ, GZ, Pasta — sem limite Carrega libs externas necessárias.
No app original ele tinha estas funções/partes: loadLibs, Importer, getIcon, isTextFile, formatSize, showProgress, logProgress, hideProgress, initDropZone, openFolderPicker, openFilePicker, processFolderFiles, processFiles, processZip, processTar, parseTar, readTarString, processGz.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 4 — `js/25-dependencias.js` (era `js/03-dependencias.js`, 732 linhas)

```text
Crie js/25-dependencias.js. Ele faz: MÓDULO 3 — ANALISADOR DE DEPENDÊNCIAS Monorepo, NPM Registry, CDN, classificação PT-BR.
No app original ele tinha estas funções/partes: DepsAnalyzer, translateDesc, classifyDep, getCDNTag, hasCDN, analyze, addDep, renderSummary, setText, renderPkgTabs, setPkg, setFilter, filterDeps, renderDeps, renderDepCard, labelRelevance, showToolbar, showMonorepoBanner.
Ele chamava estes endereços: https://registry.npmjs.org/${dep.name}/latest, https://registry.npmjs.org/${name}/latest. Em HTML, ligue cada um à função equivalente do módulo certo.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 5 — `js/30-analisar.js` (era `js/04-analisar.js`, 815 linhas)

```text
Crie js/30-analisar.js. Ele faz: MÓDULO 4 — ANALISADOR DE CÓDIGO + ROTAS DE API Detecta frameworks, bugs, rotas, console.logs, estrutura.
No app original ele tinha estas funções/partes: CodeAnalyzer, analyze, detectFrameworks, detectBugs, detectConsoleLogs, detectRoutes, buildStructureMap, renderSummary, setText, renderFrameworks, renderBugs, labelBugType, setBugFilter, renderConsoleLogs, renderRoutes, renderRoutesPanel, routeCardHTML, setRouteFilter.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 6 — `js/35-plano.js` (era `js/05-plano.js`, 716 linhas)

```text
Crie js/35-plano.js. Ele faz: MÓDULO 5 — CONCLUSÃO DO PLANNER Cole este bloco DEPOIS do MDRenderer e ANTES do </body>.
No app original ele tinha estas funções/partes: Planner, setPlanType, toggleSection, setProgress, hideProgress, tick, generate, genOverview, genTech, genStructure, genDeps, row, genRoutes, genBugs, genModules, renderModulesMD, genSteps, genSetupScripts.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 7 — `js/40-05a-markdown.js` (era `js/05a-markdown.js`, 69 linhas)

```text
Crie js/40-05a-markdown.js. Ele faz: RENDERIZADOR MARKDOWN SIMPLES — usado pelo Planner.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 8 — `js/45-scripts.js` (era `js/06-scripts.js`, 751 linhas)

```text
Crie js/45-scripts.js. Ele faz: MÓDULO 6 — GERADOR DE SCRIPTS BAT / SH / PS1 / MAKEFILE Comentados em PT-BR, completos, prontos para usar.
No app original ele tinha estas funções/partes: ScriptGen, toggleOpt, setTab, generate, collectDirs, collectKeyFiles, genBAT, genSH, genPS1, genMakefile, dirs_for_make, buildPackageJSON, buildGitignore, buildEnvExample, renderScript, highlightScript.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 9 — `js/50-06b-scripts-fim.js` (era `js/06b-scripts-fim.js`, 187 linhas)

```text
Crie js/50-06b-scripts-fim.js. Ele faz: MÓDULO 6 — CONCLUSÃO: highlight + download + init Adiciona ao ScriptGen já existente via patch.
No app original ele tinha estas funções/partes: patchScriptGen, highlightScript, copyScript, downloadBAT, downloadSH, downloadPS1, downloadMakefile, downloadAll, _dl.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 10 — `js/55-terminal.js` (era `js/07-terminal.js`, 783 linhas)

```text
Crie js/55-terminal.js. Ele faz: MÓDULO 7 — TERMINAL PRINCIPAL Simula ambiente Node.js com comandos reais úteis.
No app original ele tinha estas funções/partes: Terminal, initEnv, handleKey, runInput, runCmd, cmdHelp, cmdClear, cmdLs, cmdPwd, cmdCd, cmdCat, cmdEcho, cmdNode, cmdNpm, cmdNpx, cmdGit, cmdEnv, cmdWhoami.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 11 — `js/60-07a-busca-npm.js` (era `js/07a-busca-npm.js`, 167 linhas)

```text
Crie js/60-07a-busca-npm.js. Ele faz: BUSCADOR NPM — usa API pública do registry.npmjs.org.
No app original ele tinha estas funções/partes: NpmSearch, search, renderResults, translateDesc, install, setupLiveSearch.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 12 — `js/65-exportar.js` (era `js/08-exportar.js`, 773 linhas)

```text
Crie js/65-exportar.js. Ele faz: MÓDULO 8 — EXPORTADOR UNIVERSAL ZIP, MD, JSON, Sessão, Pacote para IA.
No app original ele tinha estas funções/partes: Exporter, updateSummary, setProgress, hideProgress, tick, addHistory, renderHistory, exportPlan, copyPlan, exportBugs, copyBugs, exportDeps, exportDepsJSON, copyDeps, exportRoutes, exportRoutesJSON, copyRoutes, exportStructure.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 13 — `js/70-integracao.js` (era `js/09-integracao.js`, 652 linhas)

```text
Crie js/70-integracao.js. Ele faz: MÓDULO 9 — INTEGRAÇÃO FINAL Liga todos os módulos, atalhos, status bar, fluxo guiado.
No app original ele tinha estas funções/partes: Integration, init, updateClock, updateStatusBar, setupKeyboardShortcuts, setupGlobalDrop, showDropOverlay, hideDropOverlay, setupStateWatcher, onStateChange, markFlowDone, updateWelcomeFlow, updateBugBadge, patchShellToast, showToast, closeToast, patchShellBadges, patchShellNavigate.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 14 — `js/75-celular.js` (era `js/10-celular.js`, 19 linhas)

```text
Crie js/75-celular.js. Ele faz: 10-celular.js — feito na montagem: o botão ☰ (o 4.6 desenhou, mas não ligou). No celular abre/fecha a barra por cima; no computador recolhe/mostra a barra.
No app original ele tinha estas funções/partes: celular, alternar.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 15 — `js/80-lab-base.js` (era `js/11-lab-base.js`, 148 linhas)

```text
Crie js/80-lab-base.js. Ele faz: LABORATÓRIO — 11-lab-base.js A peça que entende "quem chama quem" dentro do projeto importado. Usada pelo Mapa de ligações e pela Prévia. - HTML:  <script src>, <link href>, <img src>, <iframe src>, <a href="x.html">.
No app original ele tinha estas funções/partes: ehBinario, arquivos, binarios, lista, tipo, pasta, normalizar, raizComum, resolver, raizDoArquivo, resolverApelido, achar, tem, nomePacote, referencias, add, refsJS, mapa.
O original usava as bibliotecas x: em HTML puro, use a versão de CDN (ou faça sem ela, se for simples).
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 16 — `js/85-lab-mapa.js` (era `js/12-lab-mapa.js`, 147 linhas)

```text
Crie js/85-lab-mapa.js. Ele faz: LABORATÓRIO — 12-lab-mapa.js · 🗺️ MAPA DE LIGAÇÕES Escolhe um arquivo e vê: o que ele USA, quem USA ELE e os pacotes de fora. 📦 Extrair = o arquivo + tudo o que ele precisa, num zip (para guardar a lógica boa e levar para outro projeto). Mapa mental em Mermaid (.md).
No app original ele tinha estas funções/partes: tela, listar, detalhe, link, arvore, extrair, mermaid, relatorio, verCodigo, desmontar, previa, pesquisar, ver.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 17 — `js/90-lab-previa.js` (era `js/13-lab-previa.js`, 287 linhas)

```text
Crie js/90-lab-previa.js. Ele faz: LABORATÓRIO — 13-lab-previa.js · 🧪 PRÉVIA DE VÁRIOS ARQUIVOS Escolhe a página (ou o main.tsx/jsx/js) e ela monta TUDO que a página usa: - CSS, JS, imagens e módulos do projeto (cada um vira um endereço "blob") - .jsx/.tsx/.ts → convertidos na hora (Sucrase; reserva: Babel).
No app original ele tinha estas funções/partes: pegarConversor, temJSX, urlPacote, blobURL, urlBinario, urlDe, prepararJS, reescreverImports, ehTailwindCSS, prepararCSS, montarPagina, candidatos, tela, listarExtras, mostrarLog, mostrarConsole, rodar, rodarColado.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 18 — `js/91-lab-pesquisa.js` (era `js/14-lab-pesquisa.js`, 159 linhas)

```text
Crie js/91-lab-pesquisa.js. Ele faz: LABORATÓRIO — 14-lab-pesquisa.js · 🔎 PESQUISA DE VERDADE NO TERMINAL Comandos novos (precisam de internet; usam os sites públicos do npm e do jsDelivr): pesquisar <palavras>     → acha pacotes (também: npm search) info <pacote>            → versão, tamanho, licença, downloads, dependências (também: npm view).
No app original ele tinha estas funções/partes: mil, json, enc, semInternet, dados, pesquisar, info, cdn, comparar, col, linha, alternativas, substitutos, ajuda.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 19 — `js/92-lab-comparar.js` (era `js/15-lab-comparar.js`, 207 linhas)

```text
Crie js/92-lab-comparar.js. Ele faz: LABORATÓRIO — 15-lab-comparar.js · ⚖️ COMPARAR A × B 3 jeitos: 📁 Dois arquivos do projeto importado ✍️ Colar dois códigos.
No app original ele tinha estas funções/partes: diff, norm, trechos, htmlDiff, mdDiff, tela, opcoes, entrada, mostrar, arquivos, colados, semTopo, projetos, textoMD, baixarMD, copiarMD.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 20 — `js/93-15a-tar.js` (era `js/15a-tar.js`, 44 linhas)

```text
Crie js/93-15a-tar.js. Ele faz: tar.js — abre .tar.gz / .tgz / .taz / .tar (o formato que o Replit baixa) aqui mesmo, sem instalar nada. Devolve um JSZip com os mesmos arquivos, para o resto do app tratar igual a um .zip.
No app original ele tinha estas funções/partes: ehTar, descompactar, texto, octal, abrir.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 21 — `js/94-lab-ferramentas.js` (era `js/16-lab-ferramentas.js`, 81 linhas)

```text
Crie js/94-lab-ferramentas.js. Ele faz: LABORATÓRIO — 16-lab-ferramentas.js · 🧰 SUAS FERRAMENTAS NUM LUGAR SÓ Cada ferramenta abre aqui dentro (e continua guardando os dados dela). Versão em módulos: os arquivos ficam em ferramentas/ e kits/. Versão de arquivo único: vão embutidos (window.LAB_EMBUTIDO).
No app original ele tinha estas funções/partes: bytes, tela, cartao, achar, abrirAqui, telaPropria, kit.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 22 — `js/95-lab-termux.js` (era `js/17-lab-termux.js`, 221 linhas)

```text
Crie js/95-lab-termux.js. Ele faz: LABORATÓRIO — 17-lab-termux.js · 📱 TERMINAL DE VERDADE (Termux) A mesma ponte do Mini SK (que já funciona), trazida para cá: - liga o Laboratório ao Termux do celular (ttyd: ws://127.0.0.1:7681/ws) - ⬆ manda o projeto importado para ~/laboratorio/NOME no Termux.
No app original ele tinha estas funções/partes: status, carregarScript, carregarCss, prepararTela, escreverTela, enviar, tamanho, conectar, desconectar, copiar, nome, dentro, responder, corpo, andar, codigo, chamar, ping.
O original usava as bibliotecas http, fs, path, os: em HTML puro, use a versão de CDN (ou faça sem ela, se for simples).
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 23 — `js/96-lab-desmontar.js` (era `js/18-lab-desmontar.js`, 461 linhas)

```text
Crie js/96-lab-desmontar.js. Ele faz: LABORATÓRIO — 18-lab-desmontar.js · 🔪 DESMONTAR HTML (para aprender) Pega um HTML completo e: 👁 roda ao lado (com o console) 🧩 mostra as partes: estilos, códigos, CADA FUNÇÃO (o que faz, quem ela.
No app original ele tinha estas funções/partes: comPonte, explicar, lerJS, ehBiblioteca, nomesDoTopo, analisar, linhaDe, slug, picar, pad, nomeDoPedaco, dividirScript, secaoDe, pedaco, agrupar, rodarEm, ouvir, plano.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 24 — `js/97-juntar.js` (era `kits/juntar.py`, 67 linhas)

```text
Crie js/97-juntar.js. Ele faz: -*- coding: utf-8 -*-.
No app original ele tinha estas funções/partes: juntar, ler, css, img.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 25 — `js/98-kit-replit.js` (era `kits/kit-replit.cjs`, 168 linhas)

```text
Crie js/98-kit-replit.js. Ele faz: !/usr/bin/env node.
No app original ele tinha estas funções/partes: data, humano, rel, listar, lerJSON, examinar, TAB, crc32, criarZip, escreve, relatorio, pacoteLimpo, pacoteMontados, montarUm, pergunta.
O original usava as bibliotecas fs, path, zlib, readline, child_process: em HTML puro, use a versão de CDN (ou faça sem ela, se for simples).
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 26 — `js/98-organizar.js` (era `kits/organizar.py`, 466 linhas)

```text
Crie js/98-organizar.js. Ele faz: -*- coding: utf-8 -*-.
No app original ele tinha estas funções/partes: tipo_de, humano, onde, prioridade, ler_log, gravar_log, dentro, mover, resumo_hash, examinar, separar, arrumar_download, desfazer, revisar_info, apagar_copias, Pagina, log_message, responder.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 27 — `js/98-servir.js` (era `kits/servir.py`, 119 linhas)

```text
Crie js/98-servir.js. Ele faz: -*- coding: utf-8 -*-.
No app original ele tinha estas funções/partes: achar_site, porta_da_pasta, abrir_janela, main, Pagina, __init__, send_head, end_headers, log_message.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 28 — `js/98-ai-code-studio.js` (era `ferramentas/ai-code-studio.html`, 1721 linhas)

```text
Crie js/98-ai-code-studio.js. Ele faz: AI Code Studio — 🤖 AI Code Studio.
No app original ele tinha estas funções/partes: est, uid, isMobile, escapeHtml, copyText, activeConv, MODULE_Storage, save, saveSoon, load, normMemory, stamp, download, exportAll, importBackup, handleImport, MODULE_Provider, models.
Ele chamava estes endereços: https://api.anthropic.com/v1/messages, https://api.anthropic.com/v1/models?limit=100, https://google.serper.dev/search. Em HTML, ligue cada um à função equivalente do módulo certo.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 29 — `js/98-arrumador.js` (era `ferramentas/arrumador.html`, 404 linhas)

```text
Crie js/98-arrumador.js. Ele faz: Arrumador de Backups — 🗃 Arrumador de Backups.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 30 — `js/98-colador.js` (era `ferramentas/colador.html`, 776 linhas)

```text
Crie js/98-colador.js. Ele faz: Colador de Links — 🔗 Colador de Links.
No app original ele tinha estas funções/partes: uid, ler, gravar, nomeDe, pintar, fixar, tirar, mover, recarregar, pintarJanela, iniciar, montar, salvar, daLista, contar, pintarListas, caixaDe, quadro.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 31 — `js/98-faxina.js` (era `ferramentas/faxina.html`, 470 linhas)

```text
Crie js/98-faxina.js. Ele faz: 🧹 Faxina de Repetidos — 🧹 Faxina de Repetidos.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 32 — `js/98-iara-suite.js` (era `ferramentas/iara-suite.html`, 1536 linhas)

```text
Crie js/98-iara-suite.js. Ele faz: Iara Suite — Code Editor · APK Builder · Site Extractor — Olá, Mundo!.
No app original ele tinha estas funções/partes: qsa, lsSet, switchTab, detectProvider, getActiveSlot, updateAIStatus, openKeyModal, closeKeyModal, renderSlots, autoDetectSlot, toggleSlotActive, saveSlots, callAI, initEditor, renderFileList, fileIcon, openFile, onCodeChange.
O original usava as bibliotecas @capacitor/cli, electron, path, react-native, react-native-webview: em HTML puro, use a versão de CDN (ou faça sem ela, se for simples).
Ele chamava estes endereços: https://api.anthropic.com/v1/messages, https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent. Em HTML, ligue cada um à função equivalente do módulo certo.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 33 — `js/98-juntador.js` (era `ferramentas/juntador.html`, 437 linhas)

```text
Crie js/98-juntador.js. Ele faz: Juntador de Arquivos — 🧩 Juntador de Arquivos.
No app original ele tinha estas funções/partes: esc, uid, toast, ext, lang, isTexto, bytesFmt, linhas, decode, pareceBinario, b64, unb64, inflate, lerZip, CRC, crc32, escreverZip, textoDocx.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 34 — `js/98-numerador.js` (era `ferramentas/numerador.html`, 241 linhas)

```text
Crie js/98-numerador.js. Ele faz: Numerador de Códigos — 🔢 Numerador de Códigos.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 35 — `js/98-preparador.js` (era `ferramentas/preparador.html`, 833 linhas)

```text
Crie js/98-preparador.js. Ele faz: Preparador Universal — 🧰 Preparador Universal.
O original usava as bibliotecas electron, path, fs, http: em HTML puro, use a versão de CDN (ou faça sem ela, se for simples).
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 36 — `js/98-projeto-lab.js` (era `ferramentas/projeto-lab.html`, 2006 linhas)

```text
Crie js/98-projeto-lab.js. Ele faz: Projeto Lab.
No app original ele tinha estas funções/partes: esc, tick, fmtSize, fmtDate, normPath, dirname, basename, extOf, joinPath, hex, inflate, mask, lineFinder, parseLenientJSON, langOf, sniff, zipEntries, parsePax.
Ele chamava estes endereços: https://api.anthropic.com/v1/messages, https://api.anthropic.com/v1/models?limit=100. Em HTML, ligue cada um à função equivalente do módulo certo.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 37 — `js/98-replicador.js` (era `ferramentas/replicador.html`, 805 linhas)

```text
Crie js/98-replicador.js. Ele faz: Replicador de Projeto.
No app original ele tinha estas funções/partes: goTab, toggleFilePanel, loadZip, processZip, root, renderFileList, filterFiles, openFile, copyViewer, downloadViewer, sendFileToAI, renderAnalysis, buildPkgJson, buildCommands, buildTree, print, refreshModels, saveKey.
Ele chamava estes endereços: https://registry.npmjs.org/${encodeURIComponent(pkg)}/latest, ${bases[provider]}/chat/completions. Em HTML, ligue cada um à função equivalente do módulo certo.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 38 — `js/98-hub.js` (era `hub.html`, 81 linhas)

```text
Crie js/98-hub.js. Ele faz: Laboratorio-modular-c — Laboratorio-modular-c.
No app original ele tinha estas funções/partes: rec, esc, card, show.
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 39 — `js/98-inicio.js` (era `index.html`, 1687 linhas)

```text
Crie js/98-inicio.js. Ele faz: 🔬 Laboratório — 🔬 Laboratório.
Ele usa o que já foi criado em: js/15-casca.js, js/20-importar.js, js/25-dependencias.js, js/30-analisar.js, js/40-05a-markdown.js, js/35-plano.js, js/45-scripts.js, js/50-06b-scripts-fim.js, js/60-07a-busca-npm.js, js/55-terminal.js, js/65-exportar.js, js/70-integracao.js, js/75-celular.js, js/80-lab-base.js, js/85-lab-mapa.js, js/90-lab-previa.js, js/91-lab-pesquisa.js, js/93-15a-tar.js, js/92-lab-comparar.js, js/94-lab-ferramentas.js, js/95-lab-termux.js, js/96-lab-desmontar.js (pelo APP).
Registre com APP.registrar({ nome, icone, abrir }). Devolva só o arquivo completo.
```

### Passo 40 — `js/99-app.js` e conferir

```text
Crie js/99-app.js: ele olha APP.modulos e monta o menu/abas com um botão para cada módulo. Depois, me mande o index.html atualizado com todos os <script src="js/…"> na ordem certa: js/00-core.js, js/10-preload.js, js/15-casca.js, js/20-importar.js, js/25-dependencias.js, js/30-analisar.js, js/35-plano.js, js/40-05a-markdown.js, js/45-scripts.js, js/50-06b-scripts-fim.js, js/55-terminal.js, js/60-07a-busca-npm.js, js/65-exportar.js, js/70-integracao.js, js/75-celular.js, js/80-lab-base.js, js/85-lab-mapa.js, js/90-lab-previa.js, js/91-lab-pesquisa.js, js/92-lab-comparar.js, js/93-15a-tar.js, js/94-lab-ferramentas.js, js/95-lab-termux.js, js/96-lab-desmontar.js, js/97-juntar.js, js/98-kit-replit.js, js/98-organizar.js, js/98-servir.js, js/98-ai-code-studio.js, js/98-arrumador.js, js/98-colador.js, js/98-faxina.js, js/98-iara-suite.js, js/98-juntador.js, js/98-numerador.js, js/98-preparador.js, js/98-projeto-lab.js, js/98-replicador.js, js/98-hub.js, js/98-inicio.js, js/99-app.js.
```

## 5. Conferir no final

- [ ] Abrir o index.html na prévia: aparece a tela sem erro (▤ console vazio)?
- [ ] Cada botão abre a sua parte?
- [ ] Fechar e abrir de novo: os dados continuam?
- [ ] Nada com "replit", "REPL_", "@workspace" no código (🏗️ Preparar confere).
- [ ] 📱 PWA → deixar instalável; 📦 APK ou 🖥️ .exe.
