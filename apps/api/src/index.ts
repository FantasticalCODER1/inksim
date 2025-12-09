import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import type { Intervention } from '@inksim/core';
import { createNarratorFromEnv, StubNarrator } from '@inksim/narrator';
import type { NarrationAdapter } from '@inksim/narrator';
import {
  getWorldState,
  processIntervention,
  narrateStep,
  getRunLog,
  resetRun,
  selectScenario,
  getCurrentScenario
} from './state.js';
import { getAvailableScenarios } from '@inksim/canon';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.disable('etag');


let narrator: NarrationAdapter = new StubNarrator();
createNarratorFromEnv()
  .then((adapter: NarrationAdapter) => {
    narrator = adapter;
  })
  .catch(() => {
    narrator = new StubNarrator();
  });

app.get('/api/world', (_req, res) => {
  res.json({ world: getWorldState(), scenario: getCurrentScenario() });
});

app.post('/api/world/reset', (_req, res) => {
  const { world, run } = resetRun();
  const { metrics } = getRunLog();
  res.json({ world, run, metrics, scenario: getCurrentScenario() });
});

app.post('/api/world/step', async (req, res) => {
  const intervention = req.body as Intervention;
  if (!intervention || typeof intervention.type !== 'string') {
    res.status(400).json({ error: 'Invalid intervention payload.' });
    return;
  }

  const result = processIntervention(intervention);
  if (!result.applied) {
    res.status(400).json({ result });
    return;
  }

  const narration = await narrateStep(narrator, intervention, result.diff);
  const runInfo = getRunLog();
  res.json({ result, narration, run: runInfo.log, metrics: runInfo.metrics, scenario: getCurrentScenario() });
});

app.get('/api/run', (_req, res) => {
  const runInfo = getRunLog();
  res.json({ ...runInfo, scenario: getCurrentScenario() });
});

app.post('/api/run/reset', (_req, res) => {
  const { world, run } = resetRun();
  const { metrics } = getRunLog();
  res.json({ world, run, metrics, scenario: getCurrentScenario() });
});

app.get('/api/scenarios', (_req, res) => {
  res.json({ scenarios: getAvailableScenarios(), current: getCurrentScenario() });
});

app.post('/api/scenarios/select', (req, res) => {
  const { id } = req.body as { id?: string };
  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Scenario id required.' });
    return;
  }
  const selection = selectScenario(id);
  res.json(selection);
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
