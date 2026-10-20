# -*- coding: utf-8 -*-
"""
ORGANIZADOR DO CELULAR DO MAIKON — roda no Termux (Android).

O que faz (NADA é apagado sozinho):
  1. 🔍 Examina o celular e mostra onde está o espaço (fotos, vídeos, WhatsApp, PDFs…).
  2. ♊ Acha ARQUIVOS REPETIDOS de verdade (conteúdo idêntico, byte por byte),
     mesmo com nomes diferentes. Mostra qual fica e quais são cópias.
  3. 📦 Tira as cópias da frente: MOVE para a pasta  _REVISAR  (não apaga).
     Tudo tem ↩ Desfazer.
  4. 🗂 Arruma a pasta Download em subpastas (PDFs, Imagens, Vídeos, APKs…).
  5. 🗑 Só quando você quiser: apaga as CÓPIAS que estão em _REVISAR
     (precisa escrever APAGAR). O original sempre fica.

Como usar:   python ~/organizar.py      (ou só:  organizar )
Para fechar: Ctrl+C  (ou feche o Termux)
"""
import os, sys, json, time, random, hashlib, shutil, threading, urllib.parse
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler

VERSAO = '18/10-a'
TESTE = len(sys.argv) > 1 and sys.argv[1].lower().startswith('test')
PORTA = int(os.environ.get('PORTA', '8091' if TESTE else '8090'))
BASE = os.path.realpath(os.environ.get('BASE', os.path.expanduser('~/storage/shared' + ('/TesteBackup' if TESTE else ''))))
REVISAR = os.path.join(BASE, '_REVISAR')
ARQ_LOG = os.path.join(REVISAR, 'registro-do-organizador.json')
CODIGO = os.environ.get('CODIGO') or str(random.randint(100000, 999999))
# o Android não deixa ler estas; miniaturas e lixeira não interessam
PULAR = {'Android/data', 'Android/obb', '_REVISAR', 'lost+found'}
MIN_REPETIDO = 4 * 1024          # arquivos menores que 4 KB não entram nos repetidos (é só bobagem)

