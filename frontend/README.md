# Frontend — Lista de tarefas (Angular)

Interface de uma tela para a API de tarefas. O setup completo está no
[README raiz](../README.md); aqui ficam só as referências desta parte.

## Estrutura

```text
src/app/task.model.ts        contrato da tarefa em TypeScript
src/app/task.service.ts      único ponto que conhece HttpClient, host e path
src/app/app.component.ts     estado da tela: loading, erro, pendência, rollback
src/app/app.component.html   @if/@for, form com label, checkbox rotulado
src/app/app.component.scss   layout responsivo da tela
src/styles.scss              reset, tipografia, paleta e foco visível
src/environments/            base da API por ambiente (fileReplacements)
```

O componente não faz HTTP e o serviço não guarda estado. Erro de rede nunca vira
dado na tela: a lista que falha mostra alerta e nova tentativa, a criação que
falha preserva o texto digitado, a remoção que falha mantém o item, e a conclusão
que falha volta ao valor anterior.

## Comandos

```bash
npm start        # http://localhost:4200, apontando para http://localhost:8000/api
npm run build    # build de produção
npm run test:ci  # Chrome Headless
```

Os testes precisam de um Chromium acessível. Sem navegador no host:

```bash
docker run --rm -v "$PWD":/frontend -w /frontend node:22 sh -c \
  'apt-get update && apt-get install -y --no-install-recommends chromium && \
   CHROME_BIN=$(which chromium) npm run test:ci'
```

O fluxo entre esta interface e a API é verificado pelo smoke em
[`../e2e`](../e2e/README.md).

## Requisitos

Node **22.12+** (ou 20.19+, ou 24+), que é a faixa declarada em `engines` e
suportada pelo Angular 21 — a linha 22 anterior à 22.12 não serve. O `.nvmrc`
fixa a linha 22: `nvm use`.

Angular 21, TypeScript 5.9, Karma + Jasmine.
