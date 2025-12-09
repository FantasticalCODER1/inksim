import { useEffect, useMemo, useState } from 'react';
import './App.css';

interface Character {
  id: string;
  name: string;
  traits: string[];
  knowledge: { id: string; content: string }[];
}

interface Relationship {
  id: string;
  fromId: string;
  toId: string;
  trust: number;
  hostility: number;
  description?: string;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  locationId?: string;
  participants: string[];
  time: number;
}

interface SceneDiff {
  relationships: Array<{ fromId: string; toId: string; previousTrust: number; newTrust: number }>;
  knowledge: Array<{ characterId: string; knowledgeId: string; added: boolean; content: string }>;
  events: Array<{ eventId: string; fromTime: number; toTime: number }>;
  notes: string[];
}

interface WorldState {
  title: string;
  characters: Character[];
  locations: { id: string; name: string }[];
  relationships: Relationship[];
  events: Event[];
  plotFlags: Record<string, boolean>;
  time: number;
}

interface SimulationStepResult {
  newState: WorldState;
  diff: SceneDiff;
  warnings: string[];
  applied: boolean;
}

interface NarrationResult {
  sceneText: string;
  analyticNotes: string[];
  usedStub?: boolean;
}

type Intervention =
  | { type: 'adjustTrust'; fromId: string; toId: string; delta: number }
  | { type: 'addKnowledge'; characterId: string; knowledgeId: string; content: string }
  | { type: 'moveEvent'; eventId: string; newTime: number }
  | { type: 'toggleFlag'; flag: string; value: boolean };

interface AllowedIntervention {
  type: Intervention['type'];
  description: string;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  allowedInterventions: AllowedIntervention[];
  targetQuestion?: string;
}

interface RunStep {
  intervention: Intervention;
  result: SimulationStepResult;
  timestamp: string;
}

interface RunLog {
  id: string;
  title?: string;
  steps: RunStep[];
  startedAt: string;
  lastUpdated: string;
}

interface RunMetrics {
  steps: number;
  relationshipChanges: number;
  knowledgeChanges: number;
  knowledgeSpread: number;
  tension: number;
  flagsSet: number;
  currentTime: number;
}

