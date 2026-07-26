---
name: refactoring-workflow
description: >-
  Aplica refatoração incremental com proteção contra regressões. Use ao mover,
  extrair, renomear ou reestruturar código existente, e ao separar mudanças
  estruturais de correções funcionais em qualquer área deste repositório.
---

# Refactoring Workflow

## Calibrar o esforço

Esta é a regra que prevalece sobre as demais: o tamanho da solução responde ao
tamanho do problema, não ao tamanho do catálogo de boas práticas.

- Meça o problema real antes de escolher a estrutura: quantos registros, quantos
  usuários, com que frequência muda, o que acontece se falhar.
- Robustez sem o risco correspondente é custo de manutenção sem contrapartida.
- Quando uma regra desta skill pedir mais maquinário do que o problema exige,
  registre a decisão e aplique a versão menor.

## Descobrir o contexto

1. Leia instruções, especificações, testes e convenções relevantes à mudança.
2. Inspecione o código e o histórico local antes de propor a estrutura alvo.
3. Classifique o comportamento observável afetado: deve ser preservado, é um
   defeito a corrigir, ou está ambíguo e precisa de decisão explícita.
4. Não trate esta skill como fonte de requisitos. O contrato vigente vem da
   tarefa e dos documentos do repositório.

## Estabelecer o baseline

- Execute os testes relevantes primeiro e registre falhas preexistentes.
- Para código sem cobertura, adicione characterization tests apenas do
  comportamento que deve ser preservado.
- Isole arquivos, banco, relógio e rede. O teste não deve deixar dados ou
  worktree modificados.
- Para um defeito conhecido, escreva o teste do comportamento alvo junto da
  correção — não transforme o defeito em requisito permanente.

## Definir a menor mudança coerente

- Prefira uma unidade pequena, revisável e verificável.
- Siga os padrões já usados no repositório antes de introduzir abstrações.
- Extraia abstração quando ela eliminar complexidade ou duplicação real.
- Separe refatoração de mudança observável quando os estados intermediários
  continuarem válidos; se a separação quebrar o sistema, mantenha a mudança
  coordenada e explique o motivo.
- Não inclua limpeza ou modernização sem relação com o objetivo.

## Implementar e verificar

1. Altere sem enfraquecer testes existentes.
2. Itere com o teste mais específico; antes de concluir, execute a suíte, o build
   ou o smoke correspondente ao impacto.
3. Inspecione o diff em busca de mudança de contrato, arquivo gerado ou alteração
   não relacionada.

Descubra os comandos na configuração atual do repositório — normalmente
`php artisan test` no `backend/` e `npm run test:ci` no `frontend/`. Não assuma
que continuam válidos depois de upgrades.

## Entregar

- Não crie commit a menos que o usuário solicite.
- Informe testes executados, limitações e comportamento deliberadamente alterado.
- Atualize documentação ou contrato apenas quando a mudança os afetar.
