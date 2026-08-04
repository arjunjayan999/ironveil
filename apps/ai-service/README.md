# AI Service

The AI Service is responsible for generating natural language intelligence from analyzed threats. It consumes `threat-events` from Kafka, automatically generates AI summaries, creates vector embeddings, and stores both in PostgreSQL and Qdrant for semantic search. In addition to Kafka consumers, the service exposes internal HTTP endpoints used by the Backend for summary generation, report creation, semantic search, and retrieving similar incidents. The service is designed to be **provider-agnostic**, supporting **Google Gemini** as the default AI provider while allowing **Ollama** to be used as a fully local alternative with minimal configuration changes.

## Running Standalone

Before starting the AI Service, ensure the following services are running:

- PostgreSQL
- Kafka
- Qdrant
- Gemini API (or a local Ollama instance)

Copy `.env.example` to `.env` and configure the required environment variables.

Start the service:

```bash
pnpm dev
```

## Required Credentials

When using the default configuration (`AI_PROVIDER=gemini`), a valid `GEMINI_API_KEY` is required.

You can obtain an API key from **Google AI Studio** and add it to your local `.env` file.

If `AI_PROVIDER=ollama` is selected, no external API key is required. Instead, ensure that:

- Ollama is running locally.
- The configured summary and embedding models have been pulled.
- `OLLAMA_BASE_URL` points to the running Ollama instance.

This provider abstraction allows switching between cloud-hosted and local AI models without changing application code.

## Related Docs

- [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) - Overall system architecture and AI workflow.
- [`../../docs/API_REFERENCE.md`](../../docs/API_REFERENCE.md) - Internal API endpoints exposed by the AI Service.
- [`../../docs/adr/0006-use-qdrant-for-semantic-search.md`](../../docs/adr/0006-use-qdrant-for-semantic-search.md) - Architecture decision for semantic search.
- [`../../docs/SECURITY.md`](../../docs/SECURITY.md) - Security considerations and secrets management.