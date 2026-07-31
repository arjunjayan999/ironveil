# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial event-driven architecture built around Apache Kafka.
- Sensor Simulator service for generating real-time drone telemetry.
- Threat Engine service for analyzing drone events and assigning threat scores.
- Backend service with REST APIs and WebSocket support for live updates.
- React frontend with a real-time operations dashboard.
- AI Service for generating threat summaries and embeddings using Google Gemini.
- PostgreSQL for persistent data storage.
- Redis for caching and real-time state management.
- Qdrant integration for semantic similarity search.
- Interactive drone map powered by MapLibre GL JS.
- JWT authentication with role-based access control.
- Prometheus metrics and Grafana dashboards for observability.
- Docker Compose setup for both development and production environments.
- Flyway database migrations.
- Unit, component, and end-to-end testing setup.

### Changed

- Ongoing improvements to threat scoring logic and event processing.
- Continuous UI and dashboard enhancements.
- Documentation expanded with architecture, deployment, API, and security guides.

### Fixed

- Various bug fixes and performance improvements during development.

### Removed

- None.

<!--
When the first stable milestone is released:

## [0.1.0] - YYYY-MM-DD

### Added
- Initial public release of IronVeil.
-->