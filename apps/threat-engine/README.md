# Threat Engine

The Threat Engine is responsible for processing incoming sensor events and performing rule-based threat analysis. It consumes `drone-events` from Kafka, detects duplicate events using Redis, calculates threat scores based on predefined scoring rules, persists analyzed threats to PostgreSQL, updates live threat metrics in Redis, and publishes both `threat-events` and `audit-events` for downstream consumers. Unlike the Backend, the Threat Engine does **not** expose a public REST API. Its only HTTP endpoint is `/healthz`, which is intended for health checks and orchestration.

## Running Standalone

Before starting the Threat Engine, ensure the following infrastructure services are running:

- PostgreSQL
- Redis
- Kafka

Copy `.env.example` to `.env` and configure the required environment variables.

Start the service:

```bash
pnpm dev
```

## Scoring Rules

Threat scores are calculated using a deterministic rule-based scoring engine. Each matching condition contributes a fixed number of points to the overall threat score.

| Condition | Points |
|-----------|------:|
| Restricted zone entry | 40 |
| Unknown identity | 20 |
| Speed greater than 150 knots | 15 |
| Altitude greater than 10,000 meters | 10 |
| Repeated restricted zone entry | 15 |

The final score is clamped between **0** and **100** and mapped to a threat level:

| Score | Threat Level |
|------:|--------------|
| 0–30 | LOW |
| 31–70 | MEDIUM |
| 71–100 | HIGH |

This deterministic approach keeps threat evaluation transparent, easy to test, and straightforward to modify during development. For additional architectural context and the reasoning behind choosing a rule-based engine, see the system architecture documentation.

## Related Docs

- [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) - Overall system architecture and event flow.
- [`../../docs/adr/0007-use-rule-based-threat-scoring.md`](../../docs/adr/0007-use-rule-based-threat-scoring.md) - Architecture decision behind the scoring engine.
- [`../../docs/SECURITY.md`](../../docs/SECURITY.md) - Authentication and security considerations.