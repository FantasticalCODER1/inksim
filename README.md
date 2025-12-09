# InkSim

InkSim is a literary world simulation lab. It transforms a finished book into a structured, testable world with deterministic state handling, a pluggable narrator, and tools for planning interventions, running experiments, and comparing scenarios.

## Getting started

Prerequisites: Node 20+ and npm.

```bash
npm install
```

### Running the backend

```bash
npm run dev:api
```

The API listens on `http://localhost:4000` by default and provides:

- `/api/world`, `/api/world/reset`, `/api/world/step` - core world retrieval and stepping
- `/api/run`, `/api/run/reset` - current run log and metrics
- `/api/scenarios`, `/api/scenarios/select` - available scenarios and switching the active scenario

### Running the frontend

In a separate terminal:

```bash
npm run dev:web
```

The Vite dev server starts on port 5173 and expects the backend to be available for data. The UI shows character and event lists, narrated output, the latest scene diff, a run log with derived metrics, and lets you switch between sample scenarios.

### Tests

```bash
npm test
```

This builds shared packages and runs the Vitest suites for the core, canon helpers, and narrator.

### Build

```bash
npm run build
```

This builds shared packages then compiles the web and API projects.

## LLM configuration

The narrator uses environment variables to decide which mode to run:

- `LLM_MODE` - `stub` (default) or `local`.
- `LLM_BASE_URL` - default `http://localhost:1234/v1`.
- `LLM_API_KEY` - default `lm-studio`.
- `LLM_MODEL` - model identifier string.
- `LLM_CONTEXT_LIMIT` - token budget used by the context builder (default 20000).

When `LLM_MODE` is `stub`, narration is deterministic and offline. When set to `local`, the API attempts to contact a local OpenAI compatible server (for example LM Studio) and falls back to the stub if the endpoint cannot be reached.

Copy `.env.example` to `.env` and adjust values as needed.

## Project layout

- `apps/web` - React and TypeScript UI built with Vite.
- `apps/api` - Express TypeScript backend exposing world and step endpoints.
- `packages/core` - Domain model, world engine, constraints, and planner interface.
- `packages/canon` - Canon helpers and a sample fictional world.
- `packages/narrator` - Narration interfaces, context builder, stub narrator, and local LLM client.

The deterministic core engine is vendor neutral. Narration is pluggable so alternative narrators or planners can be added without changing the world model.
