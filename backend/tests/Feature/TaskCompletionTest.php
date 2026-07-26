<?php

namespace Tests\Feature;

use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class TaskCompletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_completing_a_task_returns_200_with_the_updated_task(): void
    {
        $task = Task::create(['title' => 'Tarefa 1', 'completed' => false]);

        $response = $this->patchJson("/api/tarefas/{$task->id}", ['completed' => true]);

        $response->assertOk();

        $this->assertSame(
            ['id' => $task->id, 'title' => 'Tarefa 1', 'completed' => true],
            $response->json()
        );

        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'completed' => true]);
    }

    public function test_reopening_a_task_returns_200_with_the_updated_task(): void
    {
        $task = Task::create(['title' => 'Tarefa 1', 'completed' => true]);

        $response = $this->patchJson("/api/tarefas/{$task->id}", ['completed' => false]);

        $response->assertOk();

        $this->assertSame(
            ['id' => $task->id, 'title' => 'Tarefa 1', 'completed' => false],
            $response->json()
        );

        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'completed' => false]);
    }

    public function test_repeating_the_same_state_is_idempotent(): void
    {
        $task = Task::create(['title' => 'Tarefa 1', 'completed' => false]);

        $first = $this->patchJson("/api/tarefas/{$task->id}", ['completed' => true]);
        $second = $this->patchJson("/api/tarefas/{$task->id}", ['completed' => true]);

        $first->assertOk();
        $second->assertOk();

        $this->assertSame($first->json(), $second->json());
        $this->assertTrue($second->json('completed'));
    }

    public function test_completion_ignores_fields_outside_the_contract(): void
    {
        $task = Task::create(['title' => 'Tarefa 1', 'completed' => false]);

        $response = $this->patchJson("/api/tarefas/{$task->id}", [
            'completed' => true,
            'title' => 'Título alterado por engano',
            'id' => 999,
        ]);

        $response->assertOk();

        $this->assertSame(
            ['id' => $task->id, 'title' => 'Tarefa 1', 'completed' => true],
            $response->json()
        );
    }

    /** @param array<string, mixed> $payload */
    #[DataProvider('invalidCompletionPayloads')]
    public function test_invalid_completion_returns_422_and_does_not_change_the_task(array $payload): void
    {
        $task = Task::create(['title' => 'Tarefa 1', 'completed' => false]);

        $response = $this->patchJson("/api/tarefas/{$task->id}", $payload);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('completed');

        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'completed' => false]);
    }

    /** @return array<string, array{0: array<string, mixed>}> */
    public static function invalidCompletionPayloads(): array
    {
        return [
            'payload vazio' => [[]],
            'completed como texto' => [['completed' => 'true']],
            'completed numérico fora do domínio' => [['completed' => 2]],
            'completed como lista' => [['completed' => [true]]],
        ];
    }

    public function test_invalid_completion_keeps_the_laravel_error_shape(): void
    {
        $task = Task::create(['title' => 'Tarefa 1', 'completed' => false]);

        $response = $this->patchJson("/api/tarefas/{$task->id}", ['completed' => 'sim']);

        $response->assertUnprocessable();
        $response->assertHeader('Content-Type', 'application/json');

        $body = $response->json();

        $this->assertSame(['message', 'errors'], array_keys($body));
        $this->assertSame(['completed'], array_keys($body['errors']));
        $this->assertIsString($body['errors']['completed'][0]);
    }

    public function test_completing_a_task_that_does_not_exist_returns_404(): void
    {
        Task::create(['title' => 'Tarefa 1', 'completed' => false]);

        $response = $this->patchJson('/api/tarefas/999', ['completed' => true]);

        $response->assertNotFound();

        $this->assertDatabaseHas('tasks', ['id' => 1, 'completed' => false]);
    }
}
