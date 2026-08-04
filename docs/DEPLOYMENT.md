# Deployment Guide

This document explains how to deploy IronVeil in both development and production environments. It also serves as the central reference for environment variables, deployment requirements, and operational considerations.

---

# Environment Variables Reference

The project is split into multiple services, each with its own `.env.example` file. Copy every example file to `.env` before starting the application.

> **Note**
>
> The table below lists the primary environment variables used throughout the project. Refer to the corresponding `.env.example` files for the exact default values and any additional optional variables.

| Variable | Used By | Required | How to Get It |
|---|---|---|---|
|will be filled later | | | |

---

# Local Development

## Prerequisites

### Development

- Docker Desktop (latest recommended)
- Node.js 24+
- A Google Gemini API key (used for AI summaries and embeddings)

Update Corepack first:

```bash
npm install -g corepack@latest
```

> Due to an issue with outdated signatures in Corepack, it is recommended to update it before enabling pnpm.

Enable pnpm:

```bash
corepack enable pnpm
```

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/arjunjayan999/ironveil.git
cd ironveil

# 2. Install dependencies
pnpm install

# 3. Copy environment files

apps/backend/.env.example           -> apps/backend/.env
apps/frontend/.env.example          -> apps/frontend/.env
apps/threat-engine/.env.example     -> apps/threat-engine/.env
apps/sensor-simulator/.env.example  -> apps/sensor-simulator/.env
apps/ai-service/.env.example        -> apps/ai-service/.env

# Linux / macOS / WSL
find apps -type f -name ".env.example" -exec sh -c 'cp "$1" "${1%.example}"' _ {} \;

# Windows (PowerShell)
Get-ChildItem apps -Filter ".env.example" -Recurse | ForEach-Object {
    Copy-Item $_.FullName $_.FullName.Replace(".example", "")
}

# 4. Update the environment variables
# (especially GEMINI_API_KEY)

# 5. Start infrastructure
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d

# 6. Start all services
pnpm dev
```

Open:

```
http://localhost:5173
```

The first startup may take a few minutes while Docker images are downloaded and dependencies are installed.

Once everything is running successfully, the login page should be available.

To stop the application:

```bash
# Stop Node.js services
Ctrl + C

# Stop infrastructure
docker compose -f infrastructure/docker/docker-compose.dev.yml down
```

---

# Production Deployment

## Prerequisites

- Docker Desktop or Docker Engine
- A Google Gemini API key
- A machine with sufficient CPU, memory, and disk space for running all containers

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/arjunjayan999/ironveil.git
cd ironveil

# 2. Copy the root environment file

# Linux / macOS / WSL
cp .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env

# 3. Configure the environment variables
# (especially GEMINI_API_KEY)

# 4. Start the full stack
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

Open:

```
http://localhost
```

The first deployment may take several minutes while Docker builds images and initializes the infrastructure.

After startup completes, the frontend should be accessible from your browser.

To stop the deployment:

```bash
docker compose -f infrastructure/docker/docker-compose.yml down
```

---

# Kubernetes Deployment

Kubernetes deployment has not yet been implemented.

Future versions of the project are expected to include Kubernetes manifests and Helm charts for easier deployment into container orchestration platforms.

---

# Production Considerations

The current Docker deployment is designed for demonstrations, local development, and small-scale deployments. Before running IronVeil in a production environment, several infrastructure improvements should be considered.

## Kafka

The project currently uses a single Kafka broker.

For production deployments, consider:

- A multi-broker Kafka cluster
- Replication factor greater than one
- Proper partitioning strategy
- Persistent storage volumes
- External monitoring and alerting

This improves availability and prevents a single broker from becoming a single point of failure.

---

## PostgreSQL

The current setup runs PostgreSQL inside Docker.

For production environments, consider using:

- Managed PostgreSQL services
- Automated backups
- Point-in-time recovery
- Read replicas (if required)
- High-availability configurations

---

## Redis

Redis is currently deployed as a single instance.

For higher availability:

- Deploy Redis Sentinel or Redis Cluster
- Enable persistence where appropriate
- Monitor memory usage and eviction policies

---

## TLS and Reverse Proxy

Development deployments typically use HTTP.

A production deployment should include:

- HTTPS with valid TLS certificates
- Automatic certificate renewal
- Reverse proxy using NGINX or Traefik
- Secure WebSocket support (`wss://`)

---

## Secrets Management

Avoid storing production secrets directly inside `.env` files.

Instead, use a dedicated secrets management solution such as:

- Docker Secrets
- Kubernetes Secrets
- HashiCorp Vault
- Cloud provider secret managers

---

## Service Scaling

The event-driven architecture allows several services to scale independently.

Suitable candidates for horizontal scaling include:

- Backend
- Threat Engine
- AI Service

When scaling consumers, Kafka consumer groups ensure that events are distributed across instances without duplicate processing.

The Sensor Simulator is generally intended to run as a single instance during demonstrations unless multiple simulated environments are required.

---

## AI Service

The AI Service depends on the Gemini API.

For production deployments:

- Monitor API usage and quotas
- Implement retry policies
- Configure request timeouts
- Consider caching frequently requested summaries
- Monitor embedding generation latency

---

## High Availability

To improve overall system resilience:

- Deploy multiple Backend instances behind a load balancer.
- Run multiple Threat Engine consumers within the same Kafka consumer group.
- Scale AI Service instances independently based on inference workload.
- Use managed PostgreSQL and Redis deployments with automatic failover.
- Replace the single Kafka broker with a replicated Kafka cluster.
- Configure health checks and automatic container restarts.

These changes help eliminate single points of failure while allowing the system to scale with increasing event volume.
