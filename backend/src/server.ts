import { buildApp } from './app.js';
import { config } from './config/index.js';
import { initWebSocket } from './ws/hub.js';

async function main() {
  const app = await buildApp();

  await app.listen({ port: config.PORT, host: '0.0.0.0' });

  // Attach native ws server to the same HTTP server (PRD §6.5)
  initWebSocket(app.server);

  console.log(`🚀 API listening on :${config.PORT} (${config.NODE_ENV})`);
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
