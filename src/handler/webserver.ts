import express from 'express';
import * as fs from 'fs';
import {
  subconverterHandler,
  versionHandler,
  flushCacheHandler,
  sub2clashrHandler,
  loadSettings,
  getSettings,
} from './interfaces';

function isSocketActivated(): boolean {
  try {
    return fs.fstatSync(3).isSocket();
  } catch {
    return false;
  }
}

let lastRequestTime = Date.now();

export function createServer(): express.Application {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Track idle time
  app.use((_req, _res, next) => {
    lastRequestTime = Date.now();
    next();
  });

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

  const socketActivated = isSocketActivated();

  if (socketActivated) {
    const server = app.listen({ fd: 3 }, () => {
      console.log('Subconverter server running via launchd socket activation');
      console.log(`API mode: ${settings.apiMode}`);
    });

    // Auto-shutdown after 1 minute of idle
    const IDLE_TIMEOUT_MS = 60_000;
    const idleCheck = setInterval(() => {
      if (Date.now() - lastRequestTime > IDLE_TIMEOUT_MS) {
        console.log('Idle timeout reached, shutting down...');
        clearInterval(idleCheck);
        server.close(() => process.exit(0));
      }
    }, 10_000);
  } else {
    const port = settings.listenPort;
    const host = settings.listenAddress;
    app.listen(port, host, () => {
      console.log(`Subconverter server running at http://${host}:${port}`);
      console.log(`API mode: ${settings.apiMode}`);
      console.log(`Access token: ${settings.accessToken ? '****' : 'none'}`);
    });
  }
}
