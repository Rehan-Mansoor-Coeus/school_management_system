# Institute Assignment System Documentation

## Overview
The institute assignment system allows users to be assigned to multiple institutions and restricts data access to only their assigned institutes.

## Key Concepts

### Many-to-Many Relationship
- **Users ↔ Institutions**: Users can belong to multiple institutions
- **Primary Institution**: Each user can have one primary institution (marked with `is_primary = true`)
- **Backward Compatible**: The existing `institution_id` column on users table is maintained

## Database Schema

### institution_user Pivot Table
```
- id (PK)
- user_id (FK) → users.id
- institution_id (FK) → institutions.id
- is_primary (boolean, default: false)
- created_at
- updated_at
```

## User Model Methods

### Relationships
```php
// Get all institutions assigned to user
$user->institutions();  // Returns collection of Institution models

// Get single institution (legacy)
$user->institution();  // Returns the first or primary institution
```

### Helper Methods
```php
// Get the primary institution or the first one
$primary = $user->getPrimaryInstitution();

// Check if user has access to a specific institution
$hasAccess = $user->hasInstitution($institutionId);
```

## Institution Model Methods

### Relationships
```php
// Get all users assigned to institution
$institution->users();  // Returns collection of User models
```

## API Endpoints

### Retrieve User's Institutions
```
GET /api/users/{userId}/institutions
Headers: Authorization: Bearer {token}
Response: { user_id, institutions: [...] }
```

### Assign Institution to User
```
POST /api/users/{userId}/institutions
Body: { institution_id: 123, is_primary: false }
Headers: Authorization: Bearer {token}
Note: Requires users.edit permission
```

### Assign Multiple Institutions
```
POST /api/users/{userId}/institutions/assign-multiple
Body: { 
  institution_ids: [123, 456, 789],
  primary_id: 123 
}
Headers: Authorization: Bearer {token}
Note: Replaces all existing assignments
```

### Remove Institution from User
```
DELETE /api/users/{userId}/institutions/{institutionId}
Headers: Authorization: Bearer {token}
Note: Requires users.edit permission
```

### Set Primary Institution
```
POST /api/users/{userId}/institutions/{institutionId}/set-primary
Headers: Authorization: Bearer {token}
Note: Requires users.edit permission
```

### Get All Users in Institution
```
GET /api/institutions/{institutionId}/users?per_page=15
Headers: Authorization: Bearer {token}
Response: Paginated list of users
Note: User must have access to the institution
```

### Get User's Primary Institution
```
GET /api/my-institution
Headers: Authorization: Bearer {token}
Response: Primary institution or first assigned institution
```

### Get All User's Institutions
```
GET /api/my-institutions
Headers: Authorization: Bearer {token}
Response: { institutions: [...], primary: {...} }
```

### List All Institutions (Filtered)
```
GET /api/institutions?per_page=10&search=name&type=university&country=US
Headers: Authorization: Bearer {token}
Response: 
  - Super-admin: All institutions
  - Regular users: Only their assigned institutions
```

## Creating a User with Multiple Institutions

### Single Institution (backward compatible)
```php
POST /api/users
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure_password",
  "institution_id": 123,
  "roles": [1, 2]
}
```

### Multiple Institutions
```php
POST /api/users
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secure_password",
  "institution_ids": [123, 456, 789],
  "roles": [1, 2]
}
```

## Authorization Rules

### Super-Admin
- Can see all institutions and all users
- Can assign/remove institutions for any user
- Can manage institutions globally

### Regular Users
- Can see only their assigned institutions
- Can see only users from their assigned institutions
- When creating new users, can only assign from their own institutions
- Cannot see other users' data or institutions

## Examples

### JavaScript/Fetch
```javascript
// Get user's institutions
const response = await fetch('/api/my-institutions', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
console.log(data.institutions);
console.log(data.primary);

// Assign institution to user
const result = await fetch('/api/users/5/institutions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    institution_id: 123,
    is_primary: true
  })
});

// Assign multiple institutions
const result = await fetch('/api/users/5/institutions/assign-multiple', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    institution_ids: [123, 456, 789],
    primary_id: 123
  })
});
```

### Laravel
```php
// Get user's institutions
$user = auth()->user();
$institutions = $user->institutions()->get();
$primary = $user->getPrimaryInstitution();

// Assign institution
$user->institutions()->attach(123, ['is_primary' => true]);

// Assign multiple institutions
$user->institutions()->sync([
  123 => ['is_primary' => true],
  456 => ['is_primary' => false],
  789 => ['is_primary' => false]
]);

// Check access
if ($user->hasInstitution(123)) {
  // User has access to institution 123
}
```

## Migration Steps

### 1. Run Database Migration
```bash
php artisan migrate
```

### 2. Populate Pivot Table (Optional)
If migrating from single institution setup:
```php
// In tinker or migration
$users = User::all();
foreach ($users as $user) {
  if ($user->institution_id) {
    $user->institutions()->attach($user->institution_id, ['is_primary' => true]);
  }
}
```

### 3. Update Frontend
- Update institution selection UI to support multiple selections
- Add logic to show only user's assigned institutions
- Handle primary institution display

## Notes

- The `institution_id` field on users table is maintained for backward compatibility
- When creating a user with multiple institutions, the first one is marked as primary
- Users without any assigned institutions will return empty when listing institutions
- Super-admins can bypass all institution filters
- All institution-related actions are logged through the audit system (if enabled)
