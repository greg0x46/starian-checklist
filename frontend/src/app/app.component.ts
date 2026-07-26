import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { Task } from './task.model';
import { TaskService } from './task.service';

type LoadStatus = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly destroyRef = inject(DestroyRef);

  readonly title = 'Lista de tarefas';

  tasks: Task[] = [];
  loadStatus: LoadStatus = 'loading';

  newTaskTitle = '';
  creating = false;
  createError = '';

  mutationError = '';

  private readonly pendingIds = new Set<number>();
  private mutatedDuringLoad = false;

  ngOnInit(): void {
    this.loadTasks();
  }

  isPending(id: number): boolean {
    return this.pendingIds.has(id);
  }

  get listMayBeIncomplete(): boolean {
    return this.loadStatus === 'error' && this.tasks.length > 0;
  }

  loadTasks(): void {
    this.loadStatus = 'loading';
    this.mutationError = '';
    this.mutatedDuringLoad = false;

    this.taskService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tasks) => {
          if (this.mutatedDuringLoad) {
            this.loadTasks();
            return;
          }

          this.tasks = tasks;
          this.loadStatus = 'ready';
        },
        error: () => {
          this.loadStatus = 'error';
        },
      });
  }

  get canCreate(): boolean {
    const titleLength = this.newTaskTitle.trim().length;

    return !this.creating && titleLength > 0 && titleLength <= 255;
  }

  createTask(): void {
    const title = this.newTaskTitle.trim();

    if (title === '' || !this.canCreate) {
      return;
    }

    this.creating = true;
    this.createError = '';

    this.taskService
      .create(title)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (task) => {
          this.tasks = [...this.tasks, task];
          this.newTaskTitle = '';
          this.creating = false;
          this.mutatedDuringLoad = true;
        },
        error: (error: HttpErrorResponse) => {
          this.createError =
            error.status === 422
              ? 'Título inválido. Use entre 1 e 255 caracteres.'
              : 'Não foi possível adicionar a tarefa. Tente novamente.';
          this.creating = false;
        },
      });
  }

  setCompleted(task: Task, completed: boolean): void {
    if (this.isPending(task.id)) {
      return;
    }

    this.pendingIds.add(task.id);
    this.mutationError = '';
    this.replaceTask({ ...task, completed });

    this.taskService
      .setCompleted(task.id, completed)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.replaceTask(updated);
          this.pendingIds.delete(task.id);
          this.mutatedDuringLoad = true;
        },
        error: () => {
          this.replaceTask(task);
          this.pendingIds.delete(task.id);
          this.mutationError = `Não foi possível atualizar “${task.title}”. Tente novamente.`;
        },
      });
  }

  removeTask(task: Task): void {
    if (this.isPending(task.id)) {
      return;
    }

    this.pendingIds.add(task.id);
    this.mutationError = '';

    this.taskService
      .remove(task.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.tasks = this.tasks.filter((item) => item.id !== task.id);
          this.pendingIds.delete(task.id);
          this.mutatedDuringLoad = true;
        },
        error: () => {
          this.pendingIds.delete(task.id);
          this.mutationError = `Não foi possível remover “${task.title}”. Tente novamente.`;
        },
      });
  }

  private replaceTask(task: Task): void {
    this.tasks = this.tasks.map((item) => (item.id === task.id ? task : item));
  }
}
