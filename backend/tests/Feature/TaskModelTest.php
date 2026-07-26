<?php

namespace Tests\Feature;

use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_id_is_generated_by_the_database(): void
    {
        $first = Task::create(['title' => 'Primeira tarefa']);
        $second = Task::create(['title' => 'Segunda tarefa']);

        $this->assertIsInt($first->id);
        $this->assertSame($first->id + 1, $second->id);
    }

    public function test_completed_defaults_to_false_and_is_cast_to_boolean(): void
    {
        $task = Task::create(['title' => 'Tarefa sem estado explícito']);

        $this->assertFalse($task->fresh()->completed);

        $completed = Task::create(['title' => 'Tarefa concluída', 'completed' => true]);

        $this->assertTrue($completed->fresh()->completed);
    }

    public function test_mass_assignment_is_limited_to_title_and_completed(): void
    {
        $task = Task::create([
            'id' => 99,
            'title' => 'Tarefa com id no payload',
            'completed' => true,
        ]);

        $this->assertNotSame(99, $task->id);
        $this->assertSame('Tarefa com id no payload', $task->title);
        $this->assertTrue($task->completed);
    }
}
