# Backend

The Backend is the central gateway between users and the rest of the IronVeil platform. It exposes the REST API, handles authentication and authorization, manages WebSocket connections for real-time updates, and coordinates communication between the Frontend and internal services. In addition to serving HTTP requests, it consumes Kafka events (`drone-events`, `threat-events`, and `audit-events`), broadcasts live updates to connected clients, persists audit logs, provides live metrics, and exposes semantic search endpoints backed by Qdrant. For a complete overview of how the Backend fits into the system architecture, see the related documentation below.

## Running Standalone

Before starting the Backend, ensure the following infrastructure services are running:

- PostgreSQL
- Redis
- Kafka

Copy `.env.example` to `.env` and configure the required environment variables.

Start the development server:

```bash
pnpm dev
```

## Folder Structure

```text
src/
├── db/            Database queries and client
├── kafka/         Kafka producers and consumers
├── metrics/       Live metrics prom client
├── middleware/    Authentication and authorization middleware
├── redis/         Redis client and cache utilities
├── routes/        REST API route handlers
└── websocket/     WebSocket server and event broadcasting
```

## Related Docs

- [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) - System architecture and service interactions.
- [`../../docs/API_REFERENCE.md`](../../docs/API_REFERENCE.md) - Complete REST API documentation.
- [`../../docs/SECURITY.md`](../../docs/SECURITY.md) - Authentication, authorization, and security design.