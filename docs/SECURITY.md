# Security Design

## Authentication

Authentication is based on JSON Web Tokens (JWTs). After a successful login, the API issues a signed JWT containing only the information required to identify the authenticated user.

Typical JWT payload:

```json
{
  "sub": "<user-id>",
  "username": "<username>",
}
```

The token has an **8-hour expiration**. This duration was chosen as a balance between usability and security:

- Long enough to avoid forcing users to repeatedly authenticate during a normal work session.
- Short enough to limit the impact of a leaked access token.
- Appropriate for a demonstration platform where long-lived sessions are unnecessary.

### Client-side Storage

The frontend stores the access token **only in memory** (application state).

This intentionally avoids storing authentication credentials in:

- `localStorage`
- `sessionStorage`

While in-memory storage does **not** eliminate XSS risks, it prevents tokens from persisting across browser restarts and makes large-scale token theft through browser storage significantly more difficult.

The tradeoff is that users must authenticate again after refreshing the page.

### Production Improvements

A production deployment would typically implement:

- Short-lived access tokens (10–15 minutes)
- HttpOnly, Secure refresh token cookies
- Refresh token rotation
- Automatic token revocation after suspicious activity
- CSRF protection for cookie-based authentication

This architecture provides a better balance between usability and security while keeping access tokens inaccessible to JavaScript.

---

## Password Handling

Passwords are hashed using **Argon2id**, which is currently considered one of the strongest password hashing algorithms for modern applications.

Characteristics of the implementation include:

- Argon2id password hashing
- Unique random salt generated for every password
- Plaintext passwords are never stored
- Password verification performed only through Argon2id's verification API

Argon2id was selected because it is:

- Memory-hard, making GPU attacks significantly more expensive
- Resistant to rainbow table attacks
- Recommended by OWASP and the Password Hashing Competition

The project uses a moderate memory and time cost that is appropriate for interactive authentication while remaining computationally expensive enough to slow offline brute-force attacks without noticeably impacting user experience.

### Logging

Authentication data is never written to logs.

Logging rules explicitly redact or exclude:

- Passwords
- Authorization headers
- JWTs
- Session credentials
- Secrets from environment variables

This ensures sensitive credentials cannot accidentally appear in application or infrastructure logs.

---

## Authorization (RBAC)

Authorization is enforced using **role-based access control (RBAC)** at the API layer.

Every protected organization endpoint verifies that:

1. The authenticated user belongs to the requested organization.
2. The user's role is authorized for the requested action.

The middleware performs the following flow:

1. Read the `organizationId` from route parameters.
2. Look up the user's organization membership.
3. Return **403 Forbidden** if no membership exists.
4. Compare the user's role against the allowed roles.
5. Continue only when authorization succeeds.

Authorization is intentionally enforced on the server. Client-side role checks are treated only as UI conveniences and are never relied upon for security.

---

## Transport Security

In the Docker Compose deployment, TLS is terminated at **Nginx**, which acts as the reverse proxy for the application.

Nginx is responsible for:

- Accepting incoming HTTPS connections
- Forwarding requests to backend services
- Centralizing security-related HTTP configuration
- Applying request rate limiting

For local development, self-signed certificates or plain HTTP may be used depending on the environment.

### Production Improvements

A production deployment should additionally include:

- TLS certificates issued by Let's Encrypt or another trusted CA
- Automatic certificate renewal
- HTTP Strict Transport Security (HSTS)
- Modern TLS configuration (TLS 1.2+ / TLS 1.3)
- Secure cookie attributes
- Security headers such as:
  - Content-Security-Policy
  - X-Frame-Options
  - X-Content-Type-Options
  - Referrer-Policy

---

## Rate Limiting

Nginx applies request rate limiting to API traffic.

Current configuration:

- **60 requests per minute per IP**
- Applied to `/api/*`

This limit is intended to:

- Reduce automated abuse
- Slow basic denial-of-service attempts
- Prevent accidental request floods during development
- Provide a simple first layer of protection before requests reach the application

The threshold is intentionally permissive so normal application usage is unaffected while still limiting excessive traffic.

### Production Improvements

Some endpoints should use much stricter limits, including:

- Login
- Password reset
- Account registration
- MFA verification
- Token refresh

Additional protections such as CAPTCHA, progressive delays, or temporary account lockouts would further reduce brute-force attack effectiveness.

---

## Secrets Management

Secrets are managed differently depending on the deployment environment.

### Local Development

Services loads secrets from their own `.env` file.

The `.env` file is:

- Git ignored
- Never committed to the repository
- Intended only for local development

Developers create their own environment configuration using the provided `.env.example` in each service.

---

## Dependency Security

Project dependencies are regularly reviewed and updated as part of normal development.

Current practices include:

- Keeping dependencies reasonably up to date
- Running `pnpm audit` periodically
- Applying security updates when practical

Automatic dependency update tooling (such as Dependabot or Renovate) has **not yet been configured**.

This is planned future work and is tracked in the project roadmap rather than being presented as an existing capability.

---

## Data Handling

IronVeil is a simulated cyber defense platform.

All telemetry displayed by the system is **synthetic** and generated by the Sensor Simulator.

The application does **not** process or store:

- Real network traffic
- Customer data
- Personally identifiable information (PII)
- Production security events
- Real endpoint telemetry

This allows the platform to demonstrate realistic security workflows without exposing or retaining real-world operational data.

---

## Known Gaps

This project intentionally prioritizes clarity and architecture over production-hardening. Areas that would require additional work before a real deployment include:

- No refresh token rotation
- No account lockout after repeated failed login attempts
- No multi-factor authentication (MFA)
- No audit log tamper-evidence (for example, hash chaining or signed logs)
- No automated secrets rotation policy
- No centralized key management (KMS/HSM)
- No intrusion detection or anomaly-based authentication monitoring
- No Web Application Firewall (WAF)
- No automated dependency update service (Dependabot/Renovate)
- Limited security event monitoring and alerting

These omissions are intentional for a portfolio project and are documented openly to distinguish the current implementation from a production-grade security architecture.