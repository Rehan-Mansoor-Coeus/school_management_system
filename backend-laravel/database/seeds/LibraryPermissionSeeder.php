<?php

use App\Permission;
use App\Role;
use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;

/**
 * Seeds Library Management permissions and the (optional) librarian role.
 *
 * Idempotent and additive: it never removes existing permissions from other
 * roles. Permissions remain fully database-driven; admins can attach any of
 * these to any role afterwards.
 */
class LibraryPermissionSeeder extends Seeder
{
    public function run()
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            'view_library_menu',
            'manage_library_settings',
            'manage_book_categories',
            'register_books',
            'manage_book_copies',
            'view_books',
            'borrow_books',
            'view_own_borrow_requests',
            'approve_borrow_requests',
            'reject_borrow_requests',
            'issue_books',
            'return_books',
            'view_borrowed_books',
            'view_due_for_return',
            'send_library_reminders',
            'view_overdue_books',
            'manage_library_fines',
            'view_library_reports',
            'view_frequently_signed_books',
            'rate_books',
            'comment_on_books',
        ];

        foreach ($permissions as $name) {
            Permission::firstOrCreate(['name' => $name], ['guard_name' => 'api']);
        }

        // Permissions a regular borrower (any active user) needs.
        $borrowerPermissions = [
            'view_library_menu',
            'view_books',
            'borrow_books',
            'view_own_borrow_requests',
            'view_frequently_signed_books',
            'rate_books',
            'comment_on_books',
        ];

        // Full library administration (librarian).
        $librarianPermissions = $permissions;

        // Librarian role (seeded if missing). Roles stay database-driven.
        $librarian = Role::firstOrCreate(['name' => 'librarian'], ['guard_name' => 'api']);
        $this->grant($librarian, $librarianPermissions);

        // Give admin-type roles full library access (additive).
        foreach (['super-admin', 'system-super-admin', 'institution-admin', 'admin'] as $roleName) {
            $role = Role::where('name', $roleName)->where('guard_name', 'api')->first();
            if ($role) {
                $this->grant($role, $librarianPermissions);
            }
        }

        // Allow standard people-roles to borrow (every active user can borrow).
        foreach (['teacher', 'student', 'staff'] as $roleName) {
            $role = Role::where('name', $roleName)->where('guard_name', 'api')->first();
            if ($role) {
                $this->grant($role, $borrowerPermissions);
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    protected function grant(Role $role, array $permissions): void
    {
        foreach ($permissions as $permission) {
            if (! $role->hasPermissionTo($permission)) {
                $role->givePermissionTo($permission);
            }
        }
    }
}
