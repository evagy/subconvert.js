import { startServer } from './handler/webserver';
import * as path from 'path';

async function main(): Promise<void> {
  const configPath = process.argv[2] || path.join(__dirname, '..', 'pref.ini');

  console.log('Starting Subconverter TypeScript...');
  console.log(`Config: ${configPath}`);

  await startServer(configPath);
}

main().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
