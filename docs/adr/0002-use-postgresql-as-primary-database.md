# 0002 - Use PostgreSQL as the Primary Database

## Status

Accepted

## Context

The platform stores drone events, analyzed threats, audit logs, users, organizations, and AI summaries.

## Decision

Use PostgreSQL as the primary source of truth for all persistent application data.

Specialized systems such as Redis and Qdrant complement PostgreSQL rather than replacing it.

## Consequences

### Positive

- Strong transactional guarantees.
- Mature relational database.
- Simple operational model.
- Consistent storage for structured data.

### Negative

- Not optimized for vector similarity search.
- Some workloads require complementary systems.

## Alternatives Considered

### Multiple specialized databases

Rejected because it would increase operational complexity without providing meaningful benefits for the project's scale.