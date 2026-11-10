import { createApp } from './app.js';
import { startServer } from './server.js';

/**
 * Application entry point.
 * 
 * Creates Express app and starts the server.
 * 
 * @example
 * ```bash
 * npm run dev    # Development mode with hot reload
 * npm start      # Production mode
 * ```
 */
async function main() {
  const app = createApp();
  await startServer(app);
}

main().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});

