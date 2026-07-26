<?php

namespace Tests\Feature;

use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use RuntimeException;
use Tests\TestCase;

class ApiErrorsTest extends TestCase
{
    use RefreshDatabase;

    public function test_unknown_api_route_responds_json_without_accept(): void
    {
        $response = $this->get('/api/unknown-route');

        $response->assertNotFound();
        $response->assertHeader('Content-Type', 'application/json');
        $this->assertIsArray($response->json());
    }

    public function test_method_not_allowed_responds_json_without_accept(): void
    {
        $response = $this->get('/api/tarefas/1');

        $response->assertMethodNotAllowed();
        $response->assertHeader('Content-Type', 'application/json');
    }

    public function test_unexpected_failure_responds_generic_json_in_production(): void
    {
        config(['app.debug' => false]);

        Route::middleware('api')->get('/api/test-failure', function () {
            throw new RuntimeException('internal detail that must not leak');
        });

        $response = $this->get('/api/test-failure');

        $response->assertServerError();
        $response->assertHeader('Content-Type', 'application/json');

        $body = $response->json();

        $this->assertSame(['message'], array_keys($body));
        $this->assertStringNotContainsString('internal detail', $body['message']);
    }

    public function test_api_error_does_not_expose_stack_trace_in_production(): void
    {
        config(['app.debug' => false]);

        $body = $this->get('/api/unknown-route')->json();

        foreach (['exception', 'file', 'line', 'trace'] as $key) {
            $this->assertArrayNotHasKey($key, $body);
        }
    }

    public function test_not_found_of_an_unknown_task_does_not_expose_the_model(): void
    {
        Task::create(['title' => 'Tarefa 1']);

        foreach ([$this->deleteJson('/api/tarefas/999'), $this->patchJson('/api/tarefas/999', ['completed' => true])] as $response) {
            $response->assertNotFound();
            $response->assertHeader('Content-Type', 'application/json');

            $body = $response->json();

            $this->assertSame(['message'], array_keys($body));

            foreach (['Task', 'App\\Models', 'No query results', 'Eloquent'] as $detail) {
                $this->assertStringNotContainsString($detail, $body['message']);
            }
        }
    }

    public function test_generic_not_found_does_not_depend_on_debug_mode(): void
    {
        config(['app.debug' => true]);

        $body = $this->deleteJson('/api/tarefas/999')->assertNotFound()->json();

        $this->assertSame(['message'], array_keys($body));
        $this->assertStringNotContainsString('App\\Models', $body['message']);
    }

    public function test_unknown_web_route_still_responds_html(): void
    {
        $response = $this->get('/unknown-page');

        $response->assertNotFound();
        $this->assertStringContainsString('text/html', (string) $response->headers->get('Content-Type'));
    }
}
