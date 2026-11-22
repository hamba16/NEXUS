# Authentication Roadmap

Open mode is the only implemented mode. `OpenAuthProvider` resolves `X-Actor-Id` against seeded profiles and sets transaction-scoped RLS context.

## OIDC/JWT replacement

1. Implement `OidcAuthProvider.resolve` from verified issuer claims.
2. Map claims to institution and role, not directly in route handlers.
3. Keep `require_role` and RLS context as the authorization boundary.
4. Enforce TLS, short-lived tokens, refresh rotation, and key rotation.
5. Replace profile selection while preserving open-mode test fixtures behind `AUTH_MODE=open`.

No login or password flow is implemented.
