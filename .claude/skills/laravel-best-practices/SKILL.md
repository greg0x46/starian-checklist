---
name: laravel-best-practices
description: >-
  Orienta implementação, refatoração e revisão de backend Laravel neste
  repositório. Use para rotas e controllers, validação, Eloquent, migrations,
  APIs JSON, tratamento de erros, configuração, segurança e testes PHP.
---

# Laravel Best Practices

Aplique junto de `refactoring-workflow`: a calibragem de esforço descrita lá
prevalece sobre qualquer item desta lista.

## Confirmar a plataforma

- Leia `composer.json`, `composer.lock` e `bootstrap/app.php` antes de escolher
  uma API do framework; o lockfile é a fonte da versão instalada.
- Depois de upgrade, reavalie práticas e APIs. Não preserve uma recomendação
  apenas porque ela aparece nesta skill.

## Manter boundaries simples

- Deixe rotas declarativas e controllers focados em transporte HTTP.
- Coloque validação de entrada em `FormRequest` quando houver payload não trivial
  e use `$request->validated()`.
- Permita controller falando diretamente com o Model em CRUD simples.
- Extraia Action/Service somente quando existir regra reutilizável, orquestração
  ou transação que justifique a camada.
- Não introduza Repository: Eloquent já exerce esse papel.

## Modelar persistência

- Evolua schema com migrations reversíveis.
- Declare `$fillable` intencionalmente e configure casts.
- Use constraints e índices para invariantes do banco.
- Use transação quando várias escritas relacionadas precisarem falhar juntas.
- Defina ordenação explícita quando a resposta exigir ordem estável.

Ao carregar dados existentes, dimensione pelo dado, não pelo formato do
problema. Uma fixture pequena, versionada e somente de leitura pede um seeder
idempotente e nada mais. Validação de schema, detecção de conflito e rollback
pertencem a uma importação de volume desconhecido, mutável ou vinda de fora do
repositório — e, nesse caso, a um comando dedicado, não a um seeder.

## Projetar APIs explícitas

- Exponha somente métodos e rotas exigidos pelo contrato.
- Escolha status HTTP e semântica de idempotência conscientemente.
- Use API Resources para controlar o shape público e não exponha colunas internas
  por serialização acidental.
- Garanta JSON coerente para validação, não encontrado e falha inesperada, sem
  stack trace nem nome de classe em produção.

## Configurar middleware e segurança

- Registre rotas no grupo correto; não misture sessão/CSRF de web com API
  stateless sem decisão explícita.
- Configure CORS por ambiente, apenas para as origens necessárias. CORS não
  substitui autenticação.
- Mantenha segredos fora do repositório e das imagens.
- Execute auditoria de dependências e mantenha o framework em ciclo de suporte.

## Testar no boundary correto

- Use testes de feature para contrato HTTP, validação, binding e serialização.
- Cubra caminho feliz, limites e as falhas que o contrato promete tratar.
- Confirme o shape da resposta, não apenas o status.
- Teste o que o código decide. Não escreva casos para entradas que só existiriam
  se alguém editasse à mão um arquivo versionado, nem para comportamento que o
  framework já garante.

```bash
cd backend
php artisan test
./vendor/bin/pint --test
composer audit
```
