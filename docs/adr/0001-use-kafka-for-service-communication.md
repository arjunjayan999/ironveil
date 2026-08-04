# 0001 - Use Kafka for Service Communication

## Status

Accepted

## Context

Multiple services need to process the same drone events independently.

Possible approaches included:

- Direct HTTP communication
- Message queues
- Event streaming

## Decision

Use Apache Kafka as the primary communication mechanism between services.

The Sensor Simulator publishes drone events once, allowing the Backend, Threat Engine, AI Service, and future consumers to process the same event independently.

## Consequences

### Positive

- Services are loosely coupled.
- Producers do not need to know who consumes events.
- Multiple consumers can process the same event.
- Services can fail independently.
- New consumers can be added without modifying producers.

### Negative

- Additional infrastructure to operate.
- More complex debugging than synchronous HTTP.
- Eventual consistency instead of immediate responses.

## Alternatives Considered

### Direct HTTP

Simpler to implement but tightly couples services and propagates failures between them.

### RabbitMQ

A good messaging system but less aligned with an event-streaming architecture where multiple services consume the same events independently.