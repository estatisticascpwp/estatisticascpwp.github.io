"""Gera as duas versões da SCP Stat a partir das fontes desta pasta (codigo-web/):
   1) PWA multi-página -> raiz do repositório (é o que o GitHub Pages publica em https://estatisticascpwp.github.io/)
   2) ficheiro único   -> codigo-web/dist/SCP_Stat_PoloAquatico.html

   Uso:  python codigo-web/build.py
   Só os ficheiros gerados da raiz são substituídos; codigo-web/, mobile/ e README.md não são tocados.
"""
import pathlib, shutil, json, hashlib
ROOT = pathlib.Path(__file__).parent
SRC = ROOT / 'src'
STATIC = ROOT / 'static'
OUT_DIR = ROOT.parent  # raiz do repositório
OUT_ONE = ROOT / 'dist' / 'SCP_Stat_PoloAquatico.html'
PAGES = [  # id, ficheiro html, fonte, js de saída, título
    ('inicio', 'index.html', 'inicio', 'inicio.js', 'Início'),
    ('individual', 'estatistica_individual.html', 'individual', 'estatistica_individual.js', 'Estatística Individual'),
    ('remates', 'remates.html', 'remates', 'remates.js', 'Remates'),
    ('jogadores', 'jogadores.html', 'jogadores', 'jogadores.js', 'Jogadores'),
    ('guardaredes', 'guarda_redes.html', 'guarda_redes', 'guarda_redes.js', 'Guarda-Redes'),
    ('coletiva', 'estatistica_coletiva.html', 'coletiva', 'estatistica_coletiva.js', 'Estatística Coletiva'),
    ('tempo', 'tabela_tempo_jogo.html', 'tempo', 'tabela_tempo_jogo.js', 'Tempo de Jogo'),
    ('exclusoes', 'exclusoes.html', 'exclusoes', 'exclusoes.js', 'Exclusões'),
    ('analise', 'interpretacao.html', 'analise', 'interpretacao.js', 'Sugestão de Interpretação'),
    ('taticas', 'quadro_tatico.html', 'taticas', 'quadro_tatico.js', 'Quadro Tático'),
    ('definicoes', 'definicoes.html', 'definicoes', 'definicoes.js', 'Definições'),
]
rd = lambda p: p.read_text(encoding='utf-8')
css = rd(ROOT / 'app.css')
core = '\n'.join(rd(p) for p in sorted((SRC / 'core').glob('*.js')))
pages = {src: rd(SRC / 'pages' / (src + '.js')) for _, _, src, _, _ in PAGES}
tpl = rd(ROOT / 'template.html')

# versão = impressão digital do conteúdo (muda sempre que algo muda -> novo service worker)
h = hashlib.sha1((css + core + ''.join(pages.values()) + tpl).encode('utf-8'))
for f in sorted(STATIC.rglob('*')):
    if f.is_file(): h.update(f.read_bytes())
VERSION = h.hexdigest()[:10]
core = core.replace('__APP_VERSION__', VERSION)

PWA_HEAD = '''<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/favicon.svg" type="image/svg+xml">
<link rel="icon" href="icons/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="SCP Stat">
<meta name="application-name" content="SCP Stat">
<meta name="description" content="Estatística de polo aquático do Sporting CP: registo ao vivo e análise pós-jogo.">'''

# ---- multi-página (PWA)
# apagar apenas o que este script gera (nunca a raiz inteira)
for d in ['css', 'javascript', 'icons', 'screenshots']:
    if (OUT_DIR / d).exists(): shutil.rmtree(OUT_DIR / d)
for f in [p[1] for p in PAGES] + ['manifest.webmanifest', 'sw.js']:
    if (OUT_DIR / f).exists(): (OUT_DIR / f).unlink()
