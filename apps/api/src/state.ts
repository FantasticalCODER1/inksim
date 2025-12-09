import {
  applyIntervention,
  type WorldState,
  type Intervention,
  type SimulationStepResult,
  SceneDiff,
  createRunLog,
  appendRunStep,
  deriveRunMetrics,
  type RunLog
} from '@inksim/core';
import { createWorldStateForScenario, getAvailableScenarios, getScenarioById, type ScenarioConfig } from '@inksim/canon';
import { NarrationContextBuilder } from '@inksim/narrator';
import type { NarrationAdapter, NarrationResult } from '@inksim/narrator';
import { StubNarrator } from '@inksim/narrator';

const contextLimit = process.env.LLM_CONTEXT_LIMIT ? Number(process.env.LLM_CONTEXT_LIMIT) : 20000;
const builder = new NarrationContextBuilder(contextLimit);

const availableScenarios = getAvailableScenarios();
const initialScenario: ScenarioConfig = availableScenarios[0];
const initialWorld = createWorldStateForScenario(initialScenario.id);
let currentScenario: ScenarioConfig = initialWorld.scenario;
let currentState: WorldState = initialWorld.world;
let interventionHistory: Intervention[] = [];
let runLog: RunLog = createRunLog(`run-${Date.now()}`, currentScenario?.name);

export function getCurrentScenario(): ScenarioConfig {
  return currentScenario;
}

export function getWorldState(): WorldState {
  return currentState;
}

export function resetWorld(): WorldState {
  const { world, scenario } = createWorldStateForScenario(currentScenario?.id ?? availableScenarios[0].id);
  currentScenario = scenario;
  currentState = world;
  interventionHistory = [];
  runLog = createRunLog(`run-${Date.now()}`, scenario.name);
  return currentState;
}

export function processIntervention(intervention: Intervention): SimulationStepResult {
  const result = applyIntervention(currentState, intervention);
  if (result.applied) {
    interventionHistory.push(intervention);
    currentState = result.newState;
    runLog = appendRunStep(runLog, intervention, result);
  }
  return result;
}

export async function narrateStep(
  narrator: NarrationAdapter,
  intervention: Intervention,
  diff: SceneDiff
): Promise<NarrationResult> {
  const context = builder.build(currentState, interventionHistory, diff, intervention);
  try {
    return await narrator.generateSceneNarration(context);
  } catch (error) {
    const fallback = new StubNarrator();
    return fallback.generateSceneNarration(context);
  }
}

export function getRunLog() {
  return { log: runLog, metrics: deriveRunMetrics(runLog) };
}

export function resetRun(): { world: WorldState; run: RunLog } {
  const world = resetWorld();
  return { world, run: runLog };
}

export function selectScenario(id: string) {
  const scenario = getScenarioById(id);
  currentScenario = scenario;
  const { world } = createWorldStateForScenario(scenario.id);
  currentState = world;
  interventionHistory = [];
  runLog = createRunLog(`run-${Date.now()}`, scenario.name);
  return { scenario, world, run: runLog, metrics: deriveRunMetrics(runLog) };
}
