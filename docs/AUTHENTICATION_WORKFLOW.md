# 🔐 Secure Authentication Workflow Documentation

## Overview

This document outlines the production-ready authentication system implemented for the AI Mock Interview System. The architecture follows security best practices with Firebase as the single source of truth for credentials.

## 🛡️ Security Principles

### Non-Negotiable Rules
- **Never store, hash, or transmit user passwords outside Firebase**
- **Never trust client-sent UID or email without token verification**
- **All authentication decisions happen on the server**
- **Use HTTP-only cookies for sessions**
- **Firebase is the source of truth for identity**

## 📋 Authentication Flows

### Sign-Up Workflow

```mermaid
sequenceDiagram
    participant C as Client
    participant FA as Firebase Auth
    participant S as Server
    participant DB as Firestore

    C->>FA: createUserWithEmailAndPassword(email, password)
    FA->>C: UserCredential (with UID)
    C->>FA: getIdToken(true)
    FA->>C: Fresh ID Token
    C->>S: signUp({ idToken, name })
    
    S->>S: Validate input with Zod
    S->>FA: verifyIdToken(idToken, true)
    FA->>S: Decoded token (uid, email, auth_time)
    S->>S: Check token age (< 5 minutes)
    S->>DB: Check if user exists (prevent duplicates)
    S->>DB: Create user profile
    S->>FA: createSessionCookie(idToken)
    S->>C: Set HTTP-only session cookie
    
    Note over S: If any step fails:
    S->>DB: Rollback user profile
    S->>FA: Delete Firebase user
    S->>C: Error response
```

#### Key Security Features:
1. **Input Validation**: Zod schemas validate all inputs
2. **Token Freshness**: Only accepts tokens created within 5 minutes
3. **Duplicate Prevention**: Checks for existing users before creation
4. **Atomic Rollback**: Cleans up Firebase user if server-side fails
5. **Secure Sessions**: HTTP-only cookies with proper security flags

### Sign-In Workflow

```mermaid
sequenceDiagram
    participant C as Client
    participant FA as Firebase Auth
    participant S as Server
    participant DB as Firestore

    C->>FA: signInWithEmailAndPassword(email, password)
    FA->>C: UserCredential
    C->>FA: getIdToken(true) // Force refresh
    FA->>C: Fresh ID Token
    C->>S: signIn({ idToken })
    
    S->>S: Validate input with Zod
    S->>FA: verifyIdToken(idToken, true) // Check revoked
    FA->>S: Decoded token
    S->>DB: Verify user profile exists
    S->>FA: createSessionCookie(idToken)
    S->>C: Set HTTP-only session cookie
```

#### Key Security Features:
1. **Token Revocation Check**: `checkRevoked = true` detects compromised sessions
2. **User Existence Verification**: Ensures user profile exists in Firestore
3. **Fresh Tokens**: Forces token refresh on sign-in
4. **Specific Error Handling**: Different messages for different failure scenarios

### Session Management

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant FA as Firebase Auth
    participant DB as Firestore

    C->>S: Request protected resource
    S->>S: Extract session cookie
    S->>FA: verifySessionCookie(session, true)
    FA->>S: Decoded claims (uid, iat, exp)
    S->>DB: Get user profile
    DB->>S: User data
    S->>C: Protected content
    
    Note over S: Auto-refresh logic:
    S->>S: Check session age
    alt Session > 5 days old
        S->>FA: getUser(uid)
        S->>FA: getIdToken(true)
        S->>FA: createSessionCookie(newToken)
        S->>C: Set refreshed cookie
    end
```

## 🔧 Server-Side Protection

### Middleware Route Guards

The middleware (`lib/middleware.ts`) provides automatic route protection:

```typescript
// Protected routes require authentication
const protectedRoutes = ['/', '/interview', '/interviews', '/feedback', '/profile'];

// Auth routes redirect authenticated users away
const authRoutes = ['/sign-in', '/sign-up'];
```

**Features:**
- **Automatic redirects** based on authentication status
- **Session validation** on every request
- **Cookie cleanup** on invalid sessions
- **Preserved redirect URLs** for post-auth navigation

### Server Component Helpers

```typescript
// Wrapper for authenticated server components
await withAuth(async (user) => {
  // Your authenticated logic here
  return <Dashboard user={user} />;
});

