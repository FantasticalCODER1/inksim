import {
  CanonWorld,
  EventChange,
  Intervention,
  KnowledgeChange,
  KnowledgeEntry,
  Relationship,
  RelationshipChange,
  SceneDiff,
  SimulationStepResult,
  WorldState
} from './types.js';
import { validateIntervention } from './constraints.js';

const cloneState = (state: WorldState): WorldState => JSON.parse(JSON.stringify(state));

const emptyDiff = (): SceneDiff => ({ relationships: [], knowledge: [], events: [], notes: [] });

const findRelationship = (relationships: Relationship[], fromId: string, toId: string) =>
  relationships.find((rel) => rel.fromId === fromId && rel.toId === toId);

export function createInitialWorldState(canonWorld: CanonWorld): WorldState {
  const characters = canonWorld.characters.map((c) => ({ ...c, knowledge: [] as KnowledgeEntry[] }));
  const knowledgeEntries = [...canonWorld.knowledge];

  knowledgeEntries.forEach((entry) => {
    entry.knownBy.forEach((characterId) => {
      const character = characters.find((c) => c.id === characterId);
      if (character) {
        character.knowledge.push({ id: entry.id, content: entry.content, knownBy: entry.knownBy });
      }
    });
  });

  return {
    title: canonWorld.title,
    characters,
    locations: [...canonWorld.locations],
    items: [...canonWorld.items],
    relationships: [...canonWorld.relationships],
    events: [...canonWorld.events],
    knowledge: knowledgeEntries,
    plotFlags: { ...(canonWorld.plotFlags ?? {}) },
    time: canonWorld.startTime ?? 0
  };
}

function applyAddKnowledge(state: WorldState, diff: SceneDiff, intervention: Extract<Intervention, { type: 'addKnowledge' }>) {
  const character = state.characters.find((c) => c.id === intervention.characterId);
  if (!character) return;
  const existing = character.knowledge.find((k) => k.id === intervention.knowledgeId);
  if (existing) return;

  const globalEntry = state.knowledge.find((k) => k.id === intervention.knowledgeId);
  if (globalEntry) {
    if (!globalEntry.knownBy.includes(character.id)) {
      globalEntry.knownBy.push(character.id);
    }
    character.knowledge.push({ id: globalEntry.id, content: globalEntry.content, knownBy: globalEntry.knownBy });
  } else {
    const entry = { id: intervention.knowledgeId, content: intervention.content, knownBy: [character.id] };
    character.knowledge.push(entry);
    state.knowledge.push(entry);
  }

  const knowledgeChange: KnowledgeChange = {
    characterId: character.id,
    knowledgeId: intervention.knowledgeId,
    added: true,
    content: intervention.content
  };
  diff.knowledge.push(knowledgeChange);
  diff.notes.push(`${character.name} learns: ${intervention.content}`);
}

function applyAdjustTrust(
  state: WorldState,
  diff: SceneDiff,
  intervention: Extract<Intervention, { type: 'adjustTrust' }>
) {
  const { fromId, toId, delta } = intervention;
  let relationship = findRelationship(state.relationships, fromId, toId);
  if (!relationship) {
    relationship = { id: `${fromId}->${toId}`, fromId, toId, trust: 0, hostility: 0 };
    state.relationships.push(relationship);
  }
  const previousTrust = relationship.trust;
  relationship.trust = Math.max(Math.min(previousTrust + delta, 100), -100);
  const change: RelationshipChange = { fromId, toId, previousTrust, newTrust: relationship.trust };
  diff.relationships.push(change);
  diff.notes.push(`Trust between ${fromId} and ${toId} shifts by ${delta}.`);
}

function applyMoveEvent(
  state: WorldState,
  diff: SceneDiff,
  intervention: Extract<Intervention, { type: 'moveEvent' }>
) {
  const event = state.events.find((e) => e.id === intervention.eventId);
  if (!event) return;
  const fromTime = event.time;
  event.time = intervention.newTime;
  const change: EventChange = { eventId: event.id, fromTime, toTime: intervention.newTime };
  diff.events.push(change);
  diff.notes.push(`Event ${event.id} moved from ${fromTime} to ${intervention.newTime}.`);
}

function applyToggleFlag(state: WorldState, diff: SceneDiff, intervention: Extract<Intervention, { type: 'toggleFlag' }>) {
  const previous = state.plotFlags[intervention.flag];
  state.plotFlags[intervention.flag] = intervention.value;
  diff.notes.push(`Plot flag ${intervention.flag} set to ${intervention.value} (was ${previous ?? 'unset'}).`);
}

export function applyIntervention(state: WorldState, intervention: Intervention): SimulationStepResult {
  const validation = validateIntervention(state, intervention);
  const baseDiff = emptyDiff();
  if (!validation.valid) {
    return {
      previousState: state,
      newState: state,
      diff: baseDiff,
      warnings: validation.violations.map((v) => v.message),
      applied: false
    };
  }

  const newState = cloneState(state);
  switch (intervention.type) {
    case 'addKnowledge':
      applyAddKnowledge(newState, baseDiff, intervention);
      break;
    case 'adjustTrust':
      applyAdjustTrust(newState, baseDiff, intervention);
      break;
    case 'moveEvent':
      applyMoveEvent(newState, baseDiff, intervention);
      break;
    case 'toggleFlag':
      applyToggleFlag(newState, baseDiff, intervention);
      break;
  }

  newState.time += 1;

  return {
    previousState: state,
    newState,
    diff: baseDiff,
    warnings: [],
    applied: true
  };
}
