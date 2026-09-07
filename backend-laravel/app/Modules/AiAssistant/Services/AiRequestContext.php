<?php

namespace App\Modules\AiAssistant\Services;

use App\Support\AdminContext;
use App\User;
use Illuminate\Http\Request;

class AiRequestContext
{
    /** @var Request */
    public $request;

    /** @var User|null */
    public $user;

    /** @var int|null */
    public $institutionId;

    /** @var string */
    public $roleSlug;

    /** @var string */
    public $locale;

    /** @var array */
    public $permissions = [];

    public function __construct(Request $request, $user = null, $locale = 'en')
    {
        $this->request = $request;
        $this->user = $user;
        $this->institutionId = $user ? AdminContext::activeInstitutionId($request, $user) : null;
        $this->roleSlug = $this->resolveRoleSlug($user);
        $this->locale = $locale ?: 'en';
        $this->permissions = $user && method_exists($user, 'getPermissionNames')
            ? $user->getPermissionNames()->all()
            : [];
    }

    public function isAuthenticated()
    {
        return (bool) $this->user;
    }

    public function hasRole($roles)
    {
        if (! $this->user) {
            return false;
        }
        $roles = (array) $roles;

        return $this->user->hasRole($roles);
    }

    public function hasPermission($names)
    {
        if (! $this->user) {
            return false;
        }
        foreach ((array) $names as $name) {
            try {
                if ($this->user->hasPermissionTo($name) || $this->user->can($name)) {
                    return true;
                }
            } catch (\Throwable $e) {
                // Permission may not exist yet.
            }
            $module = strpos($name, '.') !== false ? explode('.', $name)[0] : null;
            if ($module) {
                try {
                    if ($this->user->hasPermissionTo($module.'.manage') || $this->user->can($module.'.manage')) {
                        return true;
                    }
                } catch (\Throwable $e) {
                }
            }
        }

        return false;
    }

    protected function resolveRoleSlug($user)
    {
        if (! $user) {
            return 'guest';
        }
        $preferred = [
            'system-super-admin', 'super-admin', 'institution-admin', 'admin',
            'registrar', 'registry', 'finance-officer', 'hod', 'head-of-department',
            'teacher', 'student', 'hr-officer', 'staff',
        ];
        foreach ($preferred as $role) {
            if ($user->hasRole($role)) {
                return $role;
            }
        }
        $first = $user->getRoleNames()->first();

        return $first ?: 'institution_user';
    }
}
