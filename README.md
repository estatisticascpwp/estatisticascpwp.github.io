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

## Dados e base de dados da equipa (Firebase)

A PWA trabalha sempre sobre uma cópia local (funciona sem rede) e sincroniza com o **Firestore** do projeto Firebase `scp-stat` (região Madrid):

- **Acesso:** uma única conta da equipa, `estatisticascpwp+app@gmail.com`. Cada dispositivo pede a palavra-passe uma vez. A palavra-passe muda-se na consola do Firebase (Authentication › Users) e não tem relação com a conta Google.
- **Estrutura:** `jogos/{jogo}` guarda os dados gerais do jogo (adversário, plantel, relógio…), `jogos/{jogo}/registos/{registo}` guarda cada registo (individual, coletivo, entrada/saída, exclusões, golos) e `taticas/{tatica}` guarda cada tática do Quadro Tático (documento inteiro; se a mesma tática for alterada em dois dispositivos ao mesmo tempo, fica a última alteração).
- **Sincronização:** cada dispositivo envia só o que mudou e recebe em tempo real o que os outros mudaram. Edições de campos ou registos diferentes em dispositivos diferentes juntam-se; se o mesmo registo for alterado em dois sítios, fica a última alteração enviada.
- **Vários dispositivos no mesmo jogo (3–4):** cada um pode estar num ecrã diferente (por exemplo Individual, Coletiva, Tempo de Jogo e Exclusões). Os registos de um aparecem nos outros em segundos, e o que se está a preencher num formulário não se perde quando chegam registos de outro dispositivo.
- **Jogos novos:** um jogo criado num dispositivo aparece em todos. Um dispositivo sem jogo em curso (só com o jogo de exemplo ou um jogo vazio) abre-o sozinho; os outros recebem o aviso "Novo jogo da equipa" com a opção de o abrir. Todos os jogos da equipa ficam disponíveis em Início › Jogos guardados.
- **Boa prática:** cada ecrã de registo num só dispositivo, e o relógio controlado num só dispositivo (o do Tempo de Jogo). O plantel (nomes, GR) deve ser preenchido antes do jogo: se dois dispositivos alterarem nomes ao mesmo tempo, fica a última alteração.
- **Sem rede:** os registos ficam no dispositivo e são enviados quando a ligação voltar.
- **Jogos de exemplo** nunca são enviados. **Apagar um jogo** em Início apaga-o para toda a equipa; **apagar os dados do dispositivo** em Definições não apaga nada na base de dados.
- A configuração do Firebase está em `codigo-web/src/core/85_cloud.js`. Não é secreta: o acesso aos dados está protegido pelas regras do Firestore (só a conta da equipa lê e escreve).

## Exportar e importar

Tudo está num só sítio, **Início › Exportar dados**:

- **Exportar para Excel** — um ficheiro `.xlsx` com uma folha por tipo de dados (Jogos, Plantel, Individual, Coletiva, Tempo – movimentos, Tempo – resumo, Exclusões, Exclusões – registo, Guarda-redes, Resumo jogadores, Bolas de saída). Pode ser só do jogo aberto ou de todos os jogos (nesse caso cada linha leva a data e o adversário).
- **Cópia de segurança (.json)** — todos os jogos e todas as táticas, para guardar fora da app.
- **Importar** — repõe uma cópia de segurança ou um jogo exportado (juntar, substituir ou importar como cópia).

## Quadro Tático

Página para desenhar e animar jogadas: piscina vista de cima (meio campo ou piscina inteira), jogadores do SCP, adversários, guarda-redes e bola arrastáveis, setas de movimento, passe e remate, vários passos por tática com animação, e ecrã inteiro. As táticas organizam-se por categoria (Ataque, Defesa, Superioridade, Inferioridade, Contra-ataque, Bola parada) e são partilhadas com a equipa pela base de dados. Inclui modelos iniciais para servir de ponto de partida (zona M, 5x6 contra 4-2, 6x5 em 4-2, ataque 3-3, posições de saída), definidos em `codigo-web/src/pages/taticas.js` (`TB_MODELS`).

## Limitações atuais

A versão de ficheiro único e a app móvel (`mobile/`) ainda não estão ligadas à base de dados. A app móvel ainda tem os botões de exportar antigos e não tem o Quadro Tático.

Este repositório é público: o código e a app ficam visíveis, mas **nenhum dado dos jogos é guardado aqui**.
