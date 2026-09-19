# Identity & Authentication Service - Use Cases

## Actor
- **Customer**: End user of the e-commerce platform
- **Admin**: System administrator
- **System**: Other microservices

## Use Cases

### UC-AUTH-001: User Registration
**Primary Actor**: Customer  
**Precondition**: User does not have an account  
**Main Flow**:
1. Customer provides email, password, and personal information
2. System validates email format and password strength
3. System checks if email already exists
4. System hashes password
5. System creates user account
6. System sends verification email
7. System returns success response

**Alternative Flow**:
- 3a. Email already exists → Return error "Email already registered"
- 4a. Password too weak → Return validation error

**Postcondition**: User account created with PENDING status

---

### UC-AUTH-002: User Login
**Primary Actor**: Customer  
**Precondition**: User has registered account  
**Main Flow**:
1. Customer provides email and password
2. System validates credentials
3. System generates JWT access token
4. System generates refresh token
5. System stores refresh token
6. System returns tokens to customer

**Alternative Flow**:
- 2a. Invalid credentials → Return "Invalid email or password"
- 2b. Account locked → Return "Account is locked"

**Postcondition**: Customer authenticated with valid tokens

---

### UC-AUTH-003: Token Refresh
**Primary Actor**: Customer  
**Precondition**: Customer has valid refresh token  
**Main Flow**:
1. Customer sends refresh token
2. System validates refresh token
3. System generates new access token
4. System optionally rotates refresh token
5. System returns new tokens

**Alternative Flow**:
- 2a. Invalid/expired refresh token → Return 401 Unauthorized

**Postcondition**: Customer receives new access token

---

### UC-AUTH-004: Logout
**Primary Actor**: Customer  
**Precondition**: Customer is logged in  
**Main Flow**:
1. Customer initiates logout
2. System invalidates refresh token
3. System adds access token to blacklist (if applicable)
4. System returns success response

**Postcondition**: Customer logged out, tokens invalidated

---

### UC-AUTH-005: Password Reset Request
**Primary Actor**: Customer  
**Precondition**: User has registered account  
**Main Flow**:
1. Customer provides email address
2. System validates email exists
3. System generates reset token
4. System stores reset token with expiration
5. System sends password reset email

**Alternative Flow**:
- 2a. Email not found → Return generic success (security best practice)

**Postcondition**: Password reset email sent

---

### UC-AUTH-006: Password Reset Confirmation
**Primary Actor**: Customer  
**Precondition**: Customer has valid reset token  
**Main Flow**:
1. Customer provides reset token and new password
2. System validates reset token
3. System validates new password strength
4. System hashes new password
5. System updates password
6. System invalidates reset token
7. System invalidates all refresh tokens

**Postcondition**: Password updated, all sessions terminated

---

### UC-AUTH-007: Validate Token (Service-to-Service)
**Primary Actor**: System (other microservices)  
**Precondition**: Service receives request with token  
**Main Flow**:
1. Service sends token to Identity Service
2. Identity Service validates token signature
3. Identity Service checks token expiration
4. Identity Service checks token blacklist
5. Identity Service returns user claims

**Alternative Flow**:
- 2a-4a. Invalid token → Return 401 Unauthorized

**Postcondition**: Token validated, user identity confirmed

---

### UC-AUTH-008: Assign Role
**Primary Actor**: Admin  
**Precondition**: Admin has permission to manage roles  
**Main Flow**:
1. Admin selects user
2. Admin assigns role (Customer, Seller, Admin)
3. System validates role exists
4. System updates user roles
5. System publishes UserRoleUpdated event

**Postcondition**: User role updated

---

### UC-AUTH-009: Manage Permissions
**Primary Actor**: Admin  
**Precondition**: Admin has permission to manage roles  
**Main Flow**:
1. Admin defines permission for role
2. System validates permission structure
3. System updates role permissions
4. System publishes RolePermissionUpdated event

**Postcondition**: Role permissions updated

