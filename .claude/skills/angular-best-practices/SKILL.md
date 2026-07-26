---
name: angular-best-practices
description: >-
  Orienta implementação, refatoração e revisão de frontend Angular neste
  repositório. Use para componentes, tipagem, serviços HTTP, estado assíncrono,
  templates, formulários, acessibilidade, responsividade e testes TypeScript.
---

# Angular Best Practices

Aplique junto de `refactoring-workflow`: a calibragem de esforço descrita lá
prevalece sobre qualquer item desta lista.

## Confirmar a plataforma

- Leia `package.json`, o lockfile e `angular.json` antes de escolher APIs ou
  sintaxe; confirme as versões efetivas de Angular, TypeScript e Node.
- Preserve o modelo arquitetural existente, como componentes standalone, salvo
  motivo explícito para migrá-lo.

## Manter tipagem e responsabilidades

- Modele payloads e estado de domínio com interfaces específicas; evite `any`.
- Encapsule transporte HTTP em serviços injetáveis e tipados, com host e base URL
  fora dos componentes.
- Deixe componentes focados em apresentação e orquestração da tela.
- Não introduza store global ou biblioteca de estado para fluxo local simples.

## Projetar chamadas HTTP

- Faça método, URL, body e envelope corresponderem ao contrato do backend.
- Expresse estado desejado em updates idempotentes quando o domínio permitir.
- Não esconda fallback de dados dentro do serviço; propague o erro para a UI
  tratar.

## Modelar estado assíncrono

Representar explicitamente carregamento inicial, sucesso vazio, sucesso com
dados, falha com retry e mutação pendente.

- Não fabrique dados em falha.
- Impeça duplo submit e mutações concorrentes do mesmo recurso.
- Em atualização otimista, implemente rollback completo; em pessimista, altere a
  UI apenas após a confirmação.

## Construir templates acessíveis e responsivos

- Rastreie listas por identidade estável, nunca pelo índice.
- Prefira `<form>` e submit semântico; associe labels a campos e preserve
  navegação por teclado e foco visível.
- Use `role="status"` para progresso e `role="alert"` para falhas relevantes.
- Não comunique estado apenas por cor.
- Use dimensões fluidas e quebra de palavras; verifique textos longos, loading,
  erro e lista vazia.

## Testar comportamento

- Serviços: `HttpTestingController`, verificando método, URL, body e propagação
  de erro.
- Componentes: loading, vazio, erro, retry, sucesso, submit duplicado e mutação
  concorrente — um caso por comportamento, sem repetir a mesma lógica em
  variações de dado.
- Acessibilidade e responsividade fazem parte do teste do fluxo, não de suítes
  próprias. Uma tela pequena não sustenta um eixo de teste dedicado; adicione um
  quando existir uma regra de layout que a suíte do fluxo não consiga observar.

```bash
cd frontend
npm run test:ci
npm run build
npm audit --omit=dev
```
