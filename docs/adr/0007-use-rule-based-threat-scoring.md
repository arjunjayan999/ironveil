# 0007 - Use Rule-Based Threat Scoring

## Status

Accepted

## Context

The platform needs deterministic threat scoring suitable for demonstration purposes.

## Decision

Implement threat scoring using predefined business rules rather than machine learning.

Threat scores are calculated from explicit conditions that are easy to understand and modify.

## Consequences

### Positive

- Deterministic behavior.
- Easy to test.
- Easy to explain.
- No model training required.

### Negative

- Less adaptive than ML-based approaches.
- Cannot learn from historical data.

## Alternatives Considered

### Machine Learning

Rejected because it would significantly increase complexity without improving the educational goals of the project.