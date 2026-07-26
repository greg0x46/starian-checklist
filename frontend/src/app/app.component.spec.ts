import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { Task } from './task.model';

const API_URL = `${environment.apiBaseUrl}/tarefas`;

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function queryAll<T extends HTMLElement>(selector: string): T[] {
    return Array.from(fixture.nativeElement.querySelectorAll(selector));
  }

  function screenText(): string {
    return fixture.nativeElement.textContent as string;
  }

  function itemTitles(): string[] {
    return queryAll<HTMLElement>('.task__title').map((element) => element.textContent!.trim());
  }

  function itemOf(title: string): HTMLLIElement {
    return queryAll<HTMLLIElement>('.task').find(
      (element) => element.querySelector('.task__title')!.textContent!.trim() === title
    )!;
  }

  function checkboxOf(title: string): HTMLInputElement {
    return itemOf(title).querySelector('input[type="checkbox"]')!;
  }

  function removeButtonOf(title: string): HTMLButtonElement {
    return itemOf(title).querySelector('button')!;
  }

  function titleInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('#new-task-title');
  }

  function submitButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button[type="submit"]');
  }

  function buttonWithText(text: string): HTMLButtonElement | undefined {
    return queryAll<HTMLButtonElement>('button').find(
      (button) => button.textContent!.trim() === text
    );
  }

  function typeTitle(value: string): void {
    const input = titleInput();

    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function clickOn(element: HTMLElement): void {
    element.click();
    fixture.detectChanges();
  }

  function expectRequest(method: 'GET' | 'POST') {
    return httpMock.expectOne((request) => request.url === API_URL && request.method === method);
  }

  function loadWith(tasks: Task[]): void {
    fixture.detectChanges();
    httpMock.expectOne(API_URL).flush(tasks);
    fixture.detectChanges();
  }

  function failTheListRequest(): void {
    fixture.detectChanges();
    httpMock.expectOne(API_URL).flush(null, { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();
  }

  describe('loading the list', () => {
    it('shows the loading state and no empty message before the response arrives', () => {
      fixture.detectChanges();

      const request = httpMock.expectOne(API_URL);
      expect(request.request.method).toBe('GET');
      expect(screenText()).toContain('Carregando tarefas');
      expect(screenText()).not.toContain('Nenhuma tarefa encontrada.');

      request.flush([]);
    });

    it('renders the titles returned by the API', () => {
      loadWith([
        { id: 1, title: 'Tarefa 1', completed: false },
        { id: 2, title: 'Tarefa 2', completed: true },
      ]);

      expect(itemTitles()).toEqual(['Tarefa 1', 'Tarefa 2']);
      expect(screenText()).not.toContain('Carregando tarefas');
    });

    it('shows the empty message when the API returns no task', () => {
      loadWith([]);

      expect(itemTitles()).toEqual([]);
      expect(screenText()).toContain('Nenhuma tarefa encontrada.');
    });

    it('shows an error instead of fabricated tasks when the list fails, and retries', () => {
      failTheListRequest();

      expect(itemTitles()).toEqual([]);
      expect(screenText()).not.toContain('Nenhuma tarefa encontrada.');

      const alert = fixture.nativeElement.querySelector('[role="alert"]');
      expect(alert.textContent).toContain('Não foi possível carregar as tarefas.');

      clickOn(buttonWithText('Tentar novamente')!);

      httpMock.expectOne(API_URL).flush([{ id: 1, title: 'Tarefa 1', completed: false }]);
      fixture.detectChanges();

      expect(itemTitles()).toEqual(['Tarefa 1']);
      expect(screenText()).not.toContain('Não foi possível carregar as tarefas.');
    });

    it('keeps the tasks already known when a reload fails, and warns about the gap', () => {
      loadWith([{ id: 1, title: 'Tarefa 1', completed: false }]);

      fixture.componentInstance.loadTasks();
      fixture.detectChanges();
      httpMock.expectOne(API_URL).flush(null, { status: 500, statusText: 'Internal Server Error' });
      fixture.detectChanges();

      expect(itemTitles()).toEqual(['Tarefa 1']);
      expect(screenText()).toContain('pode estar incompleta');
      expect(buttonWithText('Tentar novamente')).toBeDefined();
    });
  });

  describe('creating a task', () => {
    it('sends the trimmed title and appends the task returned by the API', async () => {
      loadWith([]);

      typeTitle('  Revisar especificação  ');
      clickOn(submitButton());

      const request = httpMock.expectOne(API_URL);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({ title: 'Revisar especificação' });

      request.flush({ id: 4, title: 'Revisar especificação', completed: false });
      await fixture.whenStable();
      fixture.detectChanges();

      expect(itemTitles()).toEqual(['Revisar especificação']);
      expect(titleInput().value).toBe('');
    });

    it('does not send a request when the title is blank', () => {
      loadWith([]);

      typeTitle('   ');
      expect(submitButton().disabled).toBe(true);
      clickOn(submitButton());

      httpMock.expectNone(API_URL);
      expect(itemTitles()).toEqual([]);
    });

    it('applies the API title limit to the field and submit state', () => {
      loadWith([]);

      expect(titleInput().maxLength).toBe(255);

      typeTitle('a'.repeat(256));
      expect(submitButton().disabled).toBe(true);

      clickOn(submitButton());
      httpMock.expectNone(API_URL);
    });

    it('blocks a second submit while the creation is pending', () => {
      loadWith([]);

      typeTitle('Tarefa em voo');
      clickOn(submitButton());

      expect(submitButton().disabled).toBe(true);

      clickOn(submitButton());

      const request = httpMock.expectOne(API_URL);
      request.flush({ id: 6, title: 'Tarefa em voo', completed: false });
      fixture.detectChanges();

      expect(submitButton().disabled).toBe(true);
    });

    it('creates when the list failed to load, without claiming the list is complete', () => {
      failTheListRequest();

      typeTitle('Tarefa depois da falha');
      expect(submitButton().disabled).toBe(false);

      clickOn(submitButton());
      expectRequest('POST').flush({ id: 7, title: 'Tarefa depois da falha', completed: false });
      fixture.detectChanges();

      expect(itemTitles()).toEqual(['Tarefa depois da falha']);
      expect(screenText()).toContain('Não foi possível carregar as tarefas.');
      expect(screenText()).toContain('pode estar incompleta');

      clickOn(buttonWithText('Tentar novamente')!);
      expectRequest('GET').flush([
        { id: 3, title: 'Tarefa do servidor', completed: false },
        { id: 7, title: 'Tarefa depois da falha', completed: false },
      ]);
      fixture.detectChanges();

      expect(itemTitles()).toEqual(['Tarefa do servidor', 'Tarefa depois da falha']);
      expect(screenText()).not.toContain('Não foi possível carregar as tarefas.');
    });

    it('discards a list response made stale by a creation and asks the server again', () => {
      fixture.detectChanges();
      const staleList = expectRequest('GET');

      typeTitle('Tarefa criada durante o carregamento');
      clickOn(submitButton());
      expectRequest('POST').flush({
        id: 9,
        title: 'Tarefa criada durante o carregamento',
        completed: false,
      });
      fixture.detectChanges();

      staleList.flush([{ id: 1, title: 'Tarefa 1', completed: false }]);
      fixture.detectChanges();

      expect(itemTitles()).toEqual(['Tarefa criada durante o carregamento']);

      expectRequest('GET').flush([
        { id: 1, title: 'Tarefa 1', completed: false },
        { id: 9, title: 'Tarefa criada durante o carregamento', completed: false },
      ]);
      fixture.detectChanges();

      expect(itemTitles()).toEqual(['Tarefa 1', 'Tarefa criada durante o carregamento']);
    });

    it('keeps the typed text and shows an error when the creation fails', () => {
      loadWith([]);

      typeTitle('Tarefa que não foi salva');
      clickOn(submitButton());

      httpMock
        .expectOne(API_URL)
        .flush(null, { status: 500, statusText: 'Internal Server Error' });
      fixture.detectChanges();

      expect(itemTitles()).toEqual([]);
      expect(fixture.componentInstance.newTaskTitle).toBe('Tarefa que não foi salva');
      expect(screenText()).toContain('Não foi possível adicionar a tarefa.');
    });

    it('distinguishes a validation error from server unavailability', () => {
      loadWith([]);

      typeTitle('Título rejeitado');
      clickOn(submitButton());

      httpMock.expectOne(API_URL).flush(
        { message: 'The title field is invalid.', errors: { title: ['Invalid title.'] } },
        { status: 422, statusText: 'Unprocessable Content' }
      );
      fixture.detectChanges();

      expect(fixture.componentInstance.newTaskTitle).toBe('Título rejeitado');
      expect(screenText()).toContain('Título inválido. Use entre 1 e 255 caracteres.');
      expect(screenText()).not.toContain('Não foi possível adicionar a tarefa.');
    });
  });

  describe('completing and reopening a task', () => {
    it('sends the desired state and adopts the task returned by the API', () => {
      loadWith([{ id: 1, title: 'Tarefa 1', completed: false }]);

      clickOn(checkboxOf('Tarefa 1'));

      const request = httpMock.expectOne(`${API_URL}/1`);
      expect(request.request.method).toBe('PATCH');
      expect(request.request.body).toEqual({ completed: true });

      request.flush({ id: 1, title: 'Tarefa 1', completed: true });
      fixture.detectChanges();

      expect(checkboxOf('Tarefa 1').checked).toBe(true);
      expect(itemOf('Tarefa 1').textContent).toContain('Concluída');
    });

    it('reopens a completed task with completed false', () => {
      loadWith([{ id: 1, title: 'Tarefa 1', completed: true }]);

      clickOn(checkboxOf('Tarefa 1'));

      const request = httpMock.expectOne(`${API_URL}/1`);
      expect(request.request.body).toEqual({ completed: false });

      request.flush({ id: 1, title: 'Tarefa 1', completed: false });
      fixture.detectChanges();

      expect(checkboxOf('Tarefa 1').checked).toBe(false);
      expect(itemOf('Tarefa 1').textContent).toContain('Pendente');
    });

    it('rolls the checkbox back and announces the error when the update fails', () => {
      loadWith([{ id: 1, title: 'Tarefa 1', completed: false }]);

      clickOn(checkboxOf('Tarefa 1'));

      httpMock
        .expectOne(`${API_URL}/1`)
        .flush(null, { status: 500, statusText: 'Internal Server Error' });
      fixture.detectChanges();

      expect(checkboxOf('Tarefa 1').checked).toBe(false);
      expect(itemOf('Tarefa 1').textContent).toContain('Pendente');
      expect(screenText()).toContain('Não foi possível atualizar “Tarefa 1”.');
    });

    it('blocks a new mutation of the same task while one is pending, but not of the others', () => {
      loadWith([
        { id: 1, title: 'Tarefa 1', completed: false },
        { id: 2, title: 'Tarefa 2', completed: false },
      ]);

      clickOn(checkboxOf('Tarefa 1'));

      expect(checkboxOf('Tarefa 1').disabled).toBe(true);
      expect(removeButtonOf('Tarefa 1').disabled).toBe(true);
      expect(checkboxOf('Tarefa 2').disabled).toBe(false);

      clickOn(checkboxOf('Tarefa 2'));

      httpMock.expectOne(`${API_URL}/1`).flush({ id: 1, title: 'Tarefa 1', completed: true });
      httpMock.expectOne(`${API_URL}/2`).flush({ id: 2, title: 'Tarefa 2', completed: true });
      fixture.detectChanges();

      expect(checkboxOf('Tarefa 1').checked).toBe(true);
      expect(checkboxOf('Tarefa 2').checked).toBe(true);
      expect(checkboxOf('Tarefa 1').disabled).toBe(false);
    });
  });

  describe('removing a task', () => {
    it('drops the item from the list only after the API confirms', () => {
      loadWith([
        { id: 1, title: 'Tarefa 1', completed: false },
        { id: 2, title: 'Tarefa 2', completed: true },
      ]);

      clickOn(removeButtonOf('Tarefa 2'));

      const request = httpMock.expectOne(`${API_URL}/2`);
      expect(request.request.method).toBe('DELETE');
      expect(itemTitles()).toEqual(['Tarefa 1', 'Tarefa 2']);

      request.flush(null, { status: 204, statusText: 'No Content' });
      fixture.detectChanges();

      expect(itemTitles()).toEqual(['Tarefa 1']);
    });

    it('keeps the item and announces the error when the removal fails', () => {
      loadWith([{ id: 1, title: 'Tarefa 1', completed: false }]);

      clickOn(removeButtonOf('Tarefa 1'));

      httpMock
        .expectOne(`${API_URL}/1`)
        .flush(null, { status: 500, statusText: 'Internal Server Error' });
      fixture.detectChanges();

      expect(itemTitles()).toEqual(['Tarefa 1']);
      expect(screenText()).toContain('Não foi possível remover “Tarefa 1”.');
    });
  });

  describe('accessibility and list identity', () => {
    it('gives the checkbox an accessible name through the label of the task', () => {
      loadWith([{ id: 1, title: 'Tarefa 1', completed: false }]);

      const checkbox = checkboxOf('Tarefa 1');
      const label = itemOf('Tarefa 1').querySelector('label')!;

      expect(label.getAttribute('for')).toBe(checkbox.id);
      expect(label.textContent!.trim()).toBe('Tarefa 1');
    });

    it('labels the creation field with a visible label instead of a placeholder', () => {
      loadWith([]);

      const label = fixture.nativeElement.querySelector(`label[for="new-task-title"]`);

      expect(label.textContent.trim()).toBe('Nova tarefa');
      expect(titleInput().hasAttribute('placeholder')).toBe(false);
    });

    it('marks the item as busy while its mutation is pending', () => {
      loadWith([{ id: 1, title: 'Tarefa 1', completed: false }]);

      clickOn(checkboxOf('Tarefa 1'));

      expect(itemOf('Tarefa 1').getAttribute('aria-busy')).toBe('true');

      httpMock.expectOne(`${API_URL}/1`).flush({ id: 1, title: 'Tarefa 1', completed: true });
      fixture.detectChanges();

      expect(itemOf('Tarefa 1').hasAttribute('aria-busy')).toBe(false);
    });

    it('keeps the DOM element of a task that stays in the list', () => {
      loadWith([{ id: 1, title: 'Tarefa 1', completed: false }]);

      const firstItem = itemOf('Tarefa 1');

      httpMock.verify();
      fixture.componentInstance.tasks = [
        { id: 2, title: 'Tarefa 2', completed: false },
        { id: 1, title: 'Tarefa 1', completed: false },
      ];
      fixture.detectChanges();

      expect(itemTitles()).toEqual(['Tarefa 2', 'Tarefa 1']);
      expect(itemOf('Tarefa 1')).toBe(firstItem);
    });
  });
});
