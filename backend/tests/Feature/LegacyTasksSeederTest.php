<?php

namespace Tests\Feature;

use App\Models\Task;
use Database\Seeders\LegacyTasksSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LegacyTasksSeederTest extends TestCase
{
    use RefreshDatabase;

    private const LEGACY_TASKS = [
        ['id' => 1, 'title' => 'Tarefa 1', 'completed' => false],
        ['id' => 2, 'title' => 'Tarefa 2', 'completed' => true],
        ['id' => 3, 'title' => 'Tarefa 3', 'completed' => false],
    ];

    public function test_import_preserves_ids_titles_and_completed(): void
    {
        $this->seedLegacyTasks();

        $this->assertSame(self::LEGACY_TASKS, $this->storedTasks());
    }

    public function test_repeating_the_import_does_not_duplicate_tasks(): void
    {
        $this->seedLegacyTasks();
        $this->seedLegacyTasks();

        $this->assertSame(self::LEGACY_TASKS, $this->storedTasks());
    }

    public function test_the_next_task_uses_an_id_above_the_imported_maximum(): void
    {
        $this->seedLegacyTasks();

        $created = Task::create(['title' => 'Tarefa criada depois da importação']);

        $this->assertSame(4, $created->id);
    }

    public function test_default_seeder_does_not_import_legacy_tasks(): void
    {
        $this->artisan('db:seed')->assertSuccessful();

        $this->assertSame(0, Task::count());
    }

    private function seedLegacyTasks(): void
    {
        $this->artisan('db:seed', ['--class' => LegacyTasksSeeder::class])->assertSuccessful();
    }

    /**
     * @return array<int, array{id: int, title: string, completed: bool}>
     */
    private function storedTasks(): array
    {
        return Task::orderBy('id')
            ->get(['id', 'title', 'completed'])
            ->map(fn (Task $task) => [
                'id' => $task->id,
                'title' => $task->title,
                'completed' => $task->completed,
            ])
            ->all();
    }
}
