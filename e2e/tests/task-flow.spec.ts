import { expect, test } from './support/fixtures';

import { TaskScreen } from './support/task-screen';

test.describe('fluxo completo da lista de tarefas', () => {
  test('cria, conclui, reabre e remove uma tarefa, e cada estado sobrevive ao reload', async ({
    page,
  }) => {
    const screen = new TaskScreen(page);
    const title = TaskScreen.uniqueTitle();

    await screen.open();

    // Cria pelo teclado: cobre de uma vez o alcance por Tab e o submit por Enter.
    await page.keyboard.press('Tab');
    await expect(screen.titleField()).toBeFocused();
    await page.keyboard.type(title);
    await page.keyboard.press('Enter');

    await expect(screen.item(title)).toBeVisible();
    await expect(screen.titleField()).toHaveValue('');
    await expect(screen.item(title)).toContainText('Pendente');

    await screen.reload();
    await expect(screen.item(title)).toBeVisible();

    await screen.setCompleted(title, true);
    await expect(screen.item(title)).toContainText('Concluída');

    await screen.reload();
    await expect(screen.checkbox(title)).toBeChecked();

    await screen.setCompleted(title, false);
    await expect(screen.item(title)).toContainText('Pendente');

    await screen.reload();
    await expect(screen.checkbox(title)).not.toBeChecked();

    await screen.remove(title);

    await screen.reload();
    await expect(screen.item(title)).toHaveCount(0);
  });

  test('mantém a ordem do servidor entre recarregamentos', async ({ page }) => {
    const screen = new TaskScreen(page);
    const first = TaskScreen.uniqueTitle('Primeira');
    const second = TaskScreen.uniqueTitle('Segunda');

    await screen.open();
    await screen.create(first);
    await screen.create(second);

    await screen.reload();

    const titles = await page.getByRole('listitem').allInnerTexts();
    const positions = [titles.findIndex((text) => text.includes(first)), titles.findIndex((text) => text.includes(second))];

    expect(positions[0]).toBeGreaterThanOrEqual(0);
    expect(positions[1]).toBeGreaterThan(positions[0]);

    await screen.remove(first);
    await screen.remove(second);
  });

  test('declara o idioma e um título descritivo do documento', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page).toHaveTitle(/tarefas/i);
  });

  test('não envia tarefa sem título', async ({ page }) => {
    const screen = new TaskScreen(page);

    await screen.open();

    await screen.titleField().fill('   ');
    await expect(screen.submitButton()).toBeDisabled();
  });

  test('mostra erro e oferece nova tentativa quando a API não responde', async ({ page }) => {
    await page.route('**/api/tarefas', (route) => route.abort('failed'));

    await page.goto('/');

    await expect(page.getByRole('alert')).toContainText('Não foi possível carregar as tarefas.');
    await expect(page.getByRole('listitem')).toHaveCount(0);
    await expect(page.getByText('Nenhuma tarefa encontrada.')).toHaveCount(0);

    await page.unroute('**/api/tarefas');
    await page.getByRole('button', { name: 'Tentar novamente' }).click();

    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByText('Carregando tarefas…')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Adicionar' })).toBeDisabled();
  });
});
