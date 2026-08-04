# Frontend

The Frontend is a single-page application (SPA) built with **React**, **TypeScript**, and **Tailwind CSS**. It serves as the primary user interface for the IronVeil platform, allowing users to start the Sensor Simulator, monitor live drone activity, investigate detected threats, perform semantic searches, and view system metrics. The application receives real-time drone events, threat alerts, and metrics over WebSockets while interacting with the Backend through REST APIs. Key pages include the **Dashboard**, **Threat Center**, **Live Map**, **Audit Log**, and **Settings**.

## Running Standalone

Before starting the Frontend, ensure the Backend API is running.

Start the development server:

```bash
pnpm dev
```

The application is available at:

```
http://localhost:5173
```

## Running Tests

Run the unit and component tests (Vitest):

```bash
pnpm test
```

Run the end-to-end test suite (Playwright):

```bash
pnpm test:e2e
```

> **Note:** End-to-end tests require the complete application stack (Frontend, Backend, PostgreSQL, Redis, Kafka, and supporting services) to be running.

## Related Docs

- [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) - System architecture and service interactions.
- [`../../docs/API_REFERENCE.md`](../../docs/API_REFERENCE.md) - Backend REST API reference.
- [`../../docs/SECURITY.md`](../../docs/SECURITY.md) - Authentication and security design.
```