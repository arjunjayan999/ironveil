# Architecture Decision Records

This directory contains records of significant architectural decisions made during the development of IronVeil.

Unlike `ARCHITECTURE.md`, which describes how the system is built today, ADRs capture *why* important architectural decisions were made, what alternatives were considered, and the consequences of each decision.

Architecture decisions are immutable. If a decision changes in the future, a new ADR should be created rather than modifying or deleting an existing one.

## Index

- [0001 - Use Kafka for Service Communication](0001-use-kafka-for-service-communication.md)
- [0002 - Use PostgreSQL as the Primary Database](0002-use-postgresql-as-primary-database.md)
- [0003 - Use Redis as a Cache Instead of a Source of Truth](0003-use-redis-as-cache-only.md)
- [0004 - Separate Threat Analysis into Its Own Service](0004-separate-threat-engine-from-backend.md)
- [0005 - Use WebSockets for Real-Time Updates](0005-use-websockets-for-live-updates.md)
- [0006 - Use Qdrant for Semantic Search](0006-use-qdrant-for-semantic-search.md)
- [0007 - Use Rule-Based Threat Scoring](0007-use-rule-based-threat-scoring.md)