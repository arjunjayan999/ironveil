# 0005 - Use WebSockets for Real-Time Updates

## Status

Accepted

## Context

Drone events and threat alerts arrive continuously.

Polling would require frequent HTTP requests from every connected client.

## Decision

Use WebSockets for real-time communication between the Backend and Frontend.

## Consequences

### Positive

- Low-latency updates.
- Reduced polling overhead.
- Better user experience for live dashboards.

### Negative

- Persistent connections require additional server resources.
- Connection management is more complex than HTTP.

## Alternatives Considered

### HTTP Polling

Rejected because it introduces unnecessary latency and additional network traffic.