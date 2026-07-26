import { APIRequestContext, test as base } from '@playwright/test';

import { SMOKE_MARK } from './task-screen';

const API_URL = process.env.SMOKE_API_URL ?? 'http://localhost:8000/api';

interface Task {
  id: number;
  title: string;
  completed: boolean;
}

async function removeSmokeTasks(request: APIRequestContext): Promise<void> {
  const response = await request.get(`${API_URL}/tarefas`);

  if (!response.ok()) {
    return;
  }

  const tasks: Task[] = await response.json();

  for (const task of tasks.filter((item) => item.title.includes(SMOKE_MARK))) {
    await request.delete(`${API_URL}/tarefas/${task.id}`);
  }
}

export const test = base.extend<{ cleanUpSmokeTasks: void }>({
  cleanUpSmokeTasks: [
    async ({ request }, use) => {
      await use();
      await removeSmokeTasks(request);
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
