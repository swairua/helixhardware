# Backend Authorization Troubleshooting

## Problem Summary
- Frontend: ✅ All authorization checks pass
- Backend: ❌ API returns 403 Forbidden when updating company settings
- API Endpoint: `PUT /api?action=update&table=companies`
- User: admin (role=admin, status=active, company_id=1)

## Frontend is Correct ✅
The frontend sends properly:
```
PUT /api?action=update&table=companies&where=id%3D%271%27
Authorization: Bearer {valid_jwt_token}
Content-Type: application/json

{
  "name": "MEDICAL SUPPLIES",
  "email": "...",
  "phone": "...",
  "currency": "KES",
  ...
}
```

All frontend checks pass:
- User role: admin ✓
- User status: active ✓
- Company ID assigned: 1 ✓
- Company ID matches: Yes ✓
- Company exists: Yes ✓

## Key Finding: Backend Blocks Companies Table Updates

The backend **authorizes the user** for general updates (as shown in SQL Authorization Diagnostics), but **specifically blocks updates to the companies table**.

Frontend logs show:
- ✅ profiles table updates work (confirmed in backend logs)
- ❌ companies table updates fail with 403 Forbidden

This suggests the `companies` table has **table-specific authorization rules** that are more restrictive than other tables.

---

## Backend Issues to Check

### 1. Check Company Update Authorization Rules

**What to check in backend code:**

The backend needs to have authorization logic for the `companies` table specifically. Look for something like:

```php
function authorize_companies_update($user_id, $company_id) {
  $user = get_user($user_id);

  // Check 1: Is user admin?
  if ($user['role'] !== 'admin') {
    return ['authorized' => false, 'reason' => 'Not admin'];
  }

  // Check 2: Is user's company matching the record being updated?
  if ($user['company_id'] !== $company_id) {
    return ['authorized' => false, 'reason' => 'Company mismatch'];
  }

  // Check 3: Does user have explicit permission to update companies?
  if (!user_has_permission($user_id, 'update_company_settings')) {
    return ['authorized' => false, 'reason' => 'No update permission'];
  }

  return ['authorized' => true];
}
```

**Common backend issues:**
- ❌ Authorization check is missing the company ID matching logic
- ❌ Authorization check requires a permission that admin doesn't have
- ❌ Authorization check is looking for wrong permission name
- ❌ Row-level security is blocking updates to the company record

**To verify user exists and has correct role:**
```sql
-- Check if user exists and has correct role
SELECT id, email, role, status, company_id FROM users WHERE email = 'admin@mail.com';
```

**Expected output:**
```
id    | email            | role  | status | company_id
------|------------------|-------|--------|----------
UUID  | admin@mail.com   | admin | active | 1
```

**Common issues:**
- Role is `'Admin'` (uppercase) instead of `'admin'` (lowercase)
- Status is not exactly `'active'` (might be 'pending', 'inactive', NULL)
- Company_id is NULL or doesn't match company being edited

---

### 2. Check Role Definition in Backend Database

**What to check:**
```sql
-- Check if admin role is defined
SELECT id, name, company_id FROM roles WHERE name = 'admin' AND company_id = 1;

-- If above returns nothing, check for 'admin' role without company filter
SELECT id, name, company_id FROM roles WHERE name = 'admin';

-- Check what permissions are assigned to admin role
SELECT 
  r.id, 
  r.name, 
  GROUP_CONCAT(p.name) as permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'admin'
GROUP BY r.id;
```

**Expected output:**
- Should have a row for admin role
- Should have permissions including something like `'update_companies'`, `'edit_companies'`, or `'admin'`

**Common issues:**
- Role definition doesn't exist in `roles` table
- Role exists but permissions table is empty
- Permission names don't match what the API expects

---

### 3. Check User Role Assignment

**What to check:**
```sql
-- Check if user is assigned the admin role
SELECT 
  u.id, 
  u.email, 
  u.role as user_role_string,
  r.id as role_id,
  r.name as role_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'admin@mail.com';

-- Alternative if user_roles table doesn't exist (if role is stored directly)
SELECT id, email, role FROM users WHERE email = 'admin@mail.com';
```

**Expected output:**
- User should be linked to admin role (either via user_roles table or role field)
- Role name should be 'admin'

**Common issues:**
- user_roles table is empty (user not assigned to any role)
- User role field is NULL
- User is assigned to wrong role (e.g., 'accountant' instead of 'admin')

---

### 4. Check API Authorization Logic

**Location:** Find the authorization check in your backend code (typically in the API handler for the `update` action)

**What it should check:**
```php
// Pseudocode of what backend authorization should do
function authorize_update($user_id, $table, $record_id) {
  // 1. Get user record
  $user = get_user($user_id);
  
  // 2. Check if user is admin (critical step)
  if (strtolower($user['role']) !== 'admin') {
    return ['error' => 'User is not admin'];
  }
  
  // 3. Check if user is active
  if ($user['status'] !== 'active') {
    return ['error' => 'User account is not active'];
  }
  
  // 4. Check if user has company assignment
  if (empty($user['company_id'])) {
    return ['error' => 'User is not assigned to a company'];
  }
  
  // 5. Check if updating company matches user's company
  if ($table === 'companies') {
    $company = get_company($record_id);
    if ($company['id'] != $user['company_id']) {
      return ['error' => 'Cannot edit company outside your organization'];
    }
  }
  
  return ['authorized' => true];
}
```

**Check these things in your backend:**
- [ ] User role check is NOT case-sensitive (handles "Admin", "ADMIN", "admin")
- [ ] User status is checked for 'active'
- [ ] Company ID is validated
- [ ] Company ownership is checked

