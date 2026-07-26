# Teste técnico — refatoração fullstack

[![CI](https://github.com/greg0x46/starian-checklist/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/greg0x46/starian-checklist/actions/workflows/ci.yml)

Aplicação de lista de tarefas em Angular e Laravel. O objetivo do desafio é
refatorar o projeto existente — estrutura, legibilidade, confiabilidade e
responsividade — sem transformar a entrega em uma nova iniciativa de produto.

## Assunção de escopo

> O campo `completed` já fazia parte do modelo exibido pela aplicação, porém não
> havia operação para alterá-lo. Interpretei essa ausência como um comportamento
> incompleto. Em um projeto real, essa decisão dependeria de validação com
> produto; no contexto do teste, implementei a operação e a mantive isolada no
> contrato.

Essa é a única ampliação funcional assumida: um `PATCH` atualiza apenas
`completed`, e o checkbox permite concluir ou reabrir. A decisão não é tratada
como consequência necessária da refatoração.

## Resultado

| Área | Decisão |
|------|---------|
| Persistência | SQLite e Eloquent substituem o JSON mutável |
| API | boundary stateless sob `/api`, validação e respostas JSON previsíveis |
| Frontend | serviço HTTP tipado e estados explícitos de loading, erro e mutação |
| Qualidade | testes proporcionais por camada, smoke principal e CI |
| Dependências | upgrades isolados, executados por último |

```text
Angular 21                       Laravel 13
├── AppComponent                 ├── routes/api.php
│   estado da tela               ├── TaskController
└── TaskService ─── JSON ──────▶ ├── Form Requests
                                 ├── TaskResource
                                 └── Task (Eloquent) ──▶ SQLite
```

O controller usa Eloquent diretamente. Não há Repository, store global ou outra
camada sem regra de negócio que a justifique.

## Contrato HTTP

Base local: `http://localhost:8000/api`.

| Método e path | Request | Sucesso | Falhas |
|---------------|---------|---------|--------|
| `GET /tarefas` | — | `200` + `Task[]` | — |
| `POST /tarefas` | `{ "title": string }` | `201` + `Task` | `422` |
| `PATCH /tarefas/{id}` | `{ "completed": bool }` | `200` + `Task` | `404`, `422` |
| `DELETE /tarefas/{id}` | — | `204` | `404` |

```json
{ "id": 1, "title": "Revisar especificação", "completed": false }
```

O título é obrigatório e limitado a 255 caracteres. O `PATCH` recebe o estado
desejado, portanto repetir `{"completed": true}` é idempotente. A API não expõe
timestamps nem envelope `data`.

O path `/tarefas` é mantido em português por decisão explícita: português é a
língua da superfície voltada ao usuário e das especificações, enquanto os
identificadores internos (`Task`, tabela `tasks`) seguem o inglês do restante do
código.

## Execução com Docker

Pré-requisitos: Docker e Docker Compose.

```bash
cp backend/.env.example backend/.env
touch backend/database/database.sqlite

docker compose build
docker compose run --rm laravel php artisan key:generate
docker compose run --rm laravel php artisan migrate
docker compose run --rm laravel php artisan db:seed --class=LegacyTasksSeeder
docker compose up
```

- API: <http://localhost:8000/api/tarefas>
- Frontend: <http://localhost:4200>

Os serviços possuem healthchecks. Volumes nomeados guardam `vendor/` e
`node_modules/`; os entrypoints os sincronizam com os lockfiles.

## Execução nativa

Pré-requisitos: PHP 8.3+ com as extensões usuais do Laravel, Composer e uma
versão de Node suportada pelo Angular 21 (o projeto fixa Node 22).

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
touch database/database.sqlite
php artisan migrate
php artisan db:seed --class=LegacyTasksSeeder
php artisan serve
```

Em outro terminal:

```bash
cd frontend
npm ci
npm start
```

A origem permitida por CORS é configurada em `CORS_ALLOWED_ORIGINS` e, por
padrão, vale `http://localhost:4200`.

## Dados existentes

O JSON original foi preservado como fixture somente de leitura em
[`backend/database/legacy/tarefas.json`](./backend/database/legacy/tarefas.json).
Sua importação é explícita:

```bash
php artisan db:seed --class=LegacyTasksSeeder
```

A carga preserva os IDs e ignora o que já existe, então repeti-la não duplica
nada. Ela não é chamada pelo `DatabaseSeeder`, evitando recarga acidental em
`migrate --seed`.

## Testes e qualidade

```bash
cd backend
php artisan test
./vendor/bin/pint --test
composer audit

cd ../frontend
npm run build
npm run test:ci
npm audit --omit=dev

cd ../e2e
npm ci
npm test
```

(O e2e depende de um Chrome ou Chromium no PATH; consulte
[`e2e/README.md`](./e2e/README.md) para o primeiro setup do navegador.)

Os testes unitários do frontend usam Vitest com jsdom e não precisam de
navegador instalado. O navegador real fica restrito ao smoke em `e2e/`.

A [CI](./.github/workflows/ci.yml) executa backend, frontend, o fluxo principal
em navegador e a validação do ambiente Compose, e é a execução canônica da
suíte a cada push e PR. O badge no topo aponta para a execução mais recente da
`main`.

## Fluxo assistido por IA

A vaga é AI first, então o processo faz parte da entrega, não é andaime. Dois
artefatos ficam versionados por decisão explícita:

- [`specs/`](./specs/) — a trilha spec-driven, em três documentos que respondem a
  uma pergunta cada: o que estava errado no
  [diagnóstico](./specs/01-diagnostico-tecnico.md), o que foi decidido e por quê
  nas [decisões e trade-offs](./specs/02-decisoes-e-tradeoffs.md), e o que foi
  verificado na [auditoria](./specs/03-auditoria-final.md).
- [`.claude/skills/`](./.claude/skills/) — as instruções que restringem o agente
  durante a execução. Versioná-las torna as decisões reproduzíveis por quem
  reabrir o projeto, em vez de dependerem do prompt de cada sessão.

Ambos são mantidos no menor tamanho que sustenta essa função: uma regra só entra
quando muda uma decisão. Regras que apenas repetem o padrão do framework, ou o
que qualquer implementação competente já faria, foram removidas.

Isso também tem custo, e ele apareceu: a instrução de importação da skill de
Laravel pedia validação, atomicidade e tratamento de conflito, e produziu um
seeder de importador de produção para uma fixture de três linhas. A correção foi
feita na skill — que ganhou uma regra de proporcionalidade — e não apenas no
código, para que a próxima tarefa não reproduza o mesmo excesso.

## Decisões e limites

- Falhas HTTP não fabricam tarefas nem removem dados apenas na tela.
- Concluir usa atualização otimista com rollback; remover aguarda a confirmação.
- A API é pública e stateless. Autenticação, paginação e busca não fazem parte do
  escopo.
- Os upgrades Laravel 11→12→13 e Angular 17→21 foram feitos por último, uma
  major por vez. São uma etapa isolada de manutenção e não são necessários para
  compreender a arquitetura principal.
- Angular 21 foi mantido por estar em suporte e ser compatível com Node 22.
