import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../environments/environment';
import { Task } from './task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);

  private readonly endpoint = `${environment.apiBaseUrl}/tarefas`;

  list(): Observable<Task[]> {
    return this.http.get<Task[]>(this.endpoint);
  }

  create(title: string): Observable<Task> {
    return this.http.post<Task>(this.endpoint, { title });
  }

  setCompleted(id: number, completed: boolean): Observable<Task> {
    return this.http.patch<Task>(`${this.endpoint}/${id}`, { completed });
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
