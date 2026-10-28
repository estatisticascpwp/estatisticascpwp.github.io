"""Gera os ícones da PWA (PNG) a partir de SVG, com o Chromium do Playwright.
   Saída: build/static/icons/  (copiado para a pasta da app pelo build.py)"""
import asyncio, pathlib
from playwright.async_api import async_playwright
OUT = pathlib.Path(__file__).parent / 'static' / 'icons'
OUT.mkdir(parents=True, exist_ok=True)
FONT = "'DejaVu Sans Condensed','DejaVu Sans',Arial,sans-serif"

def ball(cx, cy, r):
    # bola de polo aquático: amarela com costuras curvas
    s = r / 100
    return f'''<g transform="translate({cx} {cy}) scale({s})">
  <circle cx="6" cy="10" r="100" fill="#00331c" opacity=".35"/>
  <circle r="100" fill="#fcd116"/>
  <clipPath id="bc"><circle r="96"/></clipPath><g clip-path="url(#bc)">
  <path d="M-96 -28 C -40 -10, 40 -10, 96 -28" fill="none" stroke="#c99a00" stroke-width="9" stroke-linecap="round"/>
  <path d="M-92 40 C -30 20, 30 20, 92 40" fill="none" stroke="#c99a00" stroke-width="9" stroke-linecap="round"/>
  <path d="M-10 -99 C -45 -40, -45 40, -10 99" fill="none" stroke="#c99a00" stroke-width="9" stroke-linecap="round"/>
  <path d="M38 -92 C 62 -40, 62 40, 38 92" fill="none" stroke="#c99a00" stroke-width="9" stroke-linecap="round"/>
  </g>
  <ellipse cx="-38" cy="-48" rx="26" ry="16" fill="#fff" opacity=".45" transform="rotate(-30 -38 -48)"/>
</g>'''

def icon_svg(size=512, safe=1.0, text=True, rounded=False):
    k = size / 512
    # conteúdo dentro de uma área segura (maskable: 0.8)
    def S(v): return v * safe
    cx, cy = 256, 256 - S(36 if text else 0)
    stripes = ''.join(f'<rect x="0" y="{y}" width="512" height="32" fill="#ffffff" opacity=".055"/>' for y in range(16, 512, 64))
    label = (f'<text x="256" y="{256 + S(150)}" text-anchor="middle" font-family="{FONT}" font-weight="700" '
             f'font-size="{S(76)}" letter-spacing="{S(4)}" fill="#ffffff">SCP STAT</text>') if text else ''
    clip = '<clipPath id="r"><rect width="512" height="512" rx="96"/></clipPath>' if rounded else ''
    g = ' clip-path="url(#r)"' if rounded else ''
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 512 512"><defs>{clip}
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#006633"/><stop offset="1" stop-color="#003d21"/></linearGradient></defs>
<g{g}><rect width="512" height="512" fill="url(#bg)"/>{stripes}{ball(cx, cy, S(118 if text else 150))}{label}</g></svg>'''

GLYPHS = {  # atalhos (Android): ícone simples sobre verde
    'tempo': '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
    'individual': '<circle cx="12" cy="7" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
    'exclusoes': '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 8h6M9 12h6"/>',
}
def glyph_svg(p):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="20" fill="#006633"/>
<g transform="translate(24 24) scale(2)" fill="none" stroke="#fcd116" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{p}</g></svg>'''

JOBS = [
    ('icon-192.png', icon_svg(192), 192),
    ('icon-512.png', icon_svg(512), 512),
    ('icon-maskable-512.png', icon_svg(512, safe=0.78), 512),
    ('icon-maskable-192.png', icon_svg(192, safe=0.78), 192),
    ('apple-touch-icon.png', icon_svg(180), 180),
    ('favicon-32.png', icon_svg(32, text=False, rounded=True), 32),
] + [(f'shortcut-{k}.png', glyph_svg(v), 96) for k, v in GLYPHS.items()]

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(device_scale_factor=1)
        for name, svg, size in JOBS:
            await pg.set_viewport_size({'width': size, 'height': size})
            await pg.set_content(f'<html><body style="margin:0;background:transparent">{svg}</body></html>')
            await pg.locator('svg').screenshot(path=str(OUT / name), omit_background=True)
        (OUT / 'favicon.svg').write_text(icon_svg(64, text=False, rounded=True), encoding='utf-8')
        await b.close()
    print('icons ->', OUT, sorted(x.name for x in OUT.iterdir()))
asyncio.run(main())
