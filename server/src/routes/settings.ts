import { Router, Request, Response } from 'express';
import { getConfig, updateConfig } from '../config';
import { OpenDentalClient } from '../integrations/openDental/client';
import { isAvailable as isOllamaAvailable } from '../integrations/ollama/client';

const router = Router();

// GET /settings — return the full config
router.get('/', (_req: Request, res: Response) => {
  const config = getConfig();
  res.json(config);
});

// PATCH /settings — deep merge updates into config
router.patch('/', (req: Request, res: Response) => {
  try {
    const updated = updateConfig(req.body);
    res.json(updated);
  } catch (err) {
    console.error('[settings] Failed to update config:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// POST /settings/test-connection — test Open Dental connection
router.post('/test-connection', async (_req: Request, res: Response) => {
  try {
    const config = getConfig();

    if (config.mode !== 'live') {
      res.json({ connected: false, message: 'Switch to Live mode first' });
      return;
    }

    const { serverUrl, developerKey, customerKey } = config.openDental;

    if (!developerKey || !customerKey) {
      res.json({ connected: false, message: 'Open Dental credentials are not configured' });
      return;
    }

    const client = new OpenDentalClient({ serverUrl, developerKey, customerKey });
    const connected = await client.testConnection();

    res.json({
      connected,
      message: connected
        ? 'Successfully connected to Open Dental'
        : 'Could not reach Open Dental server. Check that Open Dental is running and credentials are correct.',
    });
  } catch (err) {
    console.error('[settings] Connection test failed:', err);
    res.json({
      connected: false,
      message: err instanceof Error ? err.message : 'Connection test failed',
    });
  }
});

// POST /settings/sync — placeholder for full data sync from Open Dental
router.post('/sync', async (_req: Request, res: Response) => {
  const config = getConfig();

  if (config.mode !== 'live') {
    res.json({ success: false, message: 'Switch to Live mode to sync data from Open Dental' });
    return;
  }

  // Placeholder — future implementation will pull patients, appointments, etc.
  res.json({
    success: true,
    message: 'Sync initiated. Full data pull from Open Dental will be implemented in a future update.',
  });
});

// POST /settings/switch-mode — switch between demo and live mode
router.post('/switch-mode', (req: Request, res: Response) => {
  try {
    const { mode } = req.body as { mode?: 'demo' | 'live' };

    if (mode !== 'demo' && mode !== 'live') {
      res.status(400).json({ error: 'mode must be "demo" or "live"' });
      return;
    }

    if (mode === 'live') {
      const config = getConfig();
      const { developerKey, customerKey } = config.openDental;

      if (!developerKey || !customerKey) {
        res.status(400).json({
          error: 'Cannot switch to live mode without Open Dental credentials. Configure them first via PATCH /settings.',
        });
        return;
      }
    }

    const updated = updateConfig({ mode });
    res.json(updated);
  } catch (err) {
    console.error('[settings] Failed to switch mode:', err);
    res.status(500).json({ error: 'Failed to switch mode' });
  }
});

// GET /settings/status — check status of all services
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const config = getConfig();

    let openDentalConnected = false;
    if (config.mode === 'live' && config.openDental.developerKey && config.openDental.customerKey) {
      try {
        const client = new OpenDentalClient(config.openDental);
        openDentalConnected = await client.testConnection();
      } catch {
        openDentalConnected = false;
      }
    }

    let ollamaAvailable = false;
    try {
      ollamaAvailable = await isOllamaAvailable();
    } catch {
      ollamaAvailable = false;
    }

    res.json({
      mode: config.mode,
      openDentalConnected,
      ollamaAvailable,
    });
  } catch (err) {
    console.error('[settings] Failed to get status:', err);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

export default router;
