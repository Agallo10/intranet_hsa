# Implementation Plan: Chat interno (1 a 1)

**Branch**: `006-chat-interno` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

## Summary

Chat 1 a 1 en tiempo real con Socket.IO, persistencia en PostgreSQL, presencia, no-leídos,
adjuntos y "escribiendo". El envío de mensajes (con adjuntos) se hace por HTTP multipart; Socket.IO
maneja entrega en tiempo real, presencia, "escribiendo" y contadores de no-leídos.

## Technical Context

**Language/Version**: TypeScript (NestJS + React 19)

**Primary Dependencies**: `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`,
`socket.io-client`; TypeORM; shadcn/ui + TanStack Query

**Storage**: PostgreSQL (tabla `messages`) + disco local (`uploads/chat/`)

## Constitution Check

| Principio | Cumplimiento |
|-----------|--------------|
| I. Seguridad | PASS: auth JWT en handshake del socket; adjuntos servidos con token |
| II. Separación | PASS: cambios backend + frontend |
| III. Simplicidad | PASS: una entidad + gateway + endpoints |
| IV. Calidad | PASS: build + lint + tests |
| V. Spec-driven | PASS: este flujo |

## Arquitectura

- **Socket.IO gateway** (`ChatGateway`): autentica el handshake con JWT, mantiene el mapa de
  usuarios en línea (`onlineUsers`), emite `message`, `typing`, `presence`, `unread`, `online:init`.
- **REST** (`ChatController`): `GET /chat/users` (directorio), `GET /chat/conversations`,
  `GET /chat/messages/:userId`, `POST /chat/messages` (multipart con adjunto opcional),
  `POST /chat/messages/:userId/read`, `GET /chat/attachment/:id`.
- **ChatService**: persistencia, historial, no-leídos, adjuntos.

## Data model

- **Message**: id, senderId, receiverId, content?, attachmentPath?, attachmentName?,
  attachmentMime?, attachmentSize?, isRead, createdAt.

## Complexity Tracking

Sin violaciones.
