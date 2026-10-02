# CodeCollab: real-time collaborative code editor

React + Monaco + Node/Express + Socket.io + MongoDB (optional).

## Features
- Multi-user live editing (incremental Monaco edits over WebSockets)
- Remote cursors and selections with name labels
- Room chat, presence list, syntax highlighting for 12 languages
- Dark/light theme toggle
- Save/load/delete snippets (MongoDB, or in-memory if `MONGO_URI` is unset)
- Share link: `?room=<id>`

## Run locally
```bash
npm run install:all
npm run dev:server   # terminal 1, http://localhost:4000
npm run dev:client   # terminal 2, http://localhost:5173
```
Open the page in two tabs (same `?room=` URL) to see collaboration.

## Deploy (single service, e.g. Render)
- Build command: `npm run render-build`
- Start command: `npm start`
- Env: `MONGO_URI` (Atlas free tier)

The server serves the built client, so no CORS setup is needed.

## Split deploy (Vercel client + Railway/Render server)
- Client env: `VITE_SERVER_URL=https://your-server.example.com`
- Server env: `CLIENT_ORIGIN=https://your-client.vercel.app`
