import { Locator, Page, expect } from '@playwright/test';

export const SMOKE_MARK = '#smoke';

export class TaskScreen {
  constructor(private readonly page: Page) {}

  static uniqueTitle(prefix = 'Tarefa'): string {
    return `${prefix} ${Math.random().toString(36).slice(2, 8)} ${SMOKE_MARK}`;
  }

  async open(): Promise<void> {
    await this.page.goto('/');
    await this.waitUntilLoaded();
  }

  async reload(): Promise<void> {
    await this.page.reload();
    await this.waitUntilLoaded();
  }

  async waitUntilLoaded(): Promise<void> {
    await expect(this.page.getByText('Carregando tarefas…')).toHaveCount(0);
  }

  titleField(): Locator {
    return this.page.getByLabel('Nova tarefa');
  }

  submitButton(): Locator {
    return this.page.getByRole('button', { name: 'Adicionar' });
  }

  item(title: string): Locator {
    return this.page.getByRole('listitem').filter({ hasText: title });
  }

  checkbox(title: string): Locator {
    return this.page.getByRole('checkbox', { name: title });
  }

  removeButton(title: string): Locator {
    return this.item(title).getByRole('button', { name: 'Remover' });
  }

  async setCompleted(title: string, completed: boolean): Promise<void> {
    const checkbox = this.checkbox(title);

    await (completed ? checkbox.check() : checkbox.uncheck());
    await this.waitUntilSettled(title);
  }

  async waitUntilSettled(title: string): Promise<void> {
    await expect(this.item(title)).not.toHaveAttribute('aria-busy', 'true');
  }

  async create(title: string): Promise<void> {
    await this.titleField().fill(title);
    await this.submitButton().click();
    await expect(this.item(title)).toBeVisible();
  }

  async remove(title: string): Promise<void> {
    await this.removeButton(title).click();
    await expect(this.item(title)).toHaveCount(0);
  }
}
