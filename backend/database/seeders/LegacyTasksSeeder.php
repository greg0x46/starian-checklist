<?php

namespace Database\Seeders;

use App\Models\Task;
use Illuminate\Database\Seeder;

/** Carrega a fixture do JSON legado sem sobrescrever o que já está no banco. */
class LegacyTasksSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('legacy/tarefas.json');

        if (! is_file($path)) {
            return;
        }

        $tasks = json_decode(file_get_contents($path), associative: true, flags: JSON_THROW_ON_ERROR);

        foreach ($tasks as $task) {
            if (Task::whereKey($task['id'])->doesntExist()) {
                $model = (new Task)->fill([
                    'title' => $task['title'],
                    'completed' => $task['completed'],
                ]);
                $model->id = $task['id'];
                $model->save();
            }
        }
    }
}
