<!DOCTYPE html>
<html lang="pt-BR">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>API de tarefas</title>

        {{-- Estilo mínimo e embutido: esta página existe para orientar quem abre
             a porta do backend no navegador, não para ser uma interface. A
             interface é o Angular, em outra origem. --}}
        <style>
            body {
                max-width: 40rem;
                margin: 4rem auto;
                padding: 0 1rem;
                font-family: system-ui, sans-serif;
                line-height: 1.6;
                color: #1f2933;
            }
            code { background: #f0f2f5; padding: 0.1rem 0.3rem; border-radius: 0.2rem; }
            li { margin-bottom: 0.25rem; }
        </style>
    </head>
    <body>
        <h1>API de tarefas</h1>

        <p>
            Este serviço responde à API JSON da lista de tarefas. A interface é
            servida pelo Angular, por padrão em
            <a href="http://localhost:4200">localhost:4200</a>.
        </p>

        <ul>
            <li><code>GET /api/tarefas</code> — lista as tarefas</li>
            <li><code>POST /api/tarefas</code> — cria uma tarefa</li>
            <li><code>PATCH /api/tarefas/{id}</code> — conclui ou reabre</li>
            <li><code>DELETE /api/tarefas/{id}</code> — remove</li>
            <li><code>GET /up</code> — saúde do serviço</li>
        </ul>

        <p>O contrato completo está no README do repositório.</p>
    </body>
</html>
