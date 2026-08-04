# 0004 - Separate Threat Analysis into Its Own Service

## Status

Accepted

## Context

Threat analysis is computationally independent from HTTP request handling.

## Decision

Implement the Threat Engine as a dedicated microservice that consumes Kafka events and publishes analyzed threats.

The Backend focuses only on APIs, WebSockets, and persistence related to user interactions.

## Consequences

### Positive

- Better separation of concerns.
- Independent deployment and scaling.
- Failure isolation.
- Easier to extend with additional processing stages.

### Negative

- Additional service to maintain.
- Event-driven processing introduces eventual consistency.

## Alternatives Considered

### Threat analysis inside the Backend

Simpler architecture but tightly couples business logic to user-facing APIs and increases backend complexity.