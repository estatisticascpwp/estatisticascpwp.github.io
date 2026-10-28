# SCP Stat · Polo Aquático — app móvel (React Native + Expo)

Versão nativa da SCP Stat para **iPhone, iPad e Android**, com as mesmas funcionalidades e o mesmo aspeto da versão web:
Início, Estatística Individual, Remates, Jogadores, Guarda-Redes, Estatística Coletiva, Tempo de Jogo, Exclusões, Sugestão de Interpretação e Definições.

## Porquê React Native + Expo

- **Interface nativa** (componentes de iOS/Android, não uma página web), com um só código para telemóvel e tablet.
- **TypeScript**, próximo do JavaScript que a equipa já usa; a lógica de estatística foi portada da versão web e dá **exatamente os mesmos resultados**.
- **Expo Go** permite testar no telemóvel em minutos, sem Xcode nem Android Studio. As versões para a App Store e o Google Play saem do mesmo projeto (EAS Build).
- Os dados ficam numa **base SQLite** no dispositivo (funciona sem internet). Cada jogo é uma linha, o que facilita ligar mais tarde a uma base de dados na nuvem (Firebase ou Supabase).

## 1. Primeiro arranque (num computador)

Precisas de [Node.js](https://nodejs.org) (versão LTS) e, no telemóvel, da app **Expo Go** (App Store / Google Play).

```bash
cd scp-stat-mobile
npm install          # instala o Expo, React e React Native
npm run setup        # instala as bibliotecas nativas nas versões certas para o SDK do Expo
npx expo start       # abre o servidor de desenvolvimento e mostra um código QR
```

- **Android:** abre a Expo Go e lê o código QR.
- **iPhone/iPad:** lê o código QR com a câmara.
- O computador e o telemóvel têm de estar na mesma rede Wi-Fi (ou usa `npx expo start --tunnel`).
- `npm run doctor` verifica se as versões das bibliotecas estão compatíveis.

### Versão do Expo

O projeto usa o **Expo SDK 57**, a versão que a Expo Go das lojas corre neste momento. O SDK 58 saiu a 21/10/2026 e a Expo Go das lojas vai passar a suportar só o SDK 58 dentro de algumas semanas. Quando isso acontecer, atualiza com:

```bash
npx expo install expo@^58.0.0 --fix
npx expo-doctor@latest
```

## 2. Instalar a app nos tablets da equipa (sem Expo Go)

Com uma conta gratuita em expo.dev e o EAS CLI (`npm install -g eas-cli`, depois `eas login`):

```bash
eas build:configure
eas build --platform android --profile preview   # gera um .apk para instalar diretamente nos Android
eas build --platform ios                          # iPhone/iPad: requer conta Apple Developer (TestFlight ou App Store)
```

Para publicar nas lojas: `eas submit`. O identificador da app está em `app.json` (`pt.sporting.scpstat`); confirmem-no com o clube antes de publicar.

## Estrutura

```
App.tsx                 arranque: fontes, base de dados, cabeçalho, ecrã ativo, diálogos
src/domain/             lógica pura (sem React): igual à versão web
  constants.ts          ações, situações, zonas, tabelas coletivas — editar aqui as listas de opções
  zones.ts              zona do campo e da baliza a partir do toque
  clock.ts              relógio, turnos e tempo de jogo
  stats.ts              estatísticas, leituras automáticas, guarda-redes
  csv.ts, model.ts, format.ts, demo.ts (jogo de exemplo)
src/store/              estado da app + SQLite (db.ts)
src/ui/                 componentes: kit.tsx, Court.tsx (campo/baliza), Select.tsx, dialogs.tsx, Header.tsx, files.ts
src/screens/            os 10 ecrãs
src/actions.ts          ações partilhadas (mudar de período, importar/exportar jogo)
src/theme.ts            cores e tipos de letra (os mesmos da versão web)
assets/                 ícone, ícone adaptativo (Android) e ecrã de arranque
```

## Diferenças em relação à versão web

- **Navegação:** no tablet, os ecrãs aparecem numa barra no topo, como no site. No telemóvel, ficam num menu lateral (☰). O botão "voltar" do Android regressa ao Início.
- **Listas de opções:** abrem numa folha inferior com pesquisa, em vez de menus pendentes.
- **Exportar CSV/JSON:** abre a folha de partilha do sistema (Guardar em Ficheiros, Drive, email…). **Importar** abre o seletor de ficheiros.
- **Golos nas Exclusões:** toque soma 1; **toque longo** subtrai 1.
- **Registos na tabela da Estatística Individual:** tocar numa linha destaca o marcador no campo e na baliza (substitui o "passar o rato").
- **Tempo de Jogo:** enquanto este ecrã está aberto, o dispositivo não se desliga sozinho. A vibração confirma entradas, saídas e registos.
- **Ficheiros:** os jogos exportados pela app abrem na versão web e vice-versa.

## Estado desta versão

O código foi verificado com o compilador de TypeScript, e a lógica (zonas, relógio, turnos, substituições, estatísticas, CSV) foi testada contra a versão web com o mesmo jogo de exemplo, com resultados iguais. A app **ainda não foi aberta num dispositivo**: o primeiro arranque com a Expo Go é o passo de validação. Se aparecer um erro no ecrã vermelho do Expo, envia uma captura com a mensagem.
