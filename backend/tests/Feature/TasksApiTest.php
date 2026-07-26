<?php

namespace Tests\Feature;

use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class TasksApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_list_returns_a_plain_array_ordered_by_id(): void
    {
        $this->storeTask(3, 'Tarefa 3', false, '2026-01-02 10:00:00');
        $this->storeTask(1, 'Tarefa 1', false, '2026-01-01 10:00:00');
        $this->storeTask(2, 'Tarefa 2', true, '2026-01-03 10:00:00');

        $response = $this->getJson('/api/tarefas');

        $response->assertOk();
        $response->assertJsonIsArray();

        $this->assertSame([
            ['id' => 1, 'title' => 'Tarefa 1', 'completed' => false],
            ['id' => 2, 'title' => 'Tarefa 2', 'completed' => true],
            ['id' => 3, 'title' => 'Tarefa 3', 'completed' => false],
        ], $response->json());
    }

    public function test_list_of_an_empty_database_returns_an_empty_array(): void
    {
        $response = $this->getJson('/api/tarefas');

        $response->assertOk();
        $this->assertSame([], $response->json());
    }

    public function test_list_does_not_create_tasks(): void
    {
        $this->getJson('/api/tarefas')->assertOk();

        $this->assertSame(0, Task::count());
        $this->assertFileDoesNotExist(storage_path('tarefas.json'));
    }

    public function test_valid_creation_returns_201_with_the_persisted_task(): void
    {
        $this->storeTask(1, 'Tarefa 1', false, '2026-01-01 10:00:00');

        $response = $this->postJson('/api/tarefas', ['title' => 'Revisar especificação']);

        $response->assertCreated();

        $this->assertSame(
            ['id' => 2, 'title' => 'Revisar especificação', 'completed' => false],
            $response->json()
        );

        $this->assertDatabaseHas('tasks', [
            'id' => 2,
            'title' => 'Revisar especificação',
            'completed' => false,
        ]);
    }

    public function test_creation_always_starts_incomplete(): void
    {
        $response = $this->postJson('/api/tarefas', [
            'title' => 'Tarefa criada como concluída',
            'completed' => true,
        ]);

        $response->assertCreated();
        $this->assertFalse($response->json('completed'));
    }

    public function test_creation_accepts_a_title_with_the_maximum_length(): void
    {
        $title = str_repeat('a', 255);

        $response = $this->postJson('/api/tarefas', ['title' => $title]);

        $response->assertCreated();
        $this->assertSame($title, $response->json('title'));
    }

    public function test_a_removed_id_is_not_reused_by_the_next_task(): void
    {
        $created = $this->postJson('/api/tarefas', ['title' => 'Tarefa 1'])->json('id');

        $this->deleteJson("/api/tarefas/{$created}")->assertNoContent();

        $next = $this->postJson('/api/tarefas', ['title' => 'Tarefa 2'])->json('id');

        $this->assertGreaterThan($created, $next);
    }

    public function test_creation_trims_the_title(): void
    {
        $response = $this->postJson('/api/tarefas', ['title' => '   Revisar especificação   ']);

        $response->assertCreated();
        $this->assertSame('Revisar especificação', $response->json('title'));
        $this->assertDatabaseHas('tasks', ['title' => 'Revisar especificação']);
    }

    /** @param array<string, mixed> $payload */
    #[DataProvider('invalidCreationPayloads')]
    public function test_invalid_creation_returns_422_and_persists_nothing(array $payload): void
    {
        $response = $this->postJson('/api/tarefas', $payload);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('title');

        $this->assertSame(0, Task::count());
    }

    /** @return array<string, array{0: array<string, mixed>}> */
    public static function invalidCreationPayloads(): array
    {
        return [
            'title ausente' => [[]],
            'title só com espaços' => [['title' => '   ']],
            'title numérico' => [['title' => 42]],
            'title acima de 255' => [['title' => str_repeat('a', 256)]],
        ];
    }

    public function test_validation_failure_keeps_the_laravel_error_shape(): void
    {
        $response = $this->postJson('/api/tarefas', []);

        $response->assertUnprocessable();
        $response->assertHeader('Content-Type', 'application/json');

        $body = $response->json();

        $this->assertSame(['message', 'errors'], array_keys($body));
        $this->assertSame(['title'], array_keys($body['errors']));
        $this->assertIsString($body['errors']['title'][0]);
    }

    public function test_removing_an_existing_task_returns_204_without_body(): void
    {
        $this->storeTask(1, 'Tarefa 1', false, '2026-01-01 10:00:00');
        $this->storeTask(2, 'Tarefa 2', true, '2026-01-02 10:00:00');

        $response = $this->deleteJson('/api/tarefas/2');

        $response->assertNoContent();

        $this->assertDatabaseMissing('tasks', ['id' => 2]);
        $this->assertDatabaseHas('tasks', ['id' => 1]);
    }

    public function test_removing_a_task_that_does_not_exist_returns_404(): void
    {
        $this->storeTask(1, 'Tarefa 1', false, '2026-01-01 10:00:00');

        $response = $this->deleteJson('/api/tarefas/999');

        $response->assertNotFound();

        $this->assertSame(1, Task::count());
    }

    public function test_api_does_not_expose_lookup_by_id(): void
    {
        $this->getJson('/api/tarefas/1')->assertMethodNotAllowed();
    }

    public function test_api_does_not_expose_full_update(): void
    {
        $this->storeTask(1, 'Tarefa 1', false, '2026-01-01 10:00:00');

        $this->putJson('/api/tarefas/1', ['title' => 'Outro título', 'completed' => true])
            ->assertMethodNotAllowed();

        $this->assertDatabaseHas('tasks', ['id' => 1, 'title' => 'Tarefa 1']);
    }

    public function test_previous_unprefixed_path_no_longer_exists(): void
    {
        $this->getJson('/tarefas')->assertNotFound();
    }

    public function test_write_does_not_start_a_session(): void
    {
        $response = $this->postJson('/api/tarefas', ['title' => 'Tarefa sem sessão']);

        $response->assertCreated();
        $this->assertSame([], $response->headers->getCookies());
    }

    private function storeTask(int $id, string $title, bool $completed, string $createdAt): void
    {
        (new Task)->forceFill([
            'id' => $id,
            'title' => $title,
            'completed' => $completed,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ])->save();
    }
}
