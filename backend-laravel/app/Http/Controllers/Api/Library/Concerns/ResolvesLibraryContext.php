<?php

namespace App\Http\Controllers\Api\Library\Concerns;

use App\Library\Services\LibraryService;
use App\Library\LibrarySetting;
use Illuminate\Http\Request;

trait ResolvesLibraryContext
{
    protected function institutionId(Request $request): int
    {
        return (int) (optional($request->user())->institution_id ?: 1);
    }

    protected function hasAnyPermission(Request $request, array $permissions): bool
    {
        $user = $request->user();
        if (! $user) {
            return false;
        }
        if (method_exists($user, 'hasRole') && $user->hasRole('super-admin')) {
            return true;
        }
        foreach ($permissions as $permission) {
            if ($user->hasPermissionTo($permission)) {
                return true;
            }
        }

        return false;
    }

    protected function authorizeLibrary(Request $request, array $permissions): void
    {
        if (! $this->hasAnyPermission($request, $permissions)) {
            abort(403, 'You do not have permission to perform this action.');
        }
    }

    protected function settings(Request $request): LibrarySetting
    {
        return app(LibraryService::class)->settingsFor($this->institutionId($request));
    }
}
