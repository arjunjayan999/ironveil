# Security Policy

## About This Project

IronVeil is an open source educational and portfolio project that simulates a real-time drone threat detection platform. It does not use real sensor data, classified information, or military systems, and should not be used as-is in production or any safety-critical environment.

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public GitHub issue. Instead, use GitHub's private vulnerability reporting by going to the **Security** tab of this repository and selecting **Report a vulnerability**.

As this is a personal open source project, security reports are reviewed on a best-effort basis. I'll do my best to acknowledge reports promptly and work on a fix as soon as possible.

## Scope

### In Scope

- Authentication and authorization bypasses
- Injection vulnerabilities (SQL, command, etc.)
- Cross-site scripting (XSS) and cross-site request forgery (CSRF)
- Remote code execution or arbitrary file access
- Secrets, credentials, or sensitive data exposure
- Dependency vulnerabilities that affect the security of the application
- Denial of service vulnerabilities caused by application logic

### Out of Scope

- The simulated drone and sensor data, which is intentionally fictional
- Threat scoring accuracy or AI-generated summaries
- Requests to improve or change the threat detection logic
- Security issues in third-party services or libraries that are outside this project's control
- Vulnerabilities in locally modified or unsupported deployments

## Further Detail

For a detailed overview of the project's authentication, authorization, data handling, and security considerations, see **[docs/SECURITY.md](docs/SECURITY.md)**.
