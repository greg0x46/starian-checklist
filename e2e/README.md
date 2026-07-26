# Smoke em navegador

Único teste que exercita os dois serviços juntos, em um navegador real. As
suítes de Karma e PHPUnit param na fronteira HTTP, cada uma com o outro lado
simulado. O que só aparece aqui é o encontro delas: CORS, base da API por
ambiente, contrato e persistência real.

| Arquivo | Cobre |
|---------|-------|
| `tests/task-flow.spec.ts` | carregar, criar pelo teclado, concluir, reabrir, remover e recarregar; ordem do servidor; título vazio; falha da API com nova tentativa; idioma e título do documento |

## Executar

```bash
cd e2e
npm ci
npx playwright install --with-deps chromium   # uma vez; precisa de sudo em Linux
npm test
```

O `playwright.config.ts` sobe o que faltar: o backend com um SQLite próprio,
migrado na hora (`database/smoke.sqlite`, ignorado pelo Git), e o `ng serve` na
configuração de desenvolvimento. Se `localhost:8000` e `localhost:4200` já
estiverem respondendo (por exemplo via `docker compose up`), ele reaproveita o
que está de pé.

Todo teste cria as próprias tarefas com título único, marcado com `#smoke`. Uma
fixture automática (`tests/support/fixtures.ts`) apaga pela API tudo que tiver
essa marca depois de cada caso, inclusive quando o teste falha no meio do fluxo
ou é repetido. Por isso rodar contra um ambiente com dados é seguro e não deixa
resíduo no banco de desenvolvimento.

## Sem as bibliotecas de sistema do navegador

`playwright install --with-deps` precisa instalar pacotes do sistema. Onde isso
não é possível, aponte `CHROME_BIN` para um Chromium já instalado:

```bash
CHROME_BIN=$(which chromium) npm test
```

É a mesma variável que o Karma usa no `frontend/`. Em uma máquina sem navegador
nenhum, com o ambiente do Compose no ar:

```bash
docker run --rm --network host -v "$PWD/..":/repo -w /repo/e2e \
  -e CHROME_BIN=/usr/bin/chromium node:22 sh -c \
  'apt-get update && apt-get install -y --no-install-recommends chromium && \
   npm ci && npx playwright test'
```
