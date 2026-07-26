# Backend — API de tarefas (Laravel)

API JSON stateless da lista de tarefas. O setup completo, incluindo Docker e a
importação dos dados existentes, está no [README raiz](../README.md); aqui ficam
só as referências desta parte.

## Contrato

| Método e path | Sucesso | Falhas |
|---------------|---------|--------|
| `GET /api/tarefas` | `200` + `Task[]` ordenado por `id ASC` | — |
| `POST /api/tarefas` | `201` + `Task` | `422` |
| `PATCH /api/tarefas/{id}` | `200` + `Task` | `404`, `422` |
| `DELETE /api/tarefas/{id}` | `204` sem body | `404` |

`Task` é `{ "id": int, "title": string, "completed": bool }`, sem envelope
`data` e sem timestamps. O `PATCH` recebe o estado desejado, não uma ordem de
alternar, e por isso é idempotente. Também respondem `GET /up` (saúde do
serviço) e `GET /` (página que aponta para a API e para a interface).

## Estrutura

```text
app/Http/Controllers/TaskController.php   transporte das quatro operações
app/Http/Requests/                        validação de entrada
app/Http/Resources/TaskResource.php       representação pública
app/Models/Task.php                       model Eloquent
bootstrap/app.php                         rotas, middleware e erros em JSON
config/cors.php                           política de CORS por ambiente
database/legacy/tarefas.json              fixture somente de leitura
database/seeders/LegacyTasksSeeder.php    carga da fixture legada
routes/api.php                            quatro rotas, declaradas uma a uma
```

`config/cors.php` é o único arquivo de configuração ajustado por esta aplicação;
os demais permanecem como o Laravel os entrega.

## Comandos

```bash
php artisan test
./vendor/bin/pint --test  # estilo
composer audit            # advisories de segurança

php artisan migrate
php artisan db:seed --class=LegacyTasksSeeder   # carrega a fixture do JSON antigo
```

Os testes usam SQLite em memória e um `storage/` temporário por teste, então a
suíte não altera nenhum arquivo versionado.

## Requisitos

PHP 8.3+ (a imagem usa 8.4) com `mbstring`, `dom`, `xml`, `xmlwriter` e
`pdo_sqlite`, além do Composer. Laravel 13, PHPUnit 12.
