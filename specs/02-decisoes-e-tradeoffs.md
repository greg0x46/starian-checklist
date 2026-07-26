# Decisões e trade-offs

## Escopo

O campo `completed` já existia no modelo e era exibido pela interface, mas o
usuário não tinha como alterá-lo: sem concluir ou reabrir, era um atributo
praticamente decorativo. Interpretei a ausência da operação não como uma nova
iniciativa de produto, e sim como a conclusão de um comportamento já sugerido
pelo domínio e pela interface original.

Há, tecnicamente, uma ampliação do contrato, mas proporcional e controlada:
apenas concluir/reabrir foi adicionado, sem edição, busca, filtros ou outras
capacidades. Em um projeto real, a premissa exigiria validação com produto;
aqui, ela está documentada e isolada no contrato.

## Arquitetura mínima

```text
AppComponent → TaskService → HTTP → TaskController → Eloquent → SQLite
                                     ↑
                             FormRequest/Resource
```

- O componente mantém apenas estado de tela.
- O serviço Angular concentra host, path e transporte.
- Form Requests validam entrada e o Resource controla a saída.
- O controller usa Eloquent diretamente porque não há regra de domínio que
  justifique Service ou Repository.

Essa estrutura cria fronteiras testáveis sem transformar um CRUD pequeno em uma
arquitetura distribuída.

## Contrato

Uma tarefa pública possui somente:

```json
{ "id": 1, "title": "Tarefa", "completed": false }
```

| Operação | Regra principal |
|----------|-----------------|
| Listar | `id ASC`, array direto |
| Criar | título aparado, obrigatório, até 255 caracteres |
| Concluir/reabrir | `PATCH` recebe o booleano desejado |
| Remover | `204` apenas quando o recurso existe |

O update usa estado desejado, não `toggle`, para ser idempotente. Edição de
título continua fora do contrato.

O path permanece `/tarefas`, em português, enquanto os identificadores internos
(`Task`, tabela `tasks`) são inglês. A fronteira é por idioma de audiência, não
por preservação de URL: o prefixo `/api` já alterou o path original. Português é
a língua da superfície voltada ao usuário e das especificações do desafio, e
`tarefas` é vocabulário de domínio dessa superfície; o inglês fica restrito ao
código interno, seguindo a convenção do repositório.

## Estado assíncrono

Falhas de rede não viram dados locais:

- o status descreve a última leitura, não a coleção: uma mutação bem-sucedida
  nunca declara a listagem carregada;
- erro de lista mostra retry, preserva o que já é conhecido e avisa que a
  coleção pode estar incompleta enquanto a leitura não for refeita;
- criar depende só de título válido e não fica bloqueado por falha na listagem;
- uma criação bem-sucedida é autoritária e revela a tarefa mesmo após esse erro;
- uma leitura que termina depois de uma mutação confirmada é descartada e
  refeita, para não desfazer a mutação com uma coleção obsoleta;
- erro de criação preserva o texto;
- `422` é apresentado como validação, separado de indisponibilidade;
- conclusão é otimista e faz rollback;
- remoção só altera a lista depois do `204`;
- uma mutação bloqueia apenas a tarefa afetada.

## Persistência do estado anterior

O JSON inicial contém dados que não deveriam ser descartados. Um seeder
explícito os carrega preservando os IDs, ignora o que já existe e não roda pelo
`DatabaseSeeder`.

A primeira versão validava schema, detectava conflito e abortava em transação.
Para uma fixture de três linhas, versionada e somente de leitura, isso era
maquinário de importador de produção sem o problema correspondente: o seeder foi
reduzido ao que a fixture exige. Depois da carga, o arquivo não participa do
runtime.

## Testes

Cada camada cobre seu risco principal:

- backend: contrato HTTP, validação, persistência e boundary;
- frontend: serviço HTTP e estados observáveis da tela;
- navegador: um smoke do fluxo principal, criado pelo teclado;
- Compose: os dois serviços sobem e respondem.

Casos duplicados ou voltados apenas a produzir evidência documental não fazem
parte da estratégia.

## CI e ambiente

Quatro jobs para uma tela é, deliberadamente, mais do que o mínimo. Cada um
isola um domínio de falha distinto:

- backend e frontend falham no idioma da própria stack, sem que um erro de Node
  mascare um de PHP;
- o smoke exercita o fluxo em navegador sobre processos locais;
- o Compose valida o artefato de entrega (imagens, healthchecks e as duas
  portas respondendo), risco que não aparece nos demais: um `build` quebrado ou
  um healthcheck mal configurado passa despercebido pelos outros jobs.

Smoke e Compose se sobrepõem em "subir os serviços", mas respondem a perguntas
diferentes: o smoke, se o fluxo funciona; o Compose, se a imagem que seria
entregue sobe sozinha.

O mecanismo que grava o hash do lockfile no volume nomeado e reinstala quando
ele diverge resolve um problema real de desenvolvimento com volumes:
`node_modules`/`vendor` obsoletos retidos após troca de branch, sintoma
silencioso e caro de diagnosticar.

Há, reconhecidamente, um excesso em relação ao tamanho do problema. Ele é
intencional e faz parte do que está sendo avaliado: demonstra os padrões de CI e
ambiente que uma entrega de produção exige, cada um aplicado onde resolve um
problema nomeável. Onde o padrão não resolvia problema, como no seeder de
importador, foi removido. O critério é o mesmo do resto da entrega: nenhuma
camada sem problema que a justifique.

## Fluxo assistido por IA

Para o tamanho deste projeto, as skills não eram necessárias. Versioná-las é
uma decisão deliberada: por ser uma vaga AI first, o processo que guia a IA é
parte do que está sendo avaliado, e mantê-lo versionado deixa esse processo
explícito em vez de dependente do prompt de cada sessão.

As skills foram tratadas como código sujeito a revisão. A regra de importação
da skill de Laravel, por exemplo, pedia validação, atomicidade e tratamento de
conflito para qualquer carga de dados, e gerou um seeder de importador de
produção para três linhas versionadas. A regra foi corrigida na própria skill,
as três ganharam calibragem explícita de esforço e o que apenas repetia o
padrão do framework foi removido. O critério é o mesmo do resto da entrega:
nenhuma camada sem problema que a justifique.

## Upgrades

Laravel e Angular estavam fora das respectivas janelas de suporte. Os upgrades
foram executados por último, de forma incremental e protegidos pela suíte.

Eles são uma trilha isolada de manutenção: a arquitetura e o contrato podem ser
avaliados sem depender deles. Em uma entrega com prazo restrito, poderiam ser
postergados para uma mudança separada.

## Limites

- API pública e sem autenticação;
- `PATCH` é last-write-wins: o SQLite resolve a atomicidade da escrita, não o
  conflito entre duas edições simultâneas do mesmo registro, deixado fora do
  escopo por não haver múltiplos autores;
- Compose voltado a desenvolvimento/demonstração;
- sem paginação ou busca;
- Angular 21 mantido por compatibilidade com Node 22;
- advisories apenas em ferramentas de desenvolvimento não bloqueiam o gate de
  dependências entregues ao navegador.
