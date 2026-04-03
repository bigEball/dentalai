# Brief: Local-First Architecture + Open Dental Integration

## Why
DentalAI will be installed locally in each dental office. Nothing goes to the cloud unless absolutely necessary. The AI notes module needs to listen to procedures in real-time, generate SOAP notes via a local LLM, and write them directly into Open Dental. A demo/live mode toggle lets users exit mock data and connect to their real Open Dental instance.

## Context

### Open Dental API
- REST API at `localhost:30222/api/v1/` (Local mode, no throttling, no cloud)
- Auth: `Authorization: ODFHIR {DeveloperKey}/{CustomerKey}` header on every request
- Writing notes: `POST /procnotes` with `{ PatNum, ProcNum, Note }` — append-only audit trail
- Read-only is free. Write access is $30/mo per location.
- Key tables mapped to API resources: patients, appointments, procedurelogs, procnotes, insplan, inssub, claim, claimproc, recall, statement
- Pascal casing on all fields (PatNum, FName, LName, AptDateTime, etc.)
- Webhooks available for appointment status changes

### Local AI Stack
- **Transcription**: whisper.cpp + large-v3-turbo model + Silero VAD. ~500ms latency, runs on Apple Silicon or NVIDIA GPU.
- **Note generation**: Ollama with Qwen 2.5 14B or Llama 3.1 8B. OpenAI-compatible API at localhost:11434.
- **Hardware**: Mac Mini M4 Pro 48GB (~$2K) provided by us per office.
- **Existing OSS**: Phlox project is architecturally closest reference.

### Current Codebase
- Server routes call Prisma directly — needs abstraction layer for demo/live mode switching
- Settings page has mock Open Dental panel — needs to become real
- AI Notes page has mock transcript/generation — needs Whisper + Ollama integration points

## Decisions
- **Browser-based for now** — no Electron packaging yet, app comes later
- **Demo Mode toggle** — Settings page switch between "Demo" (Prisma/seed data) and "Live" (Open Dental API). Prompt for OD API keys when switching to Live.
- **Note workflow: Option A (manual)** — Doctor hits Record → Whisper transcribes → local LLM generates SOAP → doctor reviews/edits → Approve → writes to Open Dental via POST /procnotes
- **Hardware provided by us** — Mac Mini M4 Pro per office, so we can target Apple Silicon optimizations
- **Cloud only if necessary** — de-identified transcript to Claude as an opt-in fallback if local model quality is insufficient

## Rejected Alternatives
- **Electron desktop app now** — adds packaging complexity, browser-based is fine for MVP
- **Option B (autonomous listening)** — too aggressive for v1, doctors want control over when recording starts
- **Direct MySQL writes** — Open Dental explicitly forbids this, API is the only approved write path
- **Cloud-first AI** — violates core requirement of local-only operation
- **FHIR interface** — deprecated by Open Dental, proprietary REST API is the supported path

## Direction
Build an Open Dental integration service on the server that abstracts data access behind a mode switch (demo vs live). Add a real connection flow to Settings. Wire AI Notes to call Ollama for note generation and prepare the architecture for whisper.cpp streaming transcription. Everything local, nothing leaves the machine by default.
