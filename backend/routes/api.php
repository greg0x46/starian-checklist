<?php

use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

Route::get('/tarefas', [TaskController::class, 'index']);
Route::post('/tarefas', [TaskController::class, 'store']);
Route::patch('/tarefas/{task}', [TaskController::class, 'update']);
Route::delete('/tarefas/{task}', [TaskController::class, 'destroy']);
