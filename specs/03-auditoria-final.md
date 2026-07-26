# Auditoria final

| Área | Verificação |
|------|-------------|
| API | boundary stateless, validação, status e shape cobertos por testes |
| Dados | SQLite é a fonte de runtime; a carga do JSON é explícita |
| Frontend | não fabrica dados em erro e mantém estados assíncronos visíveis |
| Formulário | vazio é bloqueado, `maxlength=255` e `422` tem mensagem própria |
| UX | fluxo principal por teclado, com rótulos e `aria-busy` cobertos |
| Ambiente | setup nativo, Docker e CI documentados |
| Processo | specs e skills versionadas por decisão de escopo, mantidas no mínimo |

## CI

O workflow possui jobs independentes para backend, frontend, smoke em navegador
e Compose. O badge do README aponta para a execução atual da `main`; ele é a
fonte de evidência remota, enquanto comandos locais validam alterações ainda não
publicadas.

## Limites aceitos

Os limites da entrega estão em [Decisões e trade-offs](./02-decisoes-e-tradeoffs.md#limites),
com destaque para dois: concluir/reabrir é uma assunção de escopo que exigiria
validação de produto, e o `PATCH` é last-write-wins.
