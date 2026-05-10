# Elixir Video Chat

Bare-minimum group video chat: **Phoenix** for signaling (`/socket`, `/api/webrtc-config`), **React + Vite** for the UI and WebRTC mesh. No database, chat, or recording.

## Requirements

- Erlang/OTP and Elixir (see [.tool-versions](.tool-versions) if you use [asdf](https://asdf-vm.com))
- [Node.js](https://nodejs.org/) 18+ for the `frontend/` app

## Setup

```bash
cd elixir-video-chat
mix setup
```

This runs `mix deps.get`, `npm install` in `frontend/`, and `npm run build` (writes `priv/static/`).

## Development (two processes)

**Terminal 1 — Phoenix (API + WebSocket):**

```bash
mix phx.server
```

Runs on **http://localhost:4000**.

**Terminal 2 — Vite (React HMR):**

```bash
cd frontend && npm install && npm run dev
```

Open **http://localhost:5173**. Vite proxies **`/api`** and **`/socket`** to port 4000, so the browser talks to one origin while Phoenix stays on 4000.

## Production-style from Phoenix only

After `mix assets.build` (or `mix setup`), `priv/static/index.html` exists. Then:

```bash
mix phx.server
```

Open **http://localhost:4000** — Phoenix serves the compiled SPA and static hashed assets.

## Layout

| Path | Served by |
|------|-----------|
| React app | `frontend/` → build output in `priv/static/` |
| `GET /api/webrtc-config` | Phoenix JSON (`WebrtcConfigController`) |
| WebSocket `/socket` | Phoenix `UserSocket` / `RoomChannel` |

ICE servers default in [config/config.exs](config/config.exs). Override with **`WEBRTC_ICE_SERVERS`** (JSON array) at **application start** — see [lib/elixir_video_chat/application.ex](lib/elixir_video_chat/application.ex).

Example:

```bash
export WEBRTC_ICE_SERVERS='[{"urls":"stun:stun.l.google.com:19302"},{"urls":"turn:turn.example.com:3478","username":"u","credential":"p"}]'
mix phx.server
```

## Deploy build

```bash
cd frontend && npm ci && npm run build
MIX_ENV=prod mix assets.deploy
```

Then run your release as usual. Set `SECRET_KEY_BASE`, `PHX_HOST`, and `PORT` via [config/runtime.exs](config/runtime.exs).

## Limits (MVP)

- Mesh WebRTC is fine for a few participants; beyond that you’d add an SFU and keep Phoenix for signaling.

## Next steps (e.g. Tamagui)

With Vite in place, you can add **`@tamagui/vite-plugin`** (and friends) in `frontend/vite.config.ts` without fighting Phoenix’s old esbuild asset pipeline.