---

### 5. Check Token/JWT Validation

**What to check:**
The JWT token from the frontend should contain:
```javascript
{
  "sub": "user_id_uuid",
  "email": "admin@mail.com",
  "role": "admin",
  "company_id": "1",
  "status": "active",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Backend code should verify:**
```php
// 1. Token signature is valid (JWT_SECRET matches)
// 2. Token is not expired (check 'exp' claim)
// 3. Extract claims and validate role/permissions
// 4. Don't just check token exists - validate the claims inside
```

**Common issues:**
- JWT_SECRET on backend doesn't match frontend's token generation
- Token expiration check is missing
- Claims inside token are not being verified

---

### 6. Check Company Record Status

**What to check:**
```sql
-- Check if company exists and is active
SELECT id, name, status FROM companies WHERE id = 1;
```

**Expected output:**
```
id | name            | status
---|-----------------|-------
1  | MEDICAL SUPPLIES| active
```

**Common issues:**
- Company doesn't exist (ID is wrong)
- Company status is 'inactive' or 'deleted'

---

## Companies Table Specific Authorization

Since other tables (like `profiles`) can be updated successfully, but the `companies` table is blocked, the issue is likely:

1. **Backend has stricter authorization for companies table** - The update authorization logic for companies is different/stricter than for other tables
2. **Company update requires specific permission** - Maybe `update_company_settings` instead of just `admin` role
3. **Company ID matching is stricter** - Backend might require exact match between user's company_id and company being updated
4. **Soft delete or company status** - Company might be marked as deleted or archived

**To debug this, check your backend code for:**
```php
// Look for these patterns in your API handler
if ($table === 'companies') {
  // Is there a special authorization check here?
  // Is it checking something different than other tables?
}

// Or look for a specific action handler
if ($action === 'update' && $table === 'companies') {
  // Special logic for companies table updates
}
```

---

## Most Common Causes (in order of likelihood)

1. **Companies table has stricter authorization**
   - Backend has separate authorization logic for companies table
   - Check if there's a `authorizeCompaniesUpdate()` function or similar
   - **Fix:** Review and fix the authorization logic for companies table

2. **User role is case-sensitive mismatch**
   - Frontend sends: `admin`
   - Backend checks for: `Admin` (capital A)
   - **Fix:** Make backend check case-insensitive: `strtolower($user['role']) === 'admin'`

2. **JWT token is invalid or expired**
   - Token was generated with old JWT_SECRET
   - Token has expired
   - **Fix:** Ensure JWT_SECRET is the same on both frontend and backend

3. **Role not defined in backend database**
   - Admin role doesn't exist in `roles` table
   - User not linked to any role
   - **Fix:** Create role record: `INSERT INTO roles (name, company_id) VALUES ('admin', 1)`

4. **User status is not 'active'**
   - User status is NULL, 'pending', or 'inactive'
   - **Fix:** Update user: `UPDATE users SET status = 'active' WHERE email = 'admin@mail.com'`

5. **Company ID mismatch**
   - User's company_id (1) doesn't match company being edited
   - **Fix:** Verify company IDs match in database

6. **Missing permission check**
   - Backend checks for specific permission (like `update_companies`)
   - User doesn't have that permission assigned
   - **Fix:** Assign permission to admin role

---

## Debug Steps (in order)

1. ✅ Run `TokenDebugDiagnostics` button in frontend - Token is valid
2. ✅ Run `SQL Authorization Diagnostics` button - User is authorized
3. ⚠️ **But companies table update still fails** - This means table-specific rules are blocking it
4. Check backend API code for `companies` table authorization handler
5. Look for special authorization logic that only applies to companies table
6. Check if companies table has row-level security that blocks the update
7. Verify admin role has permission to update companies (might need specific permission name)
8. Check backend API logs when attempting company update (look for table-specific messages)
9. Verify JWT_SECRET matches between frontend and backend

---

## Frontend Logging for Debugging

When the 403 error occurs, the frontend logs detailed info. Open browser DevTools Console (F12) and look for:

```javascript
🔍 403 Permission Denied - Full Debug Info: {
  userRole: "admin",
  userStatus: "active", 
  userCompanyId: "1",
  editingCompanyId: "1",
  authTokenPresent: true,
  tokenPreview: "eyJhbGciOiJIUzI1NiIs...",
  errorMessage: "...",
  fullError: Error object
}
```

Copy this info and use it to debug the backend.

---

## Quick Fix Checklist

**General Authorization:**
- [x] User role is lowercase 'admin' ✓
- [x] User status is 'active' ✓
- [x] User has company_id = 1 ✓
- [ ] Company with id = 1 exists in database
- [ ] Admin role is defined in roles table
- [ ] Admin role has necessary permissions assigned
- [ ] JWT_SECRET on backend matches frontend
- [ ] JWT token is not expired
- [ ] User is assigned to admin role (if using separate user_roles table)

**Companies Table Specific (CRITICAL):**
- [ ] Backend authorization check includes companies table
- [ ] Companies table authorization matches user's company_id
- [ ] Admin role has permission to update companies (check permission name)
- [ ] Companies table doesn't have row-level security blocking updates
- [ ] No special company status check blocking updates
- [ ] Backend has authorization logic for the UPDATE action on companies table

---

## Contact & Support

If after checking all of these the issue persists:
1. Check the backend API logs for the actual error message
2. Verify the 'helixgeneralhardware.com' API is running and configured correctly
3. Check network tab in browser DevTools to see exact API response