function App() {
  const [world, setWorld] = useState<WorldState | null>(null);
  const [narration, setNarration] = useState<NarrationResult | null>(null);
  const [lastDiff, setLastDiff] = useState<SceneDiff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trustForm, setTrustForm] = useState({ fromId: '', toId: '', delta: 5 });
  const [knowledgeForm, setKnowledgeForm] = useState({ characterId: '', content: '' });
  const [eventForm, setEventForm] = useState({ eventId: '', offset: 1 });

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [runLog, setRunLog] = useState<RunLog | null>(null);
  const [runMetrics, setRunMetrics] = useState<RunMetrics | null>(null);

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    if (world) {
      const [first, second] = world.characters;
      setTrustForm((prev) => ({ ...prev, fromId: prev.fromId || first?.id || '', toId: prev.toId || second?.id || '' }));
      setKnowledgeForm((prev) => ({ ...prev, characterId: prev.characterId || first?.id || '' }));
      setEventForm((prev) => ({ ...prev, eventId: prev.eventId || world.events[0]?.id || '' }));
    }
  }, [world]);

  const relationshipsByCharacter = useMemo(() => {
    if (!world) return {} as Record<string, Relationship[]>;
    return world.characters.reduce((acc, char) => {
      acc[char.id] = world.relationships.filter((rel) => rel.fromId === char.id);
      return acc;
    }, {} as Record<string, Relationship[]>);
  }, [world]);

  async function refreshAll() {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadScenarios(), loadWorld(), loadRun()]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function loadScenarios() {
    const res = await fetch('/api/scenarios');
    if (!res.ok) throw new Error('Failed to load scenarios');
    const data = await res.json();
    setScenarios(data.scenarios || []);
    if (data.current) setCurrentScenario(data.current);
  }

  async function loadWorld() {
    const res = await fetch('/api/world');
    if (!res.ok) throw new Error('Failed to load world');
    const data = await res.json();
    setWorld(data.world);
    if (data.scenario) setCurrentScenario(data.scenario);
    setNarration(null);
    setLastDiff(null);
  }

  async function loadRun() {
    const res = await fetch('/api/run');
    if (!res.ok) throw new Error('Failed to load run');
    const data = await res.json();
    setRunLog(data.log);
    setRunMetrics(data.metrics);
    if (data.scenario) setCurrentScenario(data.scenario);
  }

  async function resetWorldState() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/world/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to reset world');
      const data = await res.json();
      setWorld(data.world);
      setRunLog(data.run);
      setRunMetrics(data.metrics);
      if (data.scenario) setCurrentScenario(data.scenario);
      setNarration(null);
      setLastDiff(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function resetRunLog() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/run/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to reset run log');
      const data = await res.json();
      setWorld(data.world);
      setRunLog(data.run);
      setRunMetrics(data.metrics);
      if (data.scenario) setCurrentScenario(data.scenario);
      setNarration(null);
      setLastDiff(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function runIntervention(intervention: Intervention) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/world/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intervention)
      });
      const data = await res.json();
      if (!res.ok || !data.result?.applied) {
        const warning = data?.result?.warnings?.join('; ') || data?.error || 'Intervention rejected';
        throw new Error(warning);
      }
      const result: SimulationStepResult = data.result;
      setWorld(result.newState);
      setNarration(data.narration as NarrationResult);
      setLastDiff(result.diff);
      if (data.run) setRunLog(data.run as RunLog);
      if (data.metrics) setRunMetrics(data.metrics as RunMetrics);
      if (data.scenario) setCurrentScenario(data.scenario as Scenario);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function changeScenario(id: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/scenarios/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error('Failed to switch scenario');
      const data = await res.json();
      setWorld(data.world);
      setRunLog(data.run);
      setRunMetrics(data.metrics);
      setCurrentScenario(data.scenario);
      setNarration(null);
      setLastDiff(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!world) {
    return (
      <div className="app">
        <header>
          <h1>InkSim</h1>
          <p>Loading world...</p>
        </header>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <div>
          <h1>InkSim</h1>
          <p>A literary world simulation lab</p>
        </div>
        <div className="actions">
          <button onClick={refreshAll} disabled={loading}>
            Refresh
          </button>
          <button onClick={resetWorldState} disabled={loading}>
            Reset world
          </button>
        </div>
      </header>

      {currentScenario && (
        <section className="panel scenario">
          <div>
            <label htmlFor="scenario-select">Scenario</label>
            <select
              id="scenario-select"
              value={currentScenario.id}
              onChange={(e) => changeScenario(e.target.value)}
              disabled={loading}
            >
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="muted">{currentScenario.description}</p>
            {currentScenario.targetQuestion && <p className="muted">Prompt: {currentScenario.targetQuestion}</p>}
            <p className="muted">
              Allowed interventions: {currentScenario.allowedInterventions.map((a) => a.type).join(', ')}
            </p>
          </div>
        </section>
      )}

      {error && <div className="error">{error}</div>}
      {loading && <div className="status">Working...</div>}

      <section className="panel">
        <div>
          <h2>World overview</h2>
          <p>
            <strong>Title:</strong> {world.title}
          </p>
          <p>
            <strong>Time:</strong> {world.time}
          </p>
          <p>
            <strong>Plot flags:</strong>{' '}
            {Object.keys(world.plotFlags).length === 0
              ? 'None'
              : Object.entries(world.plotFlags)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(', ')}
          </p>
        </div>
        <div className="interventions">
          <div>
            <h3>Adjust trust</h3>
            <div className="form-row">
              <label>From</label>
              <select
                value={trustForm.fromId}
                onChange={(e) => setTrustForm((prev) => ({ ...prev, fromId: e.target.value }))}
              >
                {world.characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>To</label>
              <select value={trustForm.toId} onChange={(e) => setTrustForm((prev) => ({ ...prev, toId: e.target.value }))}>
                {world.characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>Delta</label>
              <input
                type="number"
                value={trustForm.delta}
                onChange={(e) => setTrustForm((prev) => ({ ...prev, delta: Number(e.target.value) }))}
              />
            </div>
            <button
              onClick={() =>
                runIntervention({ type: 'adjustTrust', fromId: trustForm.fromId, toId: trustForm.toId, delta: trustForm.delta })
              }
              disabled={loading}
            >
              Apply
            </button>
          </div>

          <div>
            <h3>Add knowledge</h3>
            <div className="form-row">
              <label>Character</label>
              <select
                value={knowledgeForm.characterId}
                onChange={(e) => setKnowledgeForm((prev) => ({ ...prev, characterId: e.target.value }))}
              >
                {world.characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>Detail</label>
              <input
                type="text"
                value={knowledgeForm.content}
                placeholder="What do they learn?"
                onChange={(e) => setKnowledgeForm((prev) => ({ ...prev, content: e.target.value }))}
              />
            </div>
            <button
              onClick={() =>
                runIntervention({
                  type: 'addKnowledge',
                  characterId: knowledgeForm.characterId,
                  knowledgeId: `${knowledgeForm.characterId}-${Date.now()}`,
                  content: knowledgeForm.content
                })
              }
              disabled={loading || !knowledgeForm.content}
            >
              Add knowledge
            </button>
          </div>

          <div>
            <h3>Move event</h3>
            <div className="form-row">
              <label>Event</label>
              <select value={eventForm.eventId} onChange={(e) => setEventForm((prev) => ({ ...prev, eventId: e.target.value }))}>
                {world.events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.title} (t={evt.time})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>Shift</label>
              <input
                type="number"
                value={eventForm.offset}
                onChange={(e) => setEventForm((prev) => ({ ...prev, offset: Number(e.target.value) }))}
              />
            </div>
            <button
              onClick={() =>
                runIntervention({ type: 'moveEvent', eventId: eventForm.eventId, newTime: currentEventTime(world, eventForm.eventId) + eventForm.offset })
              }
              disabled={loading}
            >
              Move event
            </button>
          </div>
        </div>
      </section>

      <section className="panel two-col">
        <div>
          <h2>Characters</h2>
          <ul className="list">
            {world.characters.map((char) => (
              <li key={char.id} className="card">
                <h3>{char.name}</h3>
                <p className="muted">Traits: {char.traits.join(', ') || 'None'}</p>
                <p className="muted">Knowledge: {char.knowledge.length || 0} entries</p>
                <div className="sublist">
                  <p className="label">Outgoing trust</p>
                  <ul>
                    {(relationshipsByCharacter[char.id] || []).map((rel) => (
                      <li key={rel.id}>
                        towards <strong>{rel.toId}</strong>: trust {rel.trust} ({rel.description || 'no note'})
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2>Timeline</h2>
          <ul className="list">
            {[...world.events]
              .sort((a, b) => a.time - b.time)
              .map((evt) => (
                <li key={evt.id} className="card">
                  <strong>{evt.title}</strong> (t={evt.time})
                  <p className="muted">Participants: {evt.participants.join(', ')}</p>
                  <p className="muted">{evt.description}</p>
                </li>
              ))}
          </ul>
        </div>
      </section>

      <section className="panel two-col">
        <div>
          <h2>Narrated scene</h2>
          {narration ? (
            <div className="card">
              <p>{narration.sceneText}</p>
              <ul>
                {narration.analyticNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
              {narration.usedStub && <p className="muted">Stub narrator in use.</p>}
            </div>
          ) : (
            <p className="muted">Run an intervention to view narrated output.</p>
          )}
        </div>
        <div>
          <h2>Latest scene diff</h2>
          {lastDiff ? (
            <div className="card diff">
              <h4>Relationship changes</h4>
              {lastDiff.relationships.length === 0 ? <p className="muted">None</p> : null}
              <ul>
                {lastDiff.relationships.map((change, idx) => (
                  <li key={idx}>
                    {change.fromId} → {change.toId}: {change.previousTrust} → {change.newTrust}
                  </li>
                ))}
              </ul>
              <h4>Knowledge updates</h4>
              {lastDiff.knowledge.length === 0 ? <p className="muted">None</p> : null}
              <ul>
                {lastDiff.knowledge.map((k, idx) => (
                  <li key={idx}>
                    {k.characterId} {k.added ? 'learns' : 'forgets'} "{k.content}"
                  </li>
                ))}
              </ul>
              <h4>Event changes</h4>
              {lastDiff.events.length === 0 ? <p className="muted">None</p> : null}
              <ul>
                {lastDiff.events.map((e, idx) => (
                  <li key={idx}>
                    {e.eventId} moved from {e.fromTime} to {e.toTime}
                  </li>
                ))}
              </ul>
              <h4>Notes</h4>
              {lastDiff.notes.length === 0 ? <p className="muted">None</p> : null}
              <ul>
                {lastDiff.notes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="muted">No changes yet.</p>
          )}
        </div>
      </section>

      <section className="panel two-col analytics">
        <div>
          <h2>Run analytics</h2>
          {runMetrics ? (
            <div className="metrics-grid">
              <div>
                <span className="label">Steps</span>
                <strong>{runMetrics.steps}</strong>
              </div>
              <div>
                <span className="label">Relationship changes</span>
                <strong>{runMetrics.relationshipChanges}</strong>
              </div>
              <div>
                <span className="label">Knowledge changes</span>
                <strong>{runMetrics.knowledgeChanges}</strong>
              </div>
              <div>
                <span className="label">Knowledge spread</span>
                <strong>{runMetrics.knowledgeSpread}</strong>
              </div>
              <div>
                <span className="label">Tension score</span>
                <strong>{runMetrics.tension}</strong>
              </div>
              <div>
                <span className="label">Flags set</span>
                <strong>{runMetrics.flagsSet}</strong>
              </div>
              <div>
                <span className="label">Current time</span>
                <strong>{runMetrics.currentTime}</strong>
              </div>
            </div>
          ) : (
            <p className="muted">No run data yet.</p>
          )}
          <div className="actions">
            <button onClick={resetRunLog} disabled={loading}>
              Clear run
            </button>
          </div>
        </div>
        <div>
          <h2>Run steps</h2>
          {runLog && runLog.steps.length > 0 ? (
            <ul className="list">
              {runLog.steps.map((step, idx) => (
                <li key={step.timestamp} className="card">
                  <div className="step-header">
                    <strong>
                      Step {idx + 1}: {step.intervention.type}
                    </strong>
                    <span className="muted">t={step.result.newState.time}</span>
                  </div>
                  <p className="muted">{new Date(step.timestamp).toLocaleTimeString()}</p>
                  <ul className="muted">
                    {step.result.diff.notes.map((note, noteIdx) => (
                      <li key={noteIdx}>{note}</li>
                    ))}
                    {step.result.diff.notes.length === 0 && <li>No diff notes recorded.</li>}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No steps recorded yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function currentEventTime(world: WorldState, eventId: string): number {
  const evt = world.events.find((e) => e.id === eventId);
  return evt ? evt.time : 0;
}

export default App;
