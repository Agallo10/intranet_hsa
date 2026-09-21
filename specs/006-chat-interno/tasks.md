# Tasks: Chat interno (1 a 1)

## Phase 1: Backend — modelo y servicio

- [ ] T001 [P] [US1] Crear entidad `Message` en `backend/src/chat/message.entity.ts`
- [ ] T002 [US1] Crear `ChatService` (send, history, markRead, unread, conversations) en
  `backend/src/chat/chat.service.ts`

## Phase 2: Backend — gateway y REST

- [ ] T003 [US1/US2/US5] Crear `ChatGateway` (auth, presencia, typing) en `backend/src/chat/chat.gateway.ts`
- [ ] T004 [US1/US3/US4] Crear `ChatController` (directorio, conversaciones, historial, enviar, leer,
  adjunto) en `backend/src/chat/chat.controller.ts`
- [ ] T005 Crear `ChatModule` + registrar en `app.module.ts`
- [ ] T006 Configurar subida de adjuntos (multer → `uploads/chat/`)

## Phase 3: Backend — verificación

- [ ] T007 build + typecheck + lint + tests

## Phase 4: Frontend — base

- [ ] T008 [P] Tipos de chat en `frontend/src/lib/types.ts`
- [ ] T009 Crear `SocketProvider` (`frontend/src/features/chat/`)
- [ ] T010 Añadir ruta `/chat` y enlace en sidebar

## Phase 5: Frontend — UI del chat

- [ ] T011 [US1] Página `Chat.tsx` (lista de conversaciones + mensajes)
- [ ] T012 [US2] Presencia (online) en la lista y cabecera
- [ ] T013 [US3] No-leídos (badges) y marcar como leído
- [ ] T014 [US4] Adjuntos (enviar/descargar)
- [ ] T015 [US5] Indicador de "escribiendo"

## Phase 6: Verificación

- [ ] T016 build + lint frontend
- [ ] T017 smoke test end-to-end
