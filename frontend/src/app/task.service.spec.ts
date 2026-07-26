import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../environments/environment';
import { Task } from './task.model';
import { TaskService } from './task.service';

const API_URL = `${environment.apiBaseUrl}/tarefas`;

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lists tasks with a GET on the collection', () => {
    const response: Task[] = [
      { id: 1, title: 'Tarefa 1', completed: false },
      { id: 2, title: 'Tarefa 2', completed: true },
    ];
    let received: Task[] | undefined;

    service.list().subscribe((tasks) => (received = tasks));

    const request = httpMock.expectOne(API_URL);
    expect(request.request.method).toBe('GET');

    request.flush(response);
    expect(received).toEqual(response);
  });

  it('creates a task with a POST carrying only the title', () => {
    let received: Task | undefined;

    service.create('Revisar especificação').subscribe((task) => (received = task));

    const request = httpMock.expectOne(API_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ title: 'Revisar especificação' });

    request.flush({ id: 3, title: 'Revisar especificação', completed: false });
    expect(received).toEqual({ id: 3, title: 'Revisar especificação', completed: false });
  });

  it('sends the desired state with a PATCH on the task', () => {
    let received: Task | undefined;

    service.setCompleted(7, true).subscribe((task) => (received = task));

    const request = httpMock.expectOne(`${API_URL}/7`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ completed: true });

    request.flush({ id: 7, title: 'Tarefa 7', completed: true });
    expect(received).toEqual({ id: 7, title: 'Tarefa 7', completed: true });
  });

  it('reopens a task with the same PATCH and completed false', () => {
    service.setCompleted(7, false).subscribe();

    const request = httpMock.expectOne(`${API_URL}/7`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ completed: false });

    request.flush({ id: 7, title: 'Tarefa 7', completed: false });
  });

  it('removes a task with a DELETE and no body', () => {
    let completed = false;

    service.remove(4).subscribe({ complete: () => (completed = true) });

    const request = httpMock.expectOne(`${API_URL}/4`);
    expect(request.request.method).toBe('DELETE');
    expect(request.request.body).toBeNull();

    request.flush(null, { status: 204, statusText: 'No Content' });
    expect(completed).toBe(true);
  });

  it('propagates the HTTP error instead of returning fallback data', () => {
    let error: HttpErrorResponse | undefined;
    let received: Task[] | undefined;

    service.list().subscribe({
      next: (tasks) => (received = tasks),
      error: (failure: HttpErrorResponse) => (error = failure),
    });

    httpMock.expectOne(API_URL).flush(null, { status: 500, statusText: 'Internal Server Error' });

    expect(received).toBeUndefined();
    expect(error?.status).toBe(500);
  });

  it('propagates the validation error of an invalid creation', () => {
    let error: HttpErrorResponse | undefined;

    service.create('x').subscribe({
      error: (failure: HttpErrorResponse) => (error = failure),
    });

    httpMock.expectOne(API_URL).flush(
      { message: 'The title field is required.', errors: { title: ['The title field is required.'] } },
      { status: 422, statusText: 'Unprocessable Content' }
    );

    expect(error?.status).toBe(422);
  });
});
