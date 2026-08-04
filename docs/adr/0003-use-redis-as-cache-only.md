# 0003 - Use Redis as a Cache Instead of a Source of Truth

## Status

Accepted

## Context

The application needs fast access to temporary state such as duplicate detection and live metrics.

## Decision

Redis stores only temporary or derived data.

Persistent application data remains in PostgreSQL.

If Redis is cleared, the application can rebuild its state from PostgreSQL.

## Consequences

### Positive

- Simple recovery.
- No persistent business data in Redis.
- Better separation of responsibilities.

### Negative

- Some cached values must be regenerated after failures.

## Alternatives Considered

### Store primary application state in Redis

Rejected because it complicates persistence and backup while providing little benefit for this project.