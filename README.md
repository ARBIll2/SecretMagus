# Secret Hitler Webapp Scaffold

This project lays the groundwork for a multiplayer implementation of **Secret Hitler** using React for the client and Node.js with socket.io for the server. The codebase is split into `/client` (React/Vite) and `/server` (Node.js).

## Stack
- **Frontend**: React
- **Backend**: Node.js + socket.io
- **Shared**: Common constants and utilities across client and server

## Getting Started
1. Install dependencies in both the client and server:
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```
2. Start local development servers:
   ```bash
   # in one terminal
   cd server && npm start

   # in another terminal
   cd client && npm run dev
   ```
The React app runs on Vite's default port and proxies socket connections to the local server.

## Deployment

### Vercel (Frontend)
1. Push this repository to GitHub.
2. In Vercel, create a new project from the `/client` folder.
3. Set the build command to `npm run build` and the output directory to `dist`.
4. Define an environment variable `VITE_SOCKET_URL` pointing to your Fly.io backend URL.

### Fly.io (Backend)
1. Install the Fly CLI and run `fly launch` inside the `server` folder.
2. Deploy with `fly deploy` which builds the Dockerfile and exposes port `3000`.
3. Optionally create a persistent volume by uncommenting the `mounts` block in `fly.toml`.

Set `CORS_ORIGIN` on Fly.io to the Vercel domain so socket connections are allowed.

This repository only contains scaffolding and TODOs. Follow comments in each file to gradually implement full game logic and a richer UI.
