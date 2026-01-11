# social-media-service

This repository contains a basic microservices chat platform built with NestJS and a React front-end. It includes:

- **Chat Service** (`backend/chat-service`) for 1:1 and group conversations with PostgreSQL persistence.
- **Message Worker** (`backend/message-worker`) for processing message workflow jobs.
- **Call Service** (`backend/call-service`) for audio/video call sessions with WebRTC signaling endpoints.
- **Gateway** (`backend/gateway`) as the API facade.
- **Front-end** (`frontend`) for browsing chats and placing calls.

## Services Overview

### Chat Service
- `POST /conversations` – Create 1:1 or group conversation.
- `GET /conversations/user/:userId` – List conversations for a user.
- `POST /conversations/:conversationId/messages` – Send a message (enqueued for processing).
- `PATCH /conversations/:conversationId/messages/:messageId` – Edit a message.
- `DELETE /conversations/:conversationId/messages/:messageId` – Delete a message.
- `GET /conversations/:conversationId/messages` – Fetch messages.

Chat data is stored in PostgreSQL via `CHAT_DATABASE_URL`.

### Message Workflow
Messages are enqueued to Redis and processed by the message worker, which persists them to PostgreSQL.

### Realtime Events
The chat service exposes Socket.IO for presence, typing, and message updates:

- `presence:join` with `{ userId, displayName }`
- `presence:update` broadcast of online users
- `typing:update` with `{ conversationId, userId, displayName, isTyping }`
- `message:created`, `message:updated`, `message:deleted` events

### Call Service
- `POST /calls` – Start an audio or video call.
- `PATCH /calls/:callId/status` – Update call status.
- `GET /calls/conversation/:conversationId` – List calls for a conversation.
- `POST /calls/:callId/signals/offer` – Store WebRTC offer payloads.
- `GET /calls/:callId/signals/offer` – List stored offers.
- `POST /calls/:callId/signals/answer` – Store WebRTC answer payloads.
- `GET /calls/:callId/signals/answer` – List stored answers.
- `POST /calls/:callId/signals/ice` – Store ICE candidates.
- `GET /calls/:callId/signals/ice` – List ICE candidates.

### Gateway
The gateway mirrors the above endpoints and forwards to the microservices.

## Front-end
Open `frontend/index.html` in a browser (or serve it locally) to view the basic chat/call UI. The UI expects the gateway to run at `http://localhost:3000` and Socket.IO at `http://localhost:3001`.

## Docker

Build and run the stack:

```bash
docker compose up --build
```

Services will be available at:

- Gateway: `http://localhost:3000`
- Chat service: `http://localhost:3001`
- Call service: `http://localhost:3002`
- Front-end: `http://localhost:8080`
- Postgres: `http://localhost:5432`
- Redis: `http://localhost:6379`

## Tests (Docker)

Run unit and end-to-end tests in containers:

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml up --build --abort-on-container-exit --exit-code-from test-runner
```

Unit tests run within the chat-service container, while the `test-runner` container exercises the full gateway flow.
