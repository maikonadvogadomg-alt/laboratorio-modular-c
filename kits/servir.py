# -*- coding: utf-8 -*-
"""
SERVIDORZINHO — abre QUALQUER app já montado do jeito que o Replit abre
(sem tela branca), com um comando só.

Como usar (terminal do Mini SK no PC, terminal do Windows, ou Termux no celular):
    python servir.py                 → procura o app na pasta onde ele está
    python servir.py  PASTA          → abre o app que está em PASTA
    python servir.py  PASTA  7800    → escolhe a porta

Ele procura o index.html em: PASTA, PASTA/www, PASTA/dist, PASTA/dist/public, PASTA/build, PASTA/out.
A porta é sempre a mesma para a mesma pasta → os dados do app ficam guardados.
Só o próprio aparelho acessa (127.0.0.1). Para desligar: Ctrl+C ou feche o terminal.
"""
import os, sys, socket, shutil, subprocess, threading, webbrowser, mimetypes
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)
except Exception:
    pass

for ext, tipo in {'.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
                  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.wasm': 'application/wasm',
                  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon'}.items():
    mimetypes.add_type(tipo, ext)

TERMUX = 'com.termux' in os.environ.get('PREFIX', '') or os.path.isdir('/data/data/com.termux')


def achar_site(base):
    for sub in ('', 'www', 'dist', os.path.join('dist', 'public'), 'build', 'out', 'public'):
        p = os.path.join(base, sub)
        if os.path.isfile(os.path.join(p, 'index.html')):
            # um index.html de CÓDIGO-FONTE (Vite antes do build) não serve: precisa do montado
            txt = open(os.path.join(p, 'index.html'), encoding='utf-8', errors='replace').read()
            if '/src/main.' in txt and sub in ('', 'public'):
                continue
            return p
    return None


def porta_da_pasta(p):
    h = 0
    for c in os.path.abspath(p):
        h = (h * 31 + ord(c)) & 0xFFFFFFFF
    return 7800 + h % 1000


def abrir_janela(end):
    if os.environ.get('SEM_ABRIR'):
        return
    if TERMUX:
        if os.system('termux-open-url "%s" >/dev/null 2>&1' % end) == 0:
            return
    for c in [shutil.which('msedge'), shutil.which('chrome'),
              r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
              r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
              r'C:\Program Files\Google\Chrome\Application\chrome.exe',
              os.path.expandvars(r'%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe')]:
        if c and os.path.isfile(c):
            try:
                subprocess.Popen([c, '--app=' + end, '--window-size=1200,850'])
                return
            except OSError:
                pass
    webbrowser.open(end)


def main():
    base = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
    site = achar_site(base)
    if not site:
        print('❌ Não achei o app MONTADO (index.html) em: ' + base)
        print('   Se for código-fonte (React/Vite), monte antes:  npm install  e depois  npm run build')
        print('   Depois rode de novo: python servir.py ' + (sys.argv[1] if len(sys.argv) > 1 else '.'))
        return
    porta = int(sys.argv[2]) if len(sys.argv) > 2 else int(os.environ.get('PORTA', porta_da_pasta(site)))
    end = 'http://127.0.0.1:%d/' % porta

    class Pagina(SimpleHTTPRequestHandler):
        def __init__(self, *a, **k):
            super().__init__(*a, directory=site, **k)

        def send_head(self):
            # endereço sem arquivo (ex.: /processos) → index.html. É o "forçar o index" do Replit/Netlify.
            if not os.path.exists(self.translate_path(self.path)) and '.' not in os.path.basename(self.path.split('?')[0]):
                self.path = '/index.html'
            return super().send_head()

        def end_headers(self):
            self.send_header('Cache-Control', 'no-cache')
            super().end_headers()

        def log_message(self, *a):
            pass

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        if s.connect_ex(('127.0.0.1', porta)) == 0:
            print('✅ Já estava ligado em ' + end + ' — abrindo de novo.')
            abrir_janela(end)
            return
    srv = ThreadingHTTPServer(('127.0.0.1', porta), Pagina)
    print('━' * 52)
    print('  🟢 LIGADO: ' + os.path.relpath(site, os.getcwd()))
    print('  Endereço: ' + end + '   (porta fixa desta pasta)')
    print('  Para desligar: Ctrl+C ou feche o terminal.')
    print('━' * 52)
    threading.Timer(0.6, abrir_janela, args=(end,)).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print('\nDesligado. 👋')


if __name__ == '__main__':
    main()
