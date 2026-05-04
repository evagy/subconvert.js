import express from 'express';
import {
  subconverterHandler,
  versionHandler,
  flushCacheHandler,
  sub2clashrHandler,
  loadSettings,
  getSettings,
} from './interfaces';

export function createServer(): express.Application {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  // Routes
  app.get('/version', versionHandler);
  app.get('/flushcache', flushCacheHandler);
  app.get('/sub', subconverterHandler);
  app.head('/sub', subconverterHandler);
  app.get('/sub2clashr', sub2clashrHandler);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}

export async function startServer(configPath?: string): Promise<void> {
  // Load settings if config path provided
  if (configPath) {
    await loadSettings(configPath);
  }

  const settings = getSettings();
  const app = createServer();

  const port = settings.listenPort;
  const host = settings.listenAddress;

  app.listen(port, host, () => {
    console.log(`Subconverter server running at http://${host}:${port}`);
    console.log(`API mode: ${settings.apiMode}`);
    console.log(`Access token: ${settings.accessToken ? '****' : 'none'}`);
  });
}