(OUT_DIR / 'css').mkdir(); (OUT_DIR / 'javascript').mkdir()
shutil.copytree(STATIC / 'icons', OUT_DIR / 'icons')
if (STATIC / 'screenshots').exists(): shutil.copytree(STATIC / 'screenshots', OUT_DIR / 'screenshots')
(OUT_DIR / 'css' / 'scp_stat.css').write_text(css, encoding='utf-8')
(OUT_DIR / 'javascript' / 'core.js').write_text("'use strict';\n" + core, encoding='utf-8')
for pid, html, src, js, title in PAGES:
    (OUT_DIR / 'javascript' / js).write_text("'use strict';\n" + pages[src], encoding='utf-8')
    page = (tpl.replace('__TITLE__', f'SCP Stat · {title}')
               .replace('__HEAD_EXTRA__', PWA_HEAD)
               .replace('__BODYATTR__', f' data-page="{pid}"')
               .replace('__CSS__', '<link rel="stylesheet" href="css/scp_stat.css">')
               .replace('__SECTIONS__', f'  <section class="view" id="view-{pid}"></section>')
               .replace('__JS__', f'<script src="javascript/core.js"></script>\n<script src="javascript/{js}"></script>'))
    (OUT_DIR / html).write_text(page, encoding='utf-8')
(OUT_DIR / '.nojekyll').write_text('', encoding='utf-8')  # GitHub Pages: servir os ficheiros tal como estão

shots = []
for name, ff, label in [('wide.png', 'wide', 'Estatística Individual no tablet'), ('narrow.png', 'narrow', 'Tempo de Jogo no telemóvel')]:
    p = STATIC / 'screenshots' / name
    if p.exists():
        from PIL import Image
        w, hh = Image.open(p).size
        shots.append({'src': f'screenshots/{name}', 'sizes': f'{w}x{hh}', 'type': 'image/png', 'form_factor': ff, 'label': label})
manifest = {
    'id': './', 'name': 'SCP Stat · Polo Aquático', 'short_name': 'SCP Stat',
    'description': 'Estatística de polo aquático do Sporting CP: registo ao vivo e análise pós-jogo.',
    'lang': 'pt-PT', 'dir': 'ltr', 'start_url': './index.html', 'scope': './',
    'display': 'standalone', 'display_override': ['standalone', 'minimal-ui'],
    'background_color': '#004d2a', 'theme_color': '#004d2a', 'categories': ['sports', 'productivity'],
    'icons': [
        {'src': 'icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'},
        {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'},
        {'src': 'icons/icon-maskable-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'maskable'},
        {'src': 'icons/icon-maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'},
    ],
    'shortcuts': [
        {'name': 'Tempo de Jogo', 'url': './tabela_tempo_jogo.html', 'icons': [{'src': 'icons/shortcut-tempo.png', 'sizes': '96x96', 'type': 'image/png'}]},
        {'name': 'Estatística Individual', 'url': './estatistica_individual.html', 'icons': [{'src': 'icons/shortcut-individual.png', 'sizes': '96x96', 'type': 'image/png'}]},
        {'name': 'Exclusões', 'url': './exclusoes.html', 'icons': [{'src': 'icons/shortcut-exclusoes.png', 'sizes': '96x96', 'type': 'image/png'}]},
    ],
}
if shots: manifest['screenshots'] = shots
(OUT_DIR / 'manifest.webmanifest').write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding='utf-8')

precache = ['./'] + [p[1] for p in PAGES] + ['css/scp_stat.css', 'javascript/core.js'] + ['javascript/' + p[3] for p in PAGES] \
    + ['manifest.webmanifest'] + sorted('icons/' + f.name for f in (OUT_DIR / 'icons').iterdir())
sw = rd(ROOT / 'sw.template.js').replace('__VERSION__', VERSION).replace('__PRECACHE__', json.dumps(precache, ensure_ascii=False, indent=1))
(OUT_DIR / 'sw.js').write_text(sw, encoding='utf-8')

# ---- ficheiro único (sem PWA: abre-se diretamente no browser)
alljs = "(()=>{'use strict';\n" + core + '\n' + '\n'.join(pages[src] for _, _, src, _, _ in PAGES) + '\n})();'
sections = '\n'.join(f'  <section class="view" id="view-{pid}"{"" if pid=="inicio" else " hidden"}></section>' for pid, *_ in PAGES)
one = (tpl.replace('__TITLE__', 'SCP Stat Polo Aquático').replace('__HEAD_EXTRA__', '').replace('__BODYATTR__', '')
          .replace('__CSS__', '<style>\n' + css + '\n</style>').replace('__SECTIONS__', sections)
          .replace('__JS__', '<script>\n' + alljs + '\n</script>'))
OUT_ONE.parent.mkdir(exist_ok=True)
OUT_ONE.write_text(one, encoding='utf-8')
print('ok', VERSION, OUT_DIR, OUT_ONE, len(one), 'screenshots:', len(shots))
