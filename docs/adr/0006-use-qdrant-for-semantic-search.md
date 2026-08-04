# 0006 - Use Qdrant for Semantic Search

## Status

Accepted

## Context

Users need to search AI-generated summaries using natural language rather than exact keywords.

## Decision

Store vector embeddings in Qdrant and perform semantic similarity search using vector distance.

## Consequences

### Positive

- Meaning-based search.
- Dedicated vector database.
- Keeps vector workloads separate from transactional storage.

### Negative

- Additional infrastructure.
- Requires embedding generation.

## Alternatives Considered

### PostgreSQL full-text search

Rejected because keyword search does not support semantic similarity.

### PostgreSQL with pgvector

A viable alternative, but Qdrant better reflects a dedicated vector database architecture and keeps vector search isolated from the primary relational database.