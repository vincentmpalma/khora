# Khora

A real-time collaborative system architecture diagramming tool. Build infrastructure diagrams together, live. **[khora.build](https://khora.build)**

---

## Features

- **Real-time collaboration** — multiple users edit the same canvas simultaneously
- **Live cursors** — see every participant's named cursor as they move
- **10 infrastructure component types** — services, databases, caches, queues, load balancers, CDNs, and more
- **Protocol-aware edges** — connections auto-configure protocols based on which components you link
- **Configurable attributes** — each component has typed fields editable in a side panel
- **Guest access** — invite anyone via link, no account required
- **Canvas persistence** — auto-saves to PostgreSQL with state recovery after server restarts
- **Export** — download diagrams as PNG or PDF

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, React Flow |
| Real-time sync | Yjs (CRDTs), Socket.IO, y-socket.io |
| Horizontal scaling | Redis pub/sub adapter (`@socket.io/redis-adapter`) |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Deployment | Vercel (frontend), Railway (backend + Postgres + Redis) |

## Performance

Load tested against the production deployment:

- **52 concurrent editors** in a single room
- **p50: 85ms / p95: 97ms** end-to-end sync latency (510 samples)

Methodology: 51 receiver clients in one Node.js process, sender in a separate child process (to force updates through the network rather than the in-process BroadcastChannel), all connected to the deployed Railway backend.

## Architecture

```
Client A                     Server                      Client B
  │                            │                            │
  │  Y.Doc update              │                            │
  │ ──────────────────────►  Socket.IO                      │
  │                            │                            │
  │                      Redis pub/sub                      │
  │                      (broadcast to                      │
  │                       all instances)                    │
  │                            │                            │
  │                            │  Y.Doc update              │
  │                            │ ──────────────────────►    │
  │                            │                            │
  │                       PostgreSQL                        │
  │                    (canvas_state JSONB,                  │
  │                     debounced auto-save)                 │
```

**Sync flow:** Each client holds a local Yjs document. Changes are encoded as CRDT updates and sent to the server via Socket.IO. The Redis adapter broadcasts them across all server instances. Receiving clients apply the update to their local doc — Yjs guarantees eventual consistency regardless of order or concurrency.

**State recovery:** On first connection to a room, the server seeds the in-memory Yjs document from the persisted `canvas_state` in PostgreSQL. If the server restarts and loses in-memory state, it reseeds automatically on the next connection — no data loss.

## Running Locally

**Prerequisites:** Node.js 18+, Docker

**1. Start Postgres and Redis**
```bash
docker-compose up -d
```

**2. Backend**
```bash
cd backend
cp .env.example .env   # fill in values
npm install
npm run dev
```

`.env` values:
```
PORT=3001
DATABASE_URL=postgres://khora:khora@localhost:5432/khora
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-here
```

**3. Run database migrations**
```bash
docker exec khora-postgres psql -U khora -d khora -f /dev/stdin < backend/schema.sql
```

**4. Frontend**
```bash
cd frontend
cp .env.example .env   # fill in values
npm install
npm run dev
```

`.env` values:
```
VITE_API_URL=http://localhost:3001
```

Open [http://localhost:5173](http://localhost:5173)
