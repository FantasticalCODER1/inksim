import { PlannedBeat, PlotPlanner, PlannerOptions, WorldState, Intervention } from './types.js';

export class NaivePlanner implements PlotPlanner {
  planNextBeat(state: WorldState, options?: PlannerOptions): PlannedBeat {
    const description = options?.targetTheme
      ? `Continue exploring theme: ${options.targetTheme}`
      : 'Maintain narrative momentum with a reflective beat.';

    const suggestedInterventions: Intervention[] = [];
    const uncertainRelationship = state.relationships.find((rel) => rel.trust < 30 && rel.trust > -30);
    if (uncertainRelationship) {
      suggestedInterventions.push({
        type: 'adjustTrust',
        fromId: uncertainRelationship.fromId,
        toId: uncertainRelationship.toId,
        delta: 5
      });
    }

    const earlyEvent = state.events.find((evt) => evt.time <= state.time + 1);
    if (earlyEvent) {
      suggestedInterventions.push({
        type: 'moveEvent',
        eventId: earlyEvent.id,
        newTime: earlyEvent.time + 1
      });
    }

    return { description, suggestedInterventions };
  }
}
