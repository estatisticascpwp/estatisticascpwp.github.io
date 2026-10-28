# SCP Stat · Polo Aquático

App de estatística de polo aquático da equipa do Sporting CP: registo ao vivo durante o jogo e análise pós-jogo.

**App (PWA): https://estatisticascpwp.github.io/** — abre no browser e instala-se no ecrã principal (Android/Chrome: botão *Instalar*; iPhone/iPad: Safari › Partilhar › *Adicionar ao ecrã principal*). Depois de instalada funciona sem internet.

## Organização do repositório

| Pasta / ficheiros | O que é |
|---|---|
| raiz (`index.html`, páginas `.html`, `css/`, `javascript/`, `icons/`, `screenshots/`, `manifest.webmanifest`, `sw.js`) | **PWA gerada** — é o que o GitHub Pages publica. Não editar à mão: é gerada a partir de `codigo-web/`. |
| `codigo-web/` | Código-fonte da versão web e o script que gera a PWA. |
| `codigo-web/dist/SCP_Stat_PoloAquatico.html` | Versão de ficheiro único (abre-se diretamente no browser, sem instalar). |
| `mobile/` | App nativa iOS/Android (React Native + Expo, TypeScript). Ver `mobile/README.md`. |

## Alterar a versão web

1. Editar os ficheiros em `codigo-web/`:
   - `src/core/` — código partilhado por todas as páginas (armazenamento, cabeçalho, listas de ações e jogadas, campo e baliza, relógio, instalação da PWA, jogo de exemplo);
   - `src/pages/` — um ficheiro por página;
   - `app.css` — estilos; `template.html` — estrutura comum das páginas.
2. Gerar a PWA (precisa de Python 3):
   ```bash
   python codigo-web/build.py
   ```
   O script substitui só os ficheiros gerados na raiz e cria uma versão nova do service worker.
3. Fazer commit e push. Em 1–2 minutos o GitHub Pages publica a versão nova; nos dispositivos com a app instalada aparece o aviso **"Há uma versão nova da SCP Stat · Atualizar agora"** (os dados mantêm-se).

`codigo-web/make_icons.py` e `codigo-web/make_screens.py` regeneram os ícones e as capturas do diálogo de instalação (precisam do Playwright); só são necessários se o ícone ou o aspeto mudarem.

## Dados

Neste momento os registos ficam **em cada dispositivo** (armazenamento do browser na PWA; SQLite na app móvel) e passam entre dispositivos com *Exportar/Importar jogo* (.json) ou cópia de segurança em *Definições*. Os ficheiros são compatíveis entre a PWA e a app móvel.

Próximo passo planeado: base de dados partilhada no **Firebase** (Firestore + contas da equipa), para vários dispositivos registarem o mesmo jogo em tempo real.

Este repositório é público: o código e a app ficam visíveis, mas **nenhum dado dos jogos é guardado aqui**.
