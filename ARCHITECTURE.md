# Architecture

InkSim is organised as a Node and TypeScript monorepo with clear boundaries between deterministic simulation code and pluggable narration.

## Conceptual layers

1. **Canon layer**
   - Describes the source world: characters, locations, relationships, items, events, and initial knowledge.
   - Implemented in `packages/canon` with helper functions such as `getSampleCanonWorld` and `createSampleWorldState`.

2. **World state engine and constraints**
   - Deterministic engine that manages world state transitions and validates interventions.
   - Lives in `packages/core`, exposing types, `createInitialWorldState`, `applyIntervention`, and constraint checks.
   - The simple `NaivePlanner` interface lives here so planners can propose interventions without depending on any LLM vendor.

3. **Constraint engine and planner**
   - Validation rules guard against impossible actions, for example adjusting trust for missing characters or moving events to negative time indices.
   - Planners consume `WorldState` and emit suggested interventions via the `PlotPlanner` interface.

4. **Narrator and rendering**
   - `packages/narrator` contains the `NarrationContextBuilder`, `NarrationAdapter` interface, a deterministic `StubNarrator`, and a `LocalLlmNarrator` that calls an OpenAI compatible endpoint.
   - Narration is selected via `createNarratorFromEnv`, which honours `LLM_MODE` and falls back to the stub if the local server is unavailable.

## Code flow

1. A canon world or scenario is loaded from `packages/canon`.
2. `packages/core` turns the canon into a `WorldState` and applies user interventions via `applyIntervention`, producing a `SceneDiff` and warnings if constraints were triggered.
3. Runs are tracked as sequences of interventions and simulation results via `RunLog` utilities in `packages/core`, which also derive light metrics such as knowledge spread and tension.
4. The backend in `apps/api` exposes `/api/world`, `/api/world/reset`, and `/api/world/step` plus run endpoints and scenario selection. It keeps world state and the current run in memory, builds narration context, and calls the selected narrator.
5. The frontend in `apps/web` fetches the current world, displays characters, relationships, and events, and lets a user submit interventions. Returned narration, scene diffs, analytics, and run steps are shown alongside the structured data, with controls to swap scenarios.

## LLM integration

- Narration is pluggable and vendor neutral. Environment variables (`LLM_MODE`, `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_CONTEXT_LIMIT`) control behaviour.
- `LLM_MODE=stub` keeps everything offline and deterministic for tests.
- `LLM_MODE=local` targets a local OpenAI compatible server such as LM Studio. Failures to reach the server result in a safe fallback to the stub narrator.
- `NarrationContextBuilder` trims history to a configurable token budget by summarising older events.

## Extensibility

- Add richer planners by implementing `PlotPlanner` in a new package (for example `packages/planner-llm`) without touching the core engine.
- Swap or add narrators by implementing `NarrationAdapter` and wiring a new selection in `createNarratorFromEnv`.
- Add new scenarios by supplying a `ScenarioConfig` in `packages/canon` and reusing `createWorldStateForScenario`.
- The backend world store and run log are in a single module so they can be replaced with a persistent database without changing route handlers.
