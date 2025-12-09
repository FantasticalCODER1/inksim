import {
  ConstraintValidationResult,
  ConstraintViolation,
  Intervention,
  WorldState
} from './types.js';

const ensureCharacterExists = (state: WorldState, id: string, violations: ConstraintViolation[]) => {
  const exists = state.characters.some((c) => c.id === id);
  if (!exists) {
    violations.push({ code: 'character.notFound', message: `Character ${id} does not exist.` });
  }
};

const ensureEventExists = (state: WorldState, id: string, violations: ConstraintViolation[]) => {
  const exists = state.events.some((e) => e.id === id);
  if (!exists) {
    violations.push({ code: 'event.notFound', message: `Event ${id} does not exist.` });
  }
};

export function validateIntervention(state: WorldState, intervention: Intervention): ConstraintValidationResult {
  const violations: ConstraintViolation[] = [];

  switch (intervention.type) {
    case 'addKnowledge': {
      ensureCharacterExists(state, intervention.characterId, violations);
      if (!intervention.content.trim()) {
        violations.push({ code: 'knowledge.empty', message: 'Knowledge content cannot be empty.' });
      }
      break;
    }
    case 'adjustTrust': {
      ensureCharacterExists(state, intervention.fromId, violations);
      ensureCharacterExists(state, intervention.toId, violations);
      if (intervention.fromId === intervention.toId) {
        violations.push({ code: 'relationship.self', message: 'Cannot adjust trust towards the same character.' });
      }
      break;
    }
    case 'moveEvent': {
      ensureEventExists(state, intervention.eventId, violations);
      if (intervention.newTime < 0) {
        violations.push({ code: 'event.negativeTime', message: 'Event time cannot be negative.' });
      }
      break;
    }
    case 'toggleFlag': {
      if (!intervention.flag.trim()) {
        violations.push({ code: 'flag.empty', message: 'Flag identifier cannot be empty.' });
      }
      break;
    }
    default: {
      const exhaustive: never = intervention;
      throw new Error(`Unhandled intervention type: ${exhaustive}`);
    }
  }

  const valid = violations.length === 0;
  return { valid, violations };
}