TIPOS = {
    'fotos':   ('📷 Fotos e imagens', {'jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'gif', 'bmp'}),
    'videos':  ('🎬 Vídeos', {'mp4', 'mkv', '3gp', 'mov', 'avi', 'webm', 'm4v'}),
    'audios':  ('🎙 Áudios', {'opus', 'mp3', 'm4a', 'aac', 'ogg', 'wav', 'amr', 'flac'}),
    'pdfs':    ('📄 PDFs', {'pdf'}),
    'docs':    ('📝 Documentos (Word, planilhas…)', {'doc', 'docx', 'odt', 'rtf', 'txt', 'xls', 'xlsx', 'ods', 'csv', 'ppt', 'pptx', 'md'}),
    'apks':    ('📦 Instaladores (APK)', {'apk', 'apks', 'xapk'}),
    'zips':    ('🗜 Compactados (zip, rar…)', {'zip', 'rar', '7z', 'tar', 'gz'}),
    'codigos': ('💻 Códigos (html, js…)', {'html', 'htm', 'js', 'ts', 'tsx', 'css', 'json', 'py', 'yml', 'yaml'}),
}
PASTA_DO_TIPO = {'fotos': 'Imagens', 'videos': 'Videos', 'audios': 'Audios', 'pdfs': 'PDFs', 'docs': 'Documentos',
                 'apks': 'APKs', 'zips': 'Compactados', 'codigos': 'Codigos', 'outros': 'Outros'}
EXT_TIPO = {e: t for t, (_, es) in TIPOS.items() for e in es}

def tipo_de(nome):
    return EXT_TIPO.get(nome.rsplit('.', 1)[-1].lower() if '.' in nome else '', 'outros')

def humano(n):
    for u in ('bytes', 'KB', 'MB', 'GB'):
        if n < 1024 or u == 'GB':
            return (f'{n:.0f} {u}' if u == 'bytes' else f'{n:.1f} {u}').replace('.', ',')
        n /= 1024

def onde(rel):
    """Nome amigável do lugar do arquivo."""
    r = rel.lower()
    if 'com.whatsapp' in r or r.startswith('whatsapp/'): return '💬 WhatsApp'
    if 'telegram' in r: return '✈️ Telegram'
    if r.startswith('dcim/'): return '📷 Câmera'
    if r.startswith('pictures/'): return '🖼 Imagens/Prints'
    if r.startswith('download/'): return '⬇️ Download'
    if r.startswith('documents/'): return '📁 Documentos'
    if r.startswith('movies/'): return '🎬 Filmes'
    if r.startswith('music/'): return '🎵 Música'
    return '📂 ' + rel.split('/')[0]

def prioridade(rel):
    """Qual cópia FICA: a de lugar mais 'seu' (Câmera, Documentos) ganha da do WhatsApp/Download."""
    r = rel.lower()
    ordem = [('dcim/camera', 0), ('documents/', 1), ('dcim/', 2), ('pictures/', 3), ('movies/', 4), ('music/', 4),
             ('download/', 7), ('telegram', 8), ('whatsapp', 9)]
    for p, v in ordem:
        if p in r: return (v, r.count('/'), len(r))
    return (5, r.count('/'), len(r))

# ───────────────────────── registro do que foi mexido (para o ↩ Desfazer) ─────────────────────────
trava = threading.Lock()
def ler_log():
    try:
        with open(ARQ_LOG, encoding='utf-8') as f: return json.load(f)
    except Exception:
        return {'movidos': []}
def gravar_log(lg):
    os.makedirs(REVISAR, exist_ok=True)
    tmp = ARQ_LOG + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f: json.dump(lg, f, ensure_ascii=False, indent=0)
    os.replace(tmp, ARQ_LOG)

def dentro(rel):
    """Caminho completo, garantindo que fica DENTRO do celular (nada fora)."""
    p = os.path.realpath(os.path.join(BASE, rel))
    if p != BASE and not p.startswith(BASE + os.sep): raise ValueError('caminho fora do celular')
    return p

def mover(origem_rel, destino_rel, motivo, lg):
    o, d = dentro(origem_rel), dentro(destino_rel)
    if not os.path.isfile(o): return False
    base, ext = os.path.splitext(d); i = 2
    while os.path.exists(d):                                   # nunca escreve por cima de nada
        d = f'{base} ({i}){ext}'; i += 1
    os.makedirs(os.path.dirname(d), exist_ok=True)
    shutil.move(o, d)
    lg['movidos'].append({'de': origem_rel, 'para': os.path.relpath(d, BASE).replace(os.sep, '/'), 'motivo': motivo, 'quando': time.time()})
    return True

# ───────────────────────── o exame ─────────────────────────
estado = {'rodando': False, 'fase': '', 'feito': 0, 'total': 0, 'resultado': None, 'erro': ''}

def resumo_hash(caminho, tam, inteiro=False):
    h = hashlib.sha1()
    with open(caminho, 'rb') as f:
        if inteiro or tam <= 256 * 1024:
            for bloco in iter(lambda: f.read(1024 * 1024), b''): h.update(bloco)
        else:
            h.update(f.read(64 * 1024)); f.seek(tam // 2); h.update(f.read(64 * 1024)); f.seek(-64 * 1024, 2); h.update(f.read(64 * 1024))
    return h.hexdigest()

def examinar():
    try:
        estado.update(rodando=True, fase='Contando os arquivos…', feito=0, total=0, erro='', resultado=None)
        arquivos = []                                         # (rel, tam, data)
        for raiz, pastas, nomes in os.walk(BASE):
            rel_raiz = os.path.relpath(raiz, BASE).replace(os.sep, '/')
            rel_raiz = '' if rel_raiz == '.' else rel_raiz
            pastas[:] = [p for p in pastas if not p.startswith('.') and (rel_raiz + '/' + p).lstrip('/') not in PULAR]
            for n in nomes:
                if n.startswith('.'): continue
                rel = (rel_raiz + '/' + n).lstrip('/')
                try: st = os.stat(os.path.join(raiz, n))
                except Exception: continue
                arquivos.append((rel, st.st_size, st.st_mtime))
            estado['feito'] = len(arquivos)
        total = sum(t for _, t, _ in arquivos)

        # por tipo e por pasta
        por_tipo = {}
        for rel, t, _ in arquivos:
            k = tipo_de(rel); a = por_tipo.setdefault(k, [0, 0]); a[0] += 1; a[1] += t
        por_pasta = {}
        for rel, t, _ in arquivos:
            partes = rel.split('/')
            chave = '/'.join(partes[:2]) if len(partes) > 2 else (partes[0] if len(partes) > 1 else '(soltos na raiz)')
            if 'com.whatsapp/WhatsApp/Media/' in rel: chave = 'WhatsApp › ' + rel.split('com.whatsapp/WhatsApp/Media/')[1].split('/')[0]
            a = por_pasta.setdefault(chave, [0, 0]); a[0] += 1; a[1] += t

        # repetidos: mesmo tamanho → mesma "amostra" → mesmo conteúdo inteiro
        por_tam = {}
        for rel, t, d in arquivos:
            if t >= MIN_REPETIDO: por_tam.setdefault(t, []).append((rel, d))
        candidatos = [(t, l) for t, l in por_tam.items() if len(l) > 1]
        estado.update(fase='Procurando repetidos…', feito=0, total=sum(len(l) for _, l in candidatos))
        grupos = []
        for t, lista in candidatos:
            amostra = {}
            for rel, d in lista:
                try: amostra.setdefault(resumo_hash(os.path.join(BASE, rel), t), []).append((rel, d))
                except Exception: pass
                estado['feito'] += 1
            for l2 in amostra.values():
                if len(l2) < 2: continue
                inteiro = {}
                for rel, d in l2:
                    try: inteiro.setdefault(resumo_hash(os.path.join(BASE, rel), t, True), []).append((rel, d))
                    except Exception: pass
                for h, l3 in inteiro.items():
                    if len(l3) < 2: continue
                    l3.sort(key=lambda x: prioridade(x[0]))
                    grupos.append({'id': h[:16], 'tam': t, 'tipo': tipo_de(l3[0][0]),
                                   'arquivos': [{'p': r, 'onde': onde(r), 'data': d} for r, d in l3]})
        grupos.sort(key=lambda g: -g['tam'] * (len(g['arquivos']) - 1))
        sobra = sum(g['tam'] * (len(g['arquivos']) - 1) for g in grupos)

        grandes = sorted(arquivos, key=lambda x: -x[1])[:120]
        download = [(r, t, d) for r, t, d in arquivos if r.lower().startswith('download/') and r.count('/') == 1]
        apks = sorted([(r, t, d) for r, t, d in arquivos if tipo_de(r) == 'apks'], key=lambda x: -x[1])
        try:
            sv = os.statvfs(BASE); livre, cap = sv.f_bavail * sv.f_frsize, sv.f_blocks * sv.f_frsize
        except Exception:
            livre = cap = 0
        estado['resultado'] = {
            'quando': time.time(), 'n': len(arquivos), 'total': total, 'livre': livre, 'cap': cap,
            'tipos': sorted([{'k': k, 'nome': TIPOS.get(k, ('📎 Outros',))[0], 'n': v[0], 'tam': v[1]} for k, v in por_tipo.items()], key=lambda x: -x['tam']),
            'pastas': sorted([{'nome': k, 'n': v[0], 'tam': v[1]} for k, v in por_pasta.items()], key=lambda x: -x['tam'])[:40],
            'grupos': grupos[:3000], 'sobra': sobra, 'n_grupos': len(grupos),
            'grandes': [{'p': r, 'tam': t, 'data': d, 'onde': onde(r), 'tipo': tipo_de(r)} for r, t, d in grandes],
            'download': {'n': len(download), 'tam': sum(t for _, t, _ in download)},
            'apks': [{'p': r, 'tam': t, 'data': d, 'onde': onde(r)} for r, t, d in apks[:300]],
        }
        estado['fase'] = 'Pronto'
        print(f'🔍 Exame pronto: {len(arquivos)} arquivos ({humano(total)}), {len(grupos)} grupos de repetidos ({humano(sobra)} sobrando).')
    except Exception as e:
        estado['erro'] = str(e); print('❌ Erro no exame:', e)
    finally:
        estado['rodando'] = False

# ───────────────────────── ações ─────────────────────────
def separar(grupos):
    """grupos: [{'manter': rel, 'tirar': [rel…]}] → move as cópias para _REVISAR/Repetidos (confere de novo antes)."""
    n = b = 0; avisos = []
    with trava:
        lg = ler_log()
        for g in grupos:
            try:
                fica = dentro(g['manter'])
                if not os.path.isfile(fica): avisos.append('Sumiu: ' + g['manter']); continue
                t = os.path.getsize(fica); h = resumo_hash(fica, t, True)
                for rel in g.get('tirar', []):
                    if rel == g['manter']: continue
                    c = dentro(rel)
                    if not os.path.isfile(c) or os.path.getsize(c) != t or resumo_hash(c, t, True) != h:
                        avisos.append('Não é mais igual, deixei onde estava: ' + rel); continue
                    if mover(rel, '_REVISAR/Repetidos/' + rel, 'repetido de ' + g['manter'], lg): n += 1; b += t
            except Exception as e:
                avisos.append(str(e))
        gravar_log(lg)
    print(f'📦 {n} cópias separadas em _REVISAR/Repetidos ({humano(b)}).')
    return {'n': n, 'h': humano(b), 'avisos': avisos[:20]}

def arrumar_download(aplicar):
    pasta = None
    for nome in ('Download', 'download', 'Downloads'):
        if os.path.isdir(os.path.join(BASE, nome)): pasta = nome; break
    if not pasta: return {'n': 0, 'plano': {}, 'erro': 'Não achei a pasta Download.'}
    plano = {}
    for n in sorted(os.listdir(os.path.join(BASE, pasta))):
        c = os.path.join(BASE, pasta, n)
        if n.startswith('.') or not os.path.isfile(c): continue
        plano.setdefault(PASTA_DO_TIPO[tipo_de(n)], []).append(n)
    if not aplicar:
        return {'n': sum(len(v) for v in plano.values()), 'plano': {k: len(v) for k, v in plano.items()}}
    n = 0
    with trava:
        lg = ler_log()
        for sub, nomes in plano.items():
            for nome in nomes:
                if mover(f'{pasta}/{nome}', f'{pasta}/{sub}/{nome}', 'arrumar Download', lg): n += 1
        gravar_log(lg)
    print(f'🗂 Download arrumada: {n} arquivos em subpastas.')
    return {'n': n, 'plano': {k: len(v) for k, v in plano.items()}}

def desfazer():
    n = 0; falhas = 0
    with trava:
        lg = ler_log(); resta = []
        for m in reversed(lg['movidos']):
            try:
                if os.path.isfile(dentro(m['para'])) and not os.path.exists(dentro(m['de'])):
                    os.makedirs(os.path.dirname(dentro(m['de'])), exist_ok=True)
                    shutil.move(dentro(m['para']), dentro(m['de'])); n += 1
                elif os.path.isfile(dentro(m['para'])):
                    falhas += 1; resta.append(m)
            except Exception:
                falhas += 1; resta.append(m)
        lg['movidos'] = list(reversed(resta)); gravar_log(lg)
    print(f'↩ Desfeito: {n} arquivos voltaram para o lugar.')
    return {'n': n, 'falhas': falhas}

def revisar_info():
    lg = ler_log(); rep = [m for m in lg['movidos'] if m['motivo'].startswith('repetido') and os.path.isfile(os.path.join(BASE, m['para']))]
    return {'repetidos': len(rep), 'tam': humano(sum(os.path.getsize(os.path.join(BASE, m['para'])) for m in rep)),
            'movidos': len(lg['movidos'])}

def apagar_copias():
    """Apaga SÓ as cópias que estão em _REVISAR/Repetidos e cujo original ainda existe igualzinho."""
    n = b = 0; guardadas = 0
    with trava:
        lg = ler_log(); resta = []
        for m in lg['movidos']:
            if not m['motivo'].startswith('repetido de '): resta.append(m); continue
            copia = os.path.join(BASE, m['para']); orig = os.path.join(BASE, m['motivo'][len('repetido de '):])
            try:
                if not os.path.isfile(copia): continue
                t = os.path.getsize(copia)
                if os.path.isfile(orig) and os.path.getsize(orig) == t and resumo_hash(orig, t, True) == resumo_hash(copia, t, True):
                    os.remove(copia); n += 1; b += t
                else:
                    guardadas += 1; resta.append(m)       # o original mudou ou sumiu: esta cópia NÃO é apagada
            except Exception:
                resta.append(m)
        lg['movidos'] = resta; gravar_log(lg)
        for raiz, pastas, nomes in os.walk(os.path.join(REVISAR, 'Repetidos'), topdown=False):
            try:
                if not os.listdir(raiz): os.rmdir(raiz)
            except Exception: pass
    print(f'🗑 Apagadas {n} cópias ({humano(b)}). {guardadas} guardadas porque o original mudou ou sumiu.')
    return {'n': n, 'h': humano(b), 'guardadas': guardadas}

# ───────────────────────── a página ─────────────────────────
class Pagina(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def responder(self, cod, obj, tipo='application/json; charset=utf-8'):
        corpo = obj if isinstance(obj, bytes) else (json.dumps(obj, ensure_ascii=False).encode() if not isinstance(obj, str) else obj.encode())
        self.send_response(cod); self.send_header('Content-Type', tipo); self.send_header('Content-Length', str(len(corpo)))
        self.send_header('Cache-Control', 'no-store'); self.end_headers(); self.wfile.write(corpo)
    def ok_codigo(self, q):
        return q.get('c', [''])[0] == CODIGO or self.headers.get('X-Codigo') == CODIGO
    def do_GET(self):
        u = urllib.parse.urlparse(self.path); q = urllib.parse.parse_qs(u.query)
        if not self.ok_codigo(q): return self.responder(403, '<h2>Abra pelo endereço que apareceu no Termux.</h2>', 'text/html; charset=utf-8')
        if u.path == '/': return self.responder(200, HTML.replace('__CODIGO__', CODIGO).replace('__VERSAO__', VERSAO), 'text/html; charset=utf-8')
        if u.path == '/estado':
            e = dict(estado); e['resultado'] = None; e['tem'] = estado['resultado'] is not None; return self.responder(200, e)
        if u.path == '/resultado': return self.responder(200, estado['resultado'] or {})
        if u.path == '/revisar': return self.responder(200, revisar_info())
        if u.path == '/ver':
            try:
                c = dentro(q.get('p', [''])[0])
                if tipo_de(c) != 'fotos' or os.path.getsize(c) > 25 * 1024 * 1024: return self.responder(404, {})
                with open(c, 'rb') as f: dados = f.read()
                ext = c.rsplit('.', 1)[-1].lower(); return self.responder(200, dados, 'image/' + ('jpeg' if ext == 'jpg' else ext))
            except Exception:
                return self.responder(404, {})
        self.responder(404, {})
    def do_POST(self):
        u = urllib.parse.urlparse(self.path); q = urllib.parse.parse_qs(u.query)
        if not self.ok_codigo(q): return self.responder(403, {'erro': 'código errado'})
        try: d = json.loads(self.rfile.read(int(self.headers.get('Content-Length') or 0)) or b'{}')
        except Exception: d = {}
        if u.path == '/examinar':
            if not estado['rodando']: threading.Thread(target=examinar, daemon=True).start()
            return self.responder(200, {'ok': True})
        if estado['rodando']: return self.responder(409, {'erro': 'Espere o exame terminar.'})
        if u.path == '/separar': return self.responder(200, separar(d.get('grupos', [])))
        if u.path == '/download': return self.responder(200, arrumar_download(bool(d.get('aplicar'))))
        if u.path == '/desfazer': return self.responder(200, desfazer())
        if u.path == '/apagar':
            if d.get('palavra') != 'APAGAR': return self.responder(400, {'erro': 'Escreva APAGAR para confirmar.'})
            return self.responder(200, apagar_copias())
        self.responder(404, {})

HTML = r'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Organizador do Celular</title>
<style>
:root{--f:#f6f4ef;--c:#fff;--t:#1d1d1b;--m:#6b6a65;--b:#e2dfd6;--v:#2f6b3a;--vc:#e6f1e7;--a:#a15c00;--ac:#fbefdc;--r:#a8322a;--rc:#f8e4e1}
@media (prefers-color-scheme:dark){:root{--f:#171715;--c:#22221f;--t:#ecebe6;--m:#a3a199;--b:#38372f;--v:#7fc28a;--vc:#1f3323;--a:#e0a64f;--ac:#3a2c17;--r:#ef8a80;--rc:#3d201d}}
*{box-sizing:border-box}body{margin:0;background:var(--f);color:var(--t);font:17px/1.45 system-ui,-apple-system,Roboto,sans-serif;padding:0 14px 90px}
h1{font-size:21px;margin:16px 0 4px}h2{font-size:18px;margin:0 0 8px}.mut{color:var(--m)}.peq{font-size:14px}
.cartao{background:var(--c);border:1px solid var(--b);border-radius:14px;padding:14px;margin:12px 0}
button{font:inherit;border-radius:12px;border:1px solid var(--b);background:var(--c);color:var(--t);padding:12px 14px;min-height:48px;cursor:pointer}
button.forte{background:var(--v);border-color:var(--v);color:#fff;font-weight:600}button.perigo{color:var(--r);border-color:var(--r)}
button:disabled{opacity:.5}.largo{width:100%}.linha{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.abas{display:flex;gap:6px;overflow-x:auto;position:sticky;top:0;background:var(--f);padding:10px 0;z-index:2}
.abas button{white-space:nowrap;min-height:42px;padding:8px 12px}.abas button.on{background:var(--t);color:var(--f);border-color:var(--t)}
.barra{height:10px;background:var(--b);border-radius:6px;overflow:hidden}.barra>i{display:block;height:100%;background:var(--v)}
.item{display:flex;gap:10px;align-items:center;padding:9px 0;border-top:1px solid var(--b)}.item:first-child{border-top:0}
.cresce{flex:1;min-width:0}.nome{overflow-wrap:anywhere}.grande{font-size:26px;font-weight:700}
.grupo{border:1px solid var(--b);border-radius:12px;padding:10px;margin:10px 0}.grupo.sel{border-color:var(--v);background:var(--vc)}
.arq{display:flex;gap:8px;align-items:center;padding:6px 0;font-size:15px}.arq img{width:54px;height:54px;object-fit:cover;border-radius:8px;flex:none}
.fica{color:var(--v);font-weight:600}.sai{color:var(--a);font-weight:600}
.aviso{background:var(--ac);border-radius:12px;padding:12px;margin:10px 0}.bom{background:var(--vc);border-radius:12px;padding:12px;margin:10px 0}
.rodape{position:fixed;left:0;right:0;bottom:0;background:var(--c);border-top:1px solid var(--b);padding:10px 14px;display:none}
input[type=checkbox]{width:24px;height:24px;flex:none}input[type=text]{font:inherit;padding:12px;border-radius:12px;border:1px solid var(--b);width:100%;background:var(--f);color:var(--t)}
#msg{position:fixed;left:14px;right:14px;top:12px;padding:12px;border-radius:12px;background:var(--t);color:var(--f);display:none;z-index:9}
</style></head><body>
<div id="msg"></div>
<h1>🧹 Organizador do Celular</h1><p class="mut peq">Versão __VERSAO__ · Nada é apagado sozinho. Tudo que é movido tem ↩ Desfazer.</p>
<div class="cartao" id="inicio"><h2>1. Examinar o celular</h2><p class="peq mut">Olha todos os arquivos (pode levar alguns minutos). Não mexe em nada.</p>
<button class="forte largo" id="bt-examinar">🔍 Examinar agora</button><div id="progresso" class="peq mut" style="margin-top:8px"></div></div>
<div id="telas" hidden>
<div class="abas"><button data-aba="resumo" class="on">📊 Resumo</button><button data-aba="repetidos">♊ Repetidos</button><button data-aba="grandes">🐘 Grandes</button><button data-aba="apks">📦 APKs</button><button data-aba="download">⬇️ Download</button><button data-aba="revisar">🗑 _REVISAR</button></div>
<div id="aba"></div></div>
<div class="rodape" id="rodape"><button class="forte largo" id="bt-separar"></button></div>
<script>
const C='__CODIGO__';let R=null,aba='resumo',marcados=new Set(),fica={},vis=40;
const $=s=>document.querySelector(s);
const H=n=>{const u=['bytes','KB','MB','GB'];let i=0;while(n>=1024&&i<3){n/=1024;i++}return(i?n.toFixed(1):n).toString().replace('.',',')+' '+u[i]};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const data=t=>new Date(t*1000).toLocaleDateString('pt-BR');
function aviso(t){const m=$('#msg');m.textContent=t;m.style.display='block';clearTimeout(aviso.t);aviso.t=setTimeout(()=>m.style.display='none',4500)}
async function api(c,d){const r=await fetch(c+(c.includes('?')?'&':'?')+'c='+C,d===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.erro||'erro '+r.status);return j}
$('#bt-examinar').onclick=async()=>{$('#bt-examinar').disabled=true;await api('/examinar',{});acompanhar()};
async function acompanhar(){const e=await api('/estado');
 $('#progresso').textContent=e.rodando?('⏳ '+e.fase+' '+(e.total?e.feito+' de '+e.total:e.feito+' arquivos')):(e.erro?'❌ '+e.erro:'');
 if(e.rodando)return setTimeout(acompanhar,1000);$('#bt-examinar').disabled=false;
 if(e.tem){R=await api('/resultado');marcados.clear();fica={};$('#bt-examinar').textContent='🔍 Examinar de novo';$('#telas').hidden=false;pintar()}}
document.querySelectorAll('[data-aba]').forEach(b=>b.onclick=()=>{aba=b.dataset.aba;vis=40;document.querySelectorAll('[data-aba]').forEach(x=>x.classList.toggle('on',x===b));pintar()});
function pintar(){const f={resumo,repetidos,grandes,apks,download,revisar}[aba];$('#aba').innerHTML='';f();rodape()}
function resumo(){const usado=R.cap?R.cap-R.livre:R.total;
 let h='<div class="cartao"><h2>Espaço do celular</h2>'+(R.cap?'<div class="barra"><i style="width:'+Math.round(usado/R.cap*100)+'%"></i></div><p><b>'+H(R.livre)+' livres</b> de '+H(R.cap)+'</p>':'')+
 '<p class="peq mut">'+R.n.toLocaleString('pt-BR')+' arquivos seus somam '+H(R.total)+'.</p>'+
 (R.n_grupos?'<div class="aviso">♊ Achei <b>'+R.n_grupos+' grupos de arquivos repetidos</b>. As cópias ocupam <b>'+H(R.sobra)+'</b> à toa. Veja na aba ♊ Repetidos.</div>':'<div class="bom">✅ Nenhum arquivo repetido.</div>')+'</div>';
 h+='<div class="cartao"><h2>Por tipo</h2>'+R.tipos.map(t=>'<div class="item"><div class="cresce">'+t.nome+'<div class="barra"><i style="width:'+Math.max(1,Math.round(t.tam/R.total*100))+'%"></i></div></div><div><b>'+H(t.tam)+'</b><div class="peq mut">'+t.n+' arq.</div></div></div>').join('')+'</div>';
 h+='<div class="cartao"><h2>Pastas que mais ocupam</h2>'+R.pastas.slice(0,25).map(p=>'<div class="item"><div class="cresce nome">'+esc(p.nome)+'<div class="peq mut">'+p.n+' arquivos</div></div><b>'+H(p.tam)+'</b></div>').join('')+'</div>';
 $('#aba').innerHTML=h}
function quemFica(g){return fica[g.id]||g.arquivos[0].p}
function repetidos(){if(!R.grupos.length){$('#aba').innerHTML='<div class="bom">✅ Nenhum repetido.</div>';return}
 let h='<div class="cartao"><p class="peq">Cada grupo abaixo tem arquivos <b>exatamente iguais</b> (conferido byte por byte). <span class="fica">✅ FICA</span> = o que continua no lugar. <span class="sai">📦 cópia</span> = vai para a pasta <b>_REVISAR</b> (não apaga). Toque num arquivo para escolher qual fica.</p>'+
 '<div class="linha"><button id="tudo">☑ Marcar todos</button><button id="nada">☐ Desmarcar</button></div><p class="peq mut">Mostrando os que mais ocupam primeiro. Se o arquivo do WhatsApp sair, a conversa mostra "arquivo não encontrado", mas a cópia continua guardada no outro lugar.</p></div>';
 h+=R.grupos.slice(0,vis).map(g=>{const f=quemFica(g),n=g.arquivos.length-1;
  return '<div class="grupo'+(marcados.has(g.id)?' sel':'')+'"><label class="linha"><input type="checkbox" data-g="'+g.id+'"'+(marcados.has(g.id)?' checked':'')+'><b class="cresce">'+n+' cópia'+(n>1?'s':'')+' · '+H(g.tam*n)+' à toa</b></label>'+
  g.arquivos.map(a=>'<div class="arq" data-fica="'+g.id+'" data-p="'+esc(a.p)+'">'+(g.tipo==='fotos'?'<img loading="lazy" src="/ver?c='+C+'&p='+encodeURIComponent(a.p)+'" alt="">':'')+'<div class="cresce"><span class="'+(a.p===f?'fica">✅ FICA':'sai">📦 cópia')+'</span> · '+a.onde+'<div class="nome peq mut">'+esc(a.p)+' · '+data(a.data)+'</div></div></div>').join('')+'</div>'}).join('');
 if(R.grupos.length>vis)h+='<button class="largo" id="mais">Mostrar mais ('+(R.grupos.length-vis)+' grupos)</button>';
 $('#aba').innerHTML=h;
 $('#tudo').onclick=()=>{R.grupos.forEach(g=>marcados.add(g.id));pintar()};$('#nada').onclick=()=>{marcados.clear();pintar()};
 if($('#mais'))$('#mais').onclick=()=>{vis+=60;pintar()};
 document.querySelectorAll('[data-g]').forEach(c=>c.onchange=()=>{c.checked?marcados.add(c.dataset.g):marcados.delete(c.dataset.g);c.closest('.grupo').classList.toggle('sel',c.checked);rodape()});
 document.querySelectorAll('[data-fica]').forEach(d=>d.onclick=()=>{fica[d.dataset.fica]=d.dataset.p;const y=scrollY;pintar();scrollTo(0,y)})}
function rodape(){const g=R?R.grupos.filter(x=>marcados.has(x.id)):[];const ver=aba==='repetidos'&&g.length;$('#rodape').style.display=ver?'block':'none';
 if(ver)$('#bt-separar').textContent='📦 Separar '+g.reduce((s,x)=>s+x.arquivos.length-1,0)+' cópias ('+H(g.reduce((s,x)=>s+x.tam*(x.arquivos.length-1),0))+')'}
$('#bt-separar').onclick=async()=>{const gs=R.grupos.filter(x=>marcados.has(x.id)).map(g=>{const f=quemFica(g);return{manter:f,tirar:g.arquivos.map(a=>a.p).filter(p=>p!==f)}});
 if(!confirm('Mover '+gs.reduce((s,g)=>s+g.tirar.length,0)+' cópias para a pasta _REVISAR?\n\nO original de cada uma FICA no lugar. Nada é apagado. Dá para desfazer.'))return;
 $('#bt-separar').disabled=true;try{const r=await api('/separar',{grupos:gs});aviso('📦 '+r.n+' cópias separadas ('+r.h+'). Estão em _REVISAR.');if(r.avisos.length)alert(r.avisos.join('\n'));
 const tirados=new Set(gs.flatMap(g=>g.tirar));R.grupos=R.grupos.filter(g=>!marcados.has(g.id));R.n_grupos=R.grupos.length;R.sobra=R.grupos.reduce((s,g)=>s+g.tam*(g.arquivos.length-1),0);marcados.clear();pintar()}catch(e){aviso('❌ '+e.message)}$('#bt-separar').disabled=false};
function grandes(){$('#aba').innerHTML='<div class="cartao"><h2>🐘 Os maiores arquivos</h2><p class="peq mut">Só para você ver. Aqui não tem botão de apagar: decida com calma.</p>'+R.grandes.slice(0,vis).map(a=>'<div class="item"><div class="cresce"><div class="nome">'+esc(a.p.split('/').pop())+'</div><div class="peq mut nome">'+a.onde+' · '+data(a.data)+' · '+esc(a.p)+'</div></div><b>'+H(a.tam)+'</b></div>').join('')+'</div>'+(R.grandes.length>vis?'<button class="largo" id="mais">Mostrar mais</button>':'');if($('#mais'))$('#mais').onclick=()=>{vis+=60;pintar()}}
function apks(){$('#aba').innerHTML='<div class="cartao"><h2>📦 Instaladores (APK)</h2><p class="peq mut">Depois que o app já está instalado, o arquivo .apk normalmente não serve mais. Confira antes, principalmente os seus apps feitos no GitHub/Replit.</p>'+(R.apks.length?R.apks.map(a=>'<div class="item"><div class="cresce"><div class="nome">'+esc(a.p.split('/').pop())+'</div><div class="peq mut nome">'+a.onde+' · '+data(a.data)+'</div></div><b>'+H(a.tam)+'</b></div>').join(''):'<p>Nenhum APK.</p>')+'</div>'}
async function download(){$('#aba').innerHTML='<div class="cartao">⏳ Olhando a pasta Download…</div>';const r=await api('/download',{aplicar:false});
 if(r.erro){$('#aba').innerHTML='<div class="aviso">'+r.erro+'</div>';return}
 $('#aba').innerHTML='<div class="cartao"><h2>⬇️ Arrumar a pasta Download</h2><p class="peq">Tem <b>'+r.n+' arquivos soltos</b> na Download. Eles vão para subpastas dentro dela mesma:</p>'+Object.entries(r.plano).map(([k,v])=>'<div class="item"><span class="cresce">📁 Download/'+k+'</span><b>'+v+'</b></div>').join('')+'<p class="peq mut">Não apaga nada. Dá para desfazer na aba 🗑 _REVISAR.</p><button class="forte largo" id="arrumar"'+(r.n?'':' disabled')+'>🗂 Arrumar agora</button></div>';
 $('#arrumar').onclick=async()=>{if(!confirm('Arrumar '+r.n+' arquivos da Download em subpastas?'))return;const x=await api('/download',{aplicar:true});aviso('🗂 '+x.n+' arquivos arrumados.');download()}}
async function revisar(){const r=await api('/revisar');
 $('#aba').innerHTML='<div class="cartao"><h2>🗑 Pasta _REVISAR</h2><p>Lá estão <b>'+r.repetidos+' cópias repetidas</b> ('+r.tam+'). Ela fica na raiz do celular: abra no gerenciador de arquivos para conferir.</p>'+
 '<div class="aviso peq">Mover para _REVISAR <b>ainda não libera espaço</b>. Só libera quando as cópias são apagadas. O original de cada uma continua no lugar dele.</div>'+
 '<button class="largo" id="desf"'+(r.movidos?'':' disabled')+'>↩ Desfazer tudo (volta '+r.movidos+' arquivos para o lugar)</button></div>'+
 '<div class="cartao"><h2>Liberar espaço</h2><p class="peq">Apaga <b>só as cópias</b> que estão em _REVISAR/Repetidos. Antes de apagar, confere de novo se o original ainda existe e é igualzinho. Se não for, a cópia fica guardada.</p><p class="peq mut">Escreva APAGAR para confirmar:</p><input type="text" id="pal" autocapitalize="characters" autocomplete="off"><button class="perigo largo" id="apag" style="margin-top:8px"'+(r.repetidos?'':' disabled')+'>🗑 Apagar as cópias e liberar '+r.tam+'</button></div>';
 $('#desf').onclick=async()=>{if(!confirm('Voltar todos os arquivos movidos para o lugar de antes?'))return;const x=await api('/desfazer',{});aviso('↩ '+x.n+' arquivos voltaram para o lugar.'+(x.falhas?' '+x.falhas+' não deu.':''));revisar()};
 $('#apag').onclick=async()=>{try{const x=await api('/apagar',{palavra:$('#pal').value.trim().toUpperCase()});aviso('🗑 Liberado '+x.h+' ('+x.n+' cópias).'+(x.guardadas?' '+x.guardadas+' ficaram guardadas porque o original mudou.':''));revisar()}catch(e){aviso('❌ '+e.message)}}}
acompanhar();
</script></body></html>'''

def instalar_atalho():
    """Cria o comando curto  organizar  no Termux (só uma vez)."""
    rc = os.path.expanduser('~/.bashrc'); linha = "alias organizar='python ~/organizar.py'"
    try:
        atual = open(rc, encoding='utf-8').read() if os.path.exists(rc) else ''
        if linha not in atual:
            with open(rc, 'a', encoding='utf-8') as f: f.write('\n' + linha + '\n')
            print('✅ Criei o atalho: da próxima vez é só escrever  organizar')
    except Exception:
        pass

def main():
    if TESTE and os.path.isdir(os.path.dirname(BASE)) and not os.path.isdir(BASE):
        os.makedirs(BASE)
    if not os.path.isdir(BASE):
        print('❌ Não achei os arquivos do celular.')
        print('   Rode antes:  termux-setup-storage   e toque em PERMITIR. Depois rode de novo.')
        sys.exit(1)
    if not os.environ.get('SEM_ABRIR'): instalar_atalho()
    os.system('termux-wake-lock >/dev/null 2>&1')
    try:
        srv = ThreadingHTTPServer(('127.0.0.1', PORTA), Pagina)
    except OSError:
        print(f'❌ A porta {PORTA} já está em uso. Feche o outro organizador (Ctrl+C) ou feche e abra o Termux.')
        sys.exit(1)
    end = f'http://127.0.0.1:{PORTA}/?c={CODIGO}'
    print('━' * 46)
    print(' 🧹 ORGANIZADOR DO CELULAR   (versão ' + VERSAO + ')' + ('   🧪 TESTE' if TESTE else ''))
    print('━' * 46)
    print(' Abra no Chrome do celular (se não abrir sozinho):\n')
    print('   ' + end + '\n')
    print(' Nada é apagado sem você escrever APAGAR.')
    print(' Para fechar: Ctrl+C  (ou feche o Termux)')
    print('━' * 46)
    if not os.environ.get('SEM_ABRIR'):
        os.system(f'termux-open-url "{end}" >/dev/null 2>&1')
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print('\nOrganizador fechado. 👋')
    finally:
        os.system('termux-wake-unlock >/dev/null 2>&1')

if __name__ == '__main__':
    main()
