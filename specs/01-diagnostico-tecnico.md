# Diagnóstico técnico

## Resumo

O estado inicial tinha quatro riscos que justificavam intervenção:

| Prioridade | Problema | Risco |
|------------|----------|-------|
| Alta | JSON alterado por read-modify-write sem lock | perda de dados concorrente |
| Alta | API carregada pelo grupo `web` | sessão e CSRF quebrando o Angular |
| Alta | frontend fabricava dados em falhas HTTP | divergência silenciosa do servidor |
| Média | setup, testes e Docker incompletos | refatoração sem rede de segurança |

Problemas de estilo e organização foram tratados apenas quando melhoravam esses
fluxos. A meta não era maximizar camadas, documentos ou casos de teste.

## Backend

### Boundary HTTP

As rotas da API eram incluídas por `web.php`, sem o prefixo `/api` e com
middleware de sessão/CSRF. O CORS era manual e liberava origens em excesso.

Direção adotada:

- registrar `routes/api.php` pelo bootstrap do Laravel;
- manter a API stateless;
- configurar CORS por ambiente;
- deixar as rotas delegarem a um controller pequeno.

### Persistência e entrada

O arquivo JSON era a fonte de runtime. Escritas não eram atômicas, IDs eram
calculados na aplicação e payloads inválidos podiam virar dados.

Direção adotada:

- Eloquent e SQLite como fonte única;
- ID gerado pelo banco;
- `FormRequest` para `title` e `completed`;
- importação explícita do JSON existente, sem ligá-la ao seed padrão.

### Contrato

Status HTTP, shape de erro e campos públicos não estavam fixados. A resposta
passou a ser controlada por `TaskResource`, sem timestamps ou envelope.

## Frontend

O componente concentrava transporte, dados e apresentação, usava tipos frouxos
e tratava falhas de rede como sucesso local. A tela também tinha layout rígido e
estados assíncronos pouco claros.

Direção adotada:

- `TaskService` como único ponto que conhece a API;
- modelo `Task` tipado;
- loading, vazio, erro, retry e pendência explícitos;
- nenhuma tarefa falsa em fallback;
- formulário sem título vazio, alinhado ao limite de 255 caracteres da API;
- layout responsivo e controles acessíveis.

## Assunção que exigiria produto

O modelo já possuía `completed`, mas a interface apenas riscava títulos que
chegavam concluídos. Não existia operação para mudar esse estado. Implementar
conclusão/reabertura é uma ampliação funcional, não uma refatoração inevitável.

No teste, a operação foi mantida de modo isolado. Em um projeto real, ela só
seria implementada depois de confirmar a intenção com produto.

## Itens deliberadamente fora do escopo

- autenticação e autorização;
- paginação, busca e edição de título;
- Repository ou camada de domínio sem regra que os justifique;
- observabilidade e hardening para produção;
- reescrita do frontend em Signals;
- controle de concorrência no `PATCH`. Trocar o JSON pelo SQLite elimina a
  corrupção do arquivo por escrita não atômica, não a escrita simultânea no mesmo
  registro: duas edições do mesmo `id` são last-write-wins, sem versionamento nem
  `ETag`.
