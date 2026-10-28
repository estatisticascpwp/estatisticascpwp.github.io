"""Capturas para o diálogo de instalação (manifest.screenshots). Requer o servidor local em :8765."""
import asyncio, pathlib
from playwright.async_api import async_playwright
OUT = pathlib.Path(__file__).parent / 'static' / 'screenshots'
OUT.mkdir(parents=True, exist_ok=True)
BASE = 'http://localhost:8765/'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for name, url, vp, scale in [('wide.png', 'estatistica_individual.html', (1280, 800), 1), ('narrow.png', 'tabela_tempo_jogo.html', (412, 892), 2)]:
            ctx = await b.new_context(viewport={'width': vp[0], 'height': vp[1]}, device_scale_factor=scale, service_workers='block')
            pg = await ctx.new_page()
            await pg.route('**/fonts.*/**', lambda r: r.abort())
            await pg.goto(BASE + url); await pg.wait_for_timeout(500)
            await pg.evaluate("document.getElementById('demo-banner').hidden=true")
            await pg.screenshot(path=str(OUT / name))
            await ctx.close()
        await b.close()
asyncio.run(main())
