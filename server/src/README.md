# Server Source Layout

| Folder | Purpose |
| --- | --- |
| `api/routes/` | Express route handlers and HTTP request/response mapping. |
| `core/` | Cross-cutting app configuration and filesystem path helpers. |
| `db/` | Prisma client initialization. |
| `domain/` | Business logic engines used by routes and services. |
| `integrations/` | External system clients such as Open Dental and Ollama. |
| `services/` | Application services that coordinate data access and integrations. |
| `index.ts` | Express app wiring and process entry point. |
