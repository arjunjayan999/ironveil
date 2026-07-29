# Contributing to IronVeil

Thank you for your interest in contributing to IronVeil. This guide explains how to set up the project for local development, outlines our contribution workflow, and describes the coding standards and best practices we follow. Whether you're fixing a bug, adding a feature, or improving the documentation, we appreciate your contribution.

## Development Setup

Fork the repository and follow the local development setup below.

```bash
# 1. Clone your fork
git clone https://github.com/<your-username>/ironveil.git
cd ironveil

# 2. Install dependencies
pnpm install

# 3. Copy environment files

# Linux / macOS / WSL
find apps -type f -name ".env.example" -exec sh -c 'cp "$1" "${1%.example}"' _ {} \;

# Windows (PowerShell)
Get-ChildItem apps -Filter ".env.example" -Recurse | ForEach-Object {
    Copy-Item $_.FullName $_.FullName.Replace(".example", "")
}

# 4. Start the infrastructure
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d

# 5. Start all services
pnpm dev
```

Open **http://localhost:5173**. If everything is set up correctly, you should see the login page.

For the complete development guide, environment variables, and troubleshooting, see **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

## Branch Naming

Please use the following branch naming convention:

| Branch | Purpose |
|---|---|
| `feat/<short-description>` | New features |
| `fix/<short-description>` | Bug fixes |
| `refactor/<short-description>` | Code refactoring without changing behavior |
| `docs/<short-description>` | Documentation updates |
| `test/<short-description>` | Adding or updating tests |
| `chore/<short-description>` | Tooling, dependencies, configuration, or maintenance tasks |

Examples:

```text
feat/live-alert-filtering
fix/websocket-reconnect
refactor/threat-scoring
docs/api-reference
test/backend-auth
chore/update-dependencies
```

## Commit Messages

This project follows the **Conventional Commits** specification. Please use clear, descriptive commit messages to keep the project history consistent and easy to navigate.

For the full specification, see: https://www.conventionalcommits.org/

Common commit types used in this project:

| Prefix | Purpose |
|---|---|
| `feat:` | New features |
| `fix:` | Bug fixes |
| `refactor:` | Code refactoring without changing behavior |
| `docs:` | Documentation changes |
| `test:` | Adding or updating tests |
| `chore:` | Dependencies, tooling, or maintenance |
| `ci:` | CI/CD workflow changes |

Examples:

```text
feat: add AI threat summaries
fix: reconnect websocket after disconnect
refactor: simplify threat scoring pipeline
docs: update deployment guide
test: add backend authentication tests
chore: upgrade dependencies
ci: cache pnpm store in GitHub Actions
```

## Code Style

Code formatting and linting are automated, so there's no need to manually match the existing style. Before opening a pull request, please run the following commands from the repository root:

```bash
pnpm lint
pnpm format
pnpm typecheck
```

TypeScript strict mode is enabled across the project, and CI will fail if there are any type errors. Running `pnpm typecheck` locally before committing helps catch issues early.

## Running Tests

Before opening a pull request, make sure all unit and component tests pass.

From the repository root:

```bash
# Run all unit/component tests
pnpm test

# Run all tests with coverage
pnpm test:coverage
```

Frontend end-to-end tests require the full application stack to be running:

```bash
pnpm test:e2e
```

All unit and component tests should pass before submitting a pull request. End-to-end tests should also pass for changes that affect the frontend or the overall application flow.

## Submitting a Pull Request

1. Fork the repository, clone the fork and create a new branch from `main`.
2. Make your changes, following the branch naming and commit message conventions.
3. Run the following from the repository root:

   ```bash
   pnpm lint
   pnpm format
   pnpm typecheck
   pnpm test:coverage
   ```

4. If your changes affect the frontend or end-to-end flow, run the Playwright tests:

   ```bash
   pnpm test:e2e
   ```

5. Push your branch to your fork and open a pull request against `main`.
6. Ensure all CI checks pass before requesting a review.

## Reporting Bugs / Requesting Features

Found a bug or have an idea for a new feature? Please open a GitHub Issue using the appropriate issue template.

- Use the **Bug Report** template to report bugs, unexpected behavior, or regressions.
- Use the **Feature Request** template to suggest new features or improvements.

Providing as much detail as possible helps make it easier to reproduce issues and review new ideas.
