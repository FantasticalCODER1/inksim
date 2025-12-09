import { RunLog, RunMetrics, RunStep, SimulationStepResult, Intervention } from './types.js';

export function createRunLog(id: string, title?: string): RunLog {
  const now = new Date().toISOString();
  return {
    id,
    title,
    steps: [],
    startedAt: now,
    lastUpdated: now
  };
}

export function appendRunStep(log: RunLog, intervention: Intervention, result: SimulationStepResult): RunLog {
  const step: RunStep = {
    intervention,
    result,
    timestamp: new Date().toISOString()
  };
  return {
    ...log,
    steps: [...log.steps, step],
    lastUpdated: step.timestamp
  };
}

export function deriveRunMetrics(log: RunLog): RunMetrics {
  const relationshipChanges = log.steps.reduce((acc, step) => acc + step.result.diff.relationships.length, 0);
  const knowledgeChanges = log.steps.reduce((acc, step) => acc + step.result.diff.knowledge.length, 0);
  const lastState = log.steps.at(-1)?.result.newState;
  const knowledgeSpread = lastState
    ? lastState.knowledge.filter((k) => k.knownBy.length > 1).length
    : 0;
  const tension = lastState
    ? lastState.relationships.filter((rel) => rel.hostility > 25 || rel.trust < -10).length
    : 0;
  const flagsSet = lastState ? Object.values(lastState.plotFlags).filter(Boolean).length : 0;
  const currentTime = lastState?.time ?? 0;

  return {
    steps: log.steps.length,
    relationshipChanges,
    knowledgeChanges,
    knowledgeSpread,
    tension,
    flagsSet,
    currentTime
  };
}