// API route authentication
const authResult = await authenticateApiRequest();
if ('error' in authResult) {
  return NextResponse.json({ error: authResult.error }, { status: authResult.status });
}
```

## 🚨 Error Handling & Security

### Client-Side Error Handling

The `AuthForm` component handles specific Firebase errors:

| Error Code | User Message | Security Note |
|-----------|-------------|---------------|
| `auth/email-already-in-use` | "Email already in use. Please sign in instead." | Prevents enumeration |
| `auth/user-not-found` | "No account found with this email. Please sign up." | Generic message |
| `auth/wrong-password` | "Incorrect password. Please try again." | No account confirmation |
| `auth/too-many-requests` | "Too many failed attempts. Please try again later." | Rate limiting hint |
| `auth/network-request-failed` | "Network error. Please check your connection." | Technical issues |

### Server-Side Error Handling

1. **Input Validation**: All server actions validate inputs with Zod
2. **Token Verification**: Always verifies tokens with `checkRevoked = true`
3. **Rollback Mechanisms**: Clean up partial failures
4. **Generic Error Messages**: Avoid leaking sensitive information
5. **Comprehensive Logging**: Detailed logs for debugging (server-side only)

## 🔄 Session Lifecycle

### Session Creation
- **Duration**: 7 days
- **Security**: HTTP-only, secure in production, SameSite=lax
- **Refresh**: Automatic refresh after 5 days

### Session Validation
- **Revocation Check**: Validates against Firebase on each request
- **User Existence**: Ensures user profile exists in Firestore
- **Automatic Cleanup**: Removes invalid cookies

### Session Termination
- **Manual Sign-out**: Revokes refresh tokens and clears cookie
- **Automatic Expiration**: Cookie expires after 7 days
- **Revocation Handling**: Detects revoked sessions immediately

## 🛠️ Implementation Files

### Core Authentication Files
- `lib/actions/auth.action.ts` - Server actions for auth operations
- `firebase/admin.ts` - Firebase Admin SDK configuration
- `firebase/client.ts` - Firebase Client SDK configuration
- `components/AuthForm.tsx` - Client-side authentication form

### Security & Protection Files
- `lib/middleware.ts` - Route protection middleware
- `lib/auth-helpers.ts` - Server-side auth utilities
- `types/index.d.ts` - TypeScript type definitions

## 📊 Security Checklist

### ✅ Implemented Security Measures
- [x] **Zero Trust**: Never trust client data without verification
- [x] **Token Validation**: Verify all ID tokens with revocation check
- [x] **Secure Sessions**: HTTP-only cookies with proper flags
- [x] **Input Validation**: Zod schemas for all inputs
- [x] **Error Handling**: Specific, non-revealing error messages
- [x] **Rollback Mechanisms**: Clean up on partial failures
- [x] **Route Protection**: Server-side middleware guards
- [x] **Session Management**: Automatic refresh and cleanup
- [x] **Type Safety**: Comprehensive TypeScript types

### 🔒 Security Considerations
- **Rate Limiting**: Consider implementing API rate limiting
- **CSRF Protection**: Already handled by SameSite cookie policy
- **Content Security Policy**: Consider adding CSP headers
- **Monitoring**: Implement auth event monitoring
- **Backup Authentication**: Consider adding social auth providers

## 🚀 Production Deployment

### Environment Variables Required
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Firebase Configuration
1. **Enable Email/Password authentication** in Firebase Console
2. **Configure service account** with proper permissions
3. **Set up Firestore security rules** for user data
4. **Enable session cookie settings** in Firebase Auth

### Next.js Configuration
- **Middleware**: Automatically handles route protection
- **Environment-specific settings**: Secure cookies in production
- **Error boundaries**: Handle authentication errors gracefully

## 📝 Best Practices

### Development
1. **Always use `checkRevoked = true`** for token verification
2. **Force token refresh** on sign-in with `getIdToken(true)`
3. **Validate all inputs** with Zod schemas
4. **Implement proper rollback** for failed operations
5. **Use specific error messages** for different failure scenarios

### Production
1. **Monitor authentication events** and failures
2. **Implement rate limiting** on auth endpoints
3. **Regular security audits** of authentication flow
4. **Keep Firebase SDKs** updated to latest versions
5. **Test session expiration** and refresh mechanisms

This authentication system provides a robust, secure foundation for the AI Mock Interview System while maintaining excellent user experience and developer productivity.
