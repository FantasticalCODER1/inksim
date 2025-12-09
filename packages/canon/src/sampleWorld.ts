import { CanonWorld } from '@inksim/core';

export function getSampleCanonWorld(): CanonWorld {
  return {
    title: 'Mistwood Tides',
    characters: [
      { id: 'mara', name: 'Mara Thorne', traits: ['determined', 'protective'], alive: true, knowledge: [] },
      { id: 'ellis', name: 'Ellis Crane', traits: ['curious', 'restless'], alive: true, knowledge: [] },
      { id: 'piper', name: 'Piper Hale', traits: ['pragmatic', 'loyal'], alive: true, knowledge: [] },
      { id: 'rowan', name: 'Rowan Vale', traits: ['secretive'], alive: true, knowledge: [] },
      { id: 'sera', name: 'Sera Lin', traits: ['calm', 'observant'], alive: true, knowledge: [] }
    ],
    locations: [
      { id: 'harbour', name: 'Harbourfront', description: 'Mist-shrouded docks' },
      { id: 'observatory', name: 'Old Observatory', description: 'Quiet perch above town' },
      { id: 'market', name: 'Market Square', description: 'Busy centre with gossip' }
    ],
    items: [
      { id: 'compass', name: 'Tide Compass', description: 'Gently humming navigation tool', ownerId: 'mara' },
      { id: 'journal', name: 'Weather Journal', description: 'Ellis keeps detailed notes', ownerId: 'ellis' }
    ],
    relationships: [
      { id: 'mara-ellis', fromId: 'mara', toId: 'ellis', trust: 35, hostility: 5, description: 'Mara doubts Ellis at times' },
      { id: 'mara-piper', fromId: 'mara', toId: 'piper', trust: 60, hostility: 0, description: 'Long time allies' },
      { id: 'ellis-rowan', fromId: 'ellis', toId: 'rowan', trust: -10, hostility: 20, description: 'Ellis is wary of Rowan' }
    ],
    events: [
      {
        id: 'e-arrival',
        title: 'Storm Arrival',
        description: 'A midnight storm batters the harbour',
        locationId: 'harbour',
        participants: ['mara', 'piper'],
        time: 0
      },
      {
        id: 'e-journal',
        title: 'Journal Misplaced',
        description: 'Ellis misplaces their weather journal',
        locationId: 'market',
        participants: ['ellis', 'sera'],
        time: 1
      },
      {
        id: 'e-omission',
        title: 'Rowan Conceals a Signal',
        description: 'Rowan withholds news of a beacon sighting',
        locationId: 'observatory',
        participants: ['rowan'],
        time: 2
      }
    ],
    knowledge: [
      { id: 'storm-origin', content: 'The storm is drawn to the Tide Compass.', knownBy: ['rowan'] },
      { id: 'hidden-beacon', content: 'A beacon shines beyond the reefs.', knownBy: ['rowan'] }
    ],
    plotFlags: {
      beaconSeen: false,
      compassAtRisk: true
    },
    startTime: 0
  };
}
