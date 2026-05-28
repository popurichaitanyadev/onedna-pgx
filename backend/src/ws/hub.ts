import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'node:http';
import { verifyAccessToken } from '../utils/jwt.js';

// PRD §6.5 — native 'ws', Socket.io explicitly excluded.
// Admin connections only; authenticated via JWT query param on handshake.

export interface SubmissionNotification {
  type: 'FORM_SUBMITTED';
  submissionId: string;
  patientName: string;
  submittedBy: string;
  timestamp: string;
}

const adminSockets = new Set<WebSocket>();

export function initWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // Authenticate via ?token=... on handshake
    const url = new URL(req.url ?? '', 'http://localhost');
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(1008, 'Unauthorized');
      return;
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      ws.close(1008, 'Invalid token');
      return;
    }

    // Only admins subscribe to the notification channel
    if (payload.role !== 'admin') {
      ws.close(1008, 'Forbidden');
      return;
    }

    adminSockets.add(ws);
    ws.send(JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() }));

    ws.on('close', () => adminSockets.delete(ws));
    ws.on('error', () => adminSockets.delete(ws));

    // Heartbeat to keep connections healthy
    ws.on('pong', () => ((ws as any).isAlive = true));
  });

  // Ping every 30s, drop dead connections
  const interval = setInterval(() => {
    for (const ws of adminSockets) {
      if ((ws as any).isAlive === false) {
        ws.terminate();
        adminSockets.delete(ws);
        continue;
      }
      (ws as any).isAlive = false;
      ws.ping();
    }
  }, 30_000);

  wss.on('close', () => clearInterval(interval));

  console.log('🔌 WebSocket server ready at /ws');
  return wss;
}

// Broadcast a submission event to all connected admins (PRD §6.5)
export function broadcastSubmission(payload: SubmissionNotification) {
  const msg = JSON.stringify(payload);
  for (const ws of adminSockets) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  }
}
