<?php

namespace Tests;

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    private ?string $storagePath = null;

    public function createApplication(): Application
    {
        $app = require Application::inferBasePath().'/bootstrap/app.php';

        $app->useStoragePath($this->createStoragePath());

        $app->make(Kernel::class)->bootstrap();

        return $app;
    }

    protected function tearDown(): void
    {
        parent::tearDown();

        $this->deleteStoragePath();
    }

    private function createStoragePath(): string
    {
        $this->storagePath = sys_get_temp_dir().'/starian-checklist-tests/'.bin2hex(random_bytes(8));

        $directories = [
            'app',
            'framework/cache/data',
            'framework/sessions',
            'framework/testing',
            'framework/views',
            'logs',
        ];

        foreach ($directories as $directory) {
            mkdir($this->storagePath.'/'.$directory, recursive: true);
        }

        return $this->storagePath;
    }

    private function deleteStoragePath(): void
    {
        if ($this->storagePath === null || ! is_dir($this->storagePath)) {
            return;
        }

        $contents = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($this->storagePath, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ($contents as $item) {
            $item->isDir() ? rmdir($item->getPathname()) : unlink($item->getPathname());
        }

        rmdir($this->storagePath);

        $this->storagePath = null;
    }
}
