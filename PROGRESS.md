# PHOTO GUESSER — PROGRESS & ROADMAP
### Estado del proyecto y plan de ejecución por fases

> **Uso de este archivo:** Adjunta este archivo junto con DESIGN.md y PRODUCT.md al inicio de cada chat de desarrollo. El asistente leerá primero PROGRESS.md para saber exactamente en qué fase estás, qué ya funciona, qué viene a continuación y qué restricciones hay que respetar. Actualiza la sección "Estado actual" y marca las tareas completadas antes de abrir cada chat nuevo.

---

## ESTADO ACTUAL DEL PROYECTO

```
Fase:        3 — Features Core (flujo completo)
Sprint:      3.1 — Pantalla de inicio + Unirse a partida (PENDIENTE)
Completado:  Fase 1 completa ✅
             Fase 2 completa ✅
               Sprint 2.1 — Worker base con Hono y rutas HTTP ✅
               Sprint 2.2 — Durable Object: state machine y WebSockets ✅
               Sprint 2.3 — R2 upload y borrado ✅ TESTEADO EN PRODUCCIÓN
             Deploy Worker a Cloudflare ✅
             Deploy Frontend a Cloudflare Pages ✅
             Variable de entorno VITE_API_URL configurada ✅
             Bucket R2 photo-guesser-photos creado y funcionando ✅
             Presigned URLs generándose correctamente ✅
             Borrado por prefijo funcionando ✅
```

**Repo GitHub:** [poner URL aquí]
**Deploy Cloudflare Pages:** ✅ funcionando
**Deploy Worker:** ✅ https://photo-guesser-worker.joelbenitezdonari.workers.dev
**Variable de entorno:** `VITE_API_URL=https://photo-guesser-worker.joelbenitezdonari.workers.dev`

---

## LO QUE YA ESTÁ HECHO (no tocar, no refactorizar)

### Fase 1 — Fundación ✅ COMPLETA

**Estructura de monorepo:**
- `frontend/` `worker/` `shared/` — estructura definitiva, en producción

**Configuración frontend:**
- `frontend/vite.config.ts` — Tailwind CSS 4 plugin + alias `@/` y `@shared/`
- `frontend/tsconfig.app.json` — `strict: true` + path aliases
- `frontend/index.html` — Google Fonts (Syne + Instrument Serif), viewport mobile
- `frontend/public/fonts/` — Geist Variable y GeistMono Variable (woff2, copiados de npm)

**Sistema de diseño (`frontend/src/`):**
- `src/index.css` — tokens completos `:root` + `.dark`, grain, focus ring, `@theme` Tailwind 4, `@font-face` para Geist
- `src/lib/utils.ts` — helper `cn()`
- `src/components/ui/button.tsx` — Button con `active:scale(0.97)` en 80ms CSS, variantes: default/secondary/outline/ghost/destructive
- `src/components/ui/card.tsx` — Card + CardHeader + CardTitle + CardContent + CardFooter
- `src/components/ui/badge.tsx` — Badge con variantes de estado de juego (correct/incorrect/pending)
- `src/components/ui/progress.tsx` — Progress overrideada
- `src/components/ui/dialog.tsx` — Dialog overrideada con Radix
- `src/components/shared/PolaroidFrame.tsx` — el componente identitario (padding Polaroid, shadow-photo, radius 2px)
- `src/components/shared/LoadingReveal.tsx` — cuarto oscuro con GSAP (barra autónoma o progreso real)
- `src/components/shared/RotatePrompt.tsx` — aviso landscape mobile

**Routing + páginas:**
- `src/main.tsx` — RouterProvider con todas las rutas: `/`, `/unirse`, `/sala/:code`, `/sala/:code/lobby`, `/sala/:code/juego`, `/design-system`
- `src/pages/HomePage.tsx` — stub (Syne 800 sobre bg-primary)
- `src/pages/JoinPage.tsx` — stub
- `src/pages/SalaPage.tsx` — stub
- `src/pages/LobbyPage.tsx` — stub
- `src/pages/GamePage.tsx` — stub
- `src/pages/DesignSystemPage.tsx` — página temporal de verificación visual (eliminar en Fase 3)

**Schemas compartidos:**
- `shared/schemas.ts` — contrato Zod completo: `ServerWSEventSchema`, `ClientWSEventSchema`, HTTP request/response schemas, `ERROR_CODES`, `ERROR_MESSAGES`

### Fase 2 — Backend Core ✅ COMPLETA — TESTEADO EN PRODUCCIÓN

**Worker (`worker/src/`):**
- `types.ts` — `Env` interface + `RateLimitEntry`
- `utils.ts` — `generateSalaCode()`, `generateJugadorId()`, `jsonError()`, `getClientIP()`, `normalizeSalaCode()`
- `schemas.ts` — Zod schemas locales para HTTP y WS
- `index.ts` — Hono 4 router completo:
  - `POST /api/sala` — genera código, rate limiting 10/IP/hora, inicializa DO
  - `POST /api/sala/:code/join` — valida Zod, delega al DO
  - `POST /api/sala/:code/foto` — valida mimeType/sizeBytes, genera key R2, genera presigned URL
  - `GET /api/sala/:code/ws` — WebSocket upgrade → DO
  - `DELETE /api/sala/:code` — cierra sala, borra fotos R2 por prefijo
  - `GET /health` — health check
- `GameRoom.ts` — Durable Object completo:
  - State machine: `waiting → lobby_ready → round_showing → round_results → game_over → resetting`
  - HTTP internal routes: `/init`, `/join`, `/auth`, `/close`
  - WebSocket manager: `Map<string, WebSocket>`, broadcast, sendTo
  - Eventos cliente→servidor: `JOIN`, `FOTOS_READY`, `START_GAME`, `ANSWER`, `PLAY_AGAIN`
  - Eventos servidor→cliente: todos los del contrato PRODUCT.md sección 9
  - `PLAYER_RESPONSE_COUNT` solo al propietario de la foto ✅
  - Lógica de rondas: Fisher-Yates shuffle, opciones, puntuación por velocidad
  - DO Alarm: cleanup a los 30 minutos de inactividad
  - Gestión de desconexiones y cambio de host automático

**Deploy:**
- Worker desplegado en Cloudflare ✅
- Frontend desplegado en Cloudflare Pages ✅
- `VITE_API_URL` configurada en `.env` local y en Cloudflare Pages ✅

---

## REGLAS GLOBALES PARA TODOS LOS CHATS DE DESARROLLO

Estas reglas aplican en todas las fases. El asistente debe leerlas antes de escribir cualquier línea de código.

### Stack — solo esto, nada más
- **Frontend:** Vite + React 19 + TypeScript 5 + React Router v7 + Zustand 5 + TanStack Query 5 + Zod 3 + Tailwind CSS 4 + shadcn/ui (overrideado) + GSAP + Motion (Framer Motion 11) + canvas-confetti
- **Backend:** Cloudflare Workers + Hono 4 + Durable Objects + R2 + Zod 3
- **Prohibido explícitamente:** Next.js, Vercel, Socket.io, Firebase, Supabase, Redux, GraphQL, Axios, Styled Components, Emotion, Three.js, Anime.js

### TypeScript — siempre estricto
- `strict: true` en tsconfig
- No `any` salvo que sea absolutamente inevitable y esté comentado con `// TODO: type this`
- Todos los tipos de eventos WebSocket y respuestas HTTP deben venir de `shared/schemas.ts` via Zod

### Estructura de carpetas — no cambiar
```
photo-guesser/
├── frontend/   ← Vite + React (Cloudflare Pages)
├── worker/     ← Cloudflare Worker (Hono + DO + R2)
└── shared/     ← Zod schemas compartidos frontend ↔ worker
```

### Variables de entorno
- `VITE_API_URL=https://photo-guesser-worker.joelbenitezdonari.workers.dev`
- En el frontend: usar siempre `import.meta.env.VITE_API_URL` como base URL para todas las llamadas HTTP y WebSocket al worker
- El WebSocket usa `wss://` (no `ws://`) en producción — derivar automáticamente del `VITE_API_URL`

### CSS — tokens siempre, valores hardcoded nunca
Nunca `color: #FF4D2E` en un componente. Siempre `color: var(--accent)`.
Los tokens CSS están definidos en su totalidad en DESIGN.md sección 10.

### Animaciones — separación estricta de herramientas
- Feedback táctil (botones, selección de opción): **CSS transition**, máx 150ms
- Secuencias narrativas de juego (reveal foto, resultado ronda, fin partida): **GSAP timelines**
- Estado de React que anima (listas, presencia en DOM, reordenamiento): **Motion (Framer)**
- Celebraciones puntuales: **canvas-confetti**
- Nunca mezclar: si un elemento necesita CSS táctil Y GSAP narrativo, actúan sobre propiedades distintas

### Accesibilidad — no negociable
- Todos los botones con solo icono deben tener `aria-label`
- Touch targets: `min-height: 44px` en todo lo interactivo, `min-height: 54px` en opciones de respuesta
- Focus rings visibles: `outline: 2px solid var(--accent); outline-offset: 2px`
- Contraste WCAG AA verificado (los colores ya están validados en DESIGN.md)

### Shadcn — siempre overrideado
Los componentes de shadcn son la base técnica, no la estética. Cada componente importado de shadcn debe ser modificado para usar los tokens de DESIGN.md. Si se ve como shadcn out-of-the-box, hay que seguir iterando.

---

## FASE 1 — FUNDACIÓN ✅ COMPLETA

### Sprint 1.1 — Estructura de monorepo y dependencias ✅
### Sprint 1.2 — Sistema de diseño y tokens CSS ✅
### Sprint 1.3 — Routing y páginas vacías ✅

---

## FASE 2 — BACKEND CORE
### Objetivo: Worker funcionando localmente y en producción con Durable Object, WebSockets y R2.

---

### Sprint 2.1 — Worker base con Hono y rutas HTTP ✅ COMPLETO
### Sprint 2.2 — Durable Object: state machine y WebSockets ✅ COMPLETO ✅ COMPLETO — TESTEADO EN PRODUCCIÓN

- Bucket `photo-guesser-photos` creado y activo en Cloudflare R2
- Presigned URLs generándose correctamente desde el Worker
- PUT directo desde cliente a R2 funcionando
- Borrado por prefijo `fotos/{salaCode}/` verificado en producción
- `getSignedUrl()` en `GameRoom.ts` genera URLs reales (no fallback) en producción

---

## FASE 3 — FEATURES CORE (FLUJO COMPLETO)
### Objetivo: El flujo completo funciona de punta a punta: crear sala → unirse → elegir fotos → jugar → resultado. Sin animaciones de juego aún — solo la lógica.
### Duración estimada: 3-4 sesiones de trabajo

> **Nota crítica para el próximo chat:** El frontend aún tiene páginas stub. Toda la Fase 3 construye sobre `VITE_API_URL` para conectar con el worker ya desplegado. Usar `import.meta.env.VITE_API_URL` en todas las llamadas. Para WebSocket: `wss://` derivado de `VITE_API_URL`.

---

### Sprint 3.1 — Pantalla de inicio + Unirse a partida
**Estado: PENDIENTE**
**Depende de:** Fase 2 completa

**Archivos lib/ a crear primero (base para toda la Fase 3):**

`frontend/src/lib/api.ts` — cliente HTTP centralizado:
```typescript
// Base URL del worker — siempre desde la variable de entorno
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8787'

// WebSocket URL: https → wss, http → ws
export function getWsUrl(salaCode: string, jugadorId: string): string {
  const base = API_BASE.replace(/^https/, 'wss').replace(/^http/, 'ws')
  return `${base}/api/sala/${salaCode}/ws?jugadorId=${jugadorId}`
}

export const api = {
  crearSala: () => fetch(`${API_BASE}/api/sala`, { method: 'POST' }),
  unirse: (code: string, nickname: string) => fetch(`${API_BASE}/api/sala/${code}/join`, { ... }),
  subirFoto: (code: string, body: FotoUploadRequest) => fetch(`${API_BASE}/api/sala/${code}/foto`, { ... }),
  cerrarSala: (code: string) => fetch(`${API_BASE}/api/sala/${code}`, { method: 'DELETE' }),
}
```

`frontend/src/lib/privacy.ts`:
```typescript
const KEY = 'pg_privacy_seen'
export const privacy = {
  hasSeen: () => { try { return !!localStorage.getItem(KEY) } catch { return false } },
  markSeen: () => { try { localStorage.setItem(KEY, '1') } catch { /* noop */ } },
}
```

`frontend/src/lib/share.ts` — helpers de compartir sala

**HomePage.tsx:**
- Logo "PHOTO GUESSER" con GUESSER en `var(--accent)`
- Tagline en Instrument Serif italic
- Botones "Crear partida" y "Unirse a partida"
- Siluetas Polaroid en el fondo (posición absoluta, opacity 0.08, `var(--bg-secondary)`)
- Animación de entrada: GSAP al montar (logo back.out, botones stagger)
- Al pulsar "Crear partida": `POST /api/sala` → redirect a `/sala/:code`

**JoinPage.tsx** (Escenario B — formulario manual):
- Campo código + campo nickname
- Auto-uppercase en el campo de código
- Validación inline con shake GSAP en error
- `PrivacyNotice.tsx` debajo del botón si `!privacy.hasSeen()`
- Al enviar: `POST /api/sala/:code/join` → redirect al lobby

**SalaPage.tsx** (Escenario A — link directo):
- Extrae `:code` de la URL con `useParams()`
- Solo muestra el campo nickname (código ya pre-rellenado y visible, solo lectura)
- `PrivacyNotice.tsx` igual que en JoinPage
- Al enviar: `POST /api/sala/:code/join` → redirect al lobby

**ShareRoom.tsx** (componente, no página):
- Código grande en Geist Mono con botón copiar
- QR dentro de `<PolaroidFrame>` via `api.qrserver.com`
- Botones: WhatsApp, copiar link, Web Share API (degradación silenciosa)
- Animación GSAP del código (flip reveal + stagger)
- `PrivacyNotice.tsx` aquí también

**Componentes a crear en `features/sala/components/`:**
- `CreateRoom.tsx`
- `JoinRoom.tsx`
- `ShareRoom.tsx`
- `RoomQR.tsx`
- `PrivacyNotice.tsx`

---

### Sprint 3.2 — Lobby en tiempo real
**Estado: PENDIENTE**
**Depende de:** Sprint 3.1 completo

**`features/juego/hooks/useGameSocket.ts`** — el hook más importante del frontend:
```typescript
function useGameSocket(salaCode: string, jugadorId: string) {
  return {
    estado: 'connecting' | 'connected' | 'disconnected' | 'reconnecting',
    jugadores: Jugador[],
    sendMessage: (msg: ClientWSEvent) => void,
    lastEvent: ServerWSEvent | null,
  }
}
```
- URL del WebSocket: `getWsUrl(salaCode, jugadorId)` de `lib/api.ts` — usa `VITE_API_URL`
- Reconexión automática con backoff exponencial (1s, 2s, 4s, máx 10s)
- Valida todos los mensajes entrantes con `ServerWSEventSchema.safeParse()`
- Mensajes que no pasan Zod se descartan silenciosamente

**`features/lobby/`:**
- `Lobby.tsx` — lista de jugadores con `AnimatePresence` + botón "Iniciar partida" (solo host)
- `PlayerList.tsx` — lista animada con Motion
- `PlayerStatus.tsx` — card con borde izquierdo según estado

**Tarea de verificación:** Abrir la app en dos tabs. Unirse con nicknames distintos. Los dos deben verse mutuamente en el lobby en tiempo real contra el worker desplegado en Cloudflare.

---

### Sprint 3.3 — Selección de fotos
**Estado: PENDIENTE**
**Depende de:** Sprint 3.2 completo

**`features/fotos/`:**
- `PhotoSelector.tsx` — Modo B como hero, Modo A como secundario
- `RandomPickBtn.tsx` — botón full-width con dado que rota (CSS)
- `PhotoGrid.tsx` — grid 3 columnas, miniaturas con botón ✕
- `PhotoProgressBar.tsx` — tira de cine X/10

**Hooks:**
- `usePhotoRandom.ts` — Fisher-Yates, pool para reemplazos
- `usePhotoUpload.ts` — sube a R2 una a una via `VITE_API_URL`, actualiza progreso en `LoadingReveal`

Al confirmar: `sendMessage({ type: 'FOTOS_READY', fotoKeys })`

---

### Sprint 3.4 — Pantalla de juego (lógica, sin animaciones de juego)
**Estado: PENDIENTE**
**Depende de:** Sprint 3.3 completo

**`features/juego/`:**
- `GameRound.tsx` — layout: header + foto en `<PolaroidFrame>` + pregunta + opciones 2x2
- `Timer.tsx` — SVG circular 15s, progresión de color (sin pulse GSAP aún)
- `AnswerOptions.tsx` — 4 botones, `min-height: 54px`, feedback táctil CSS
- `OwnerWaiting.tsx` — "foto es tuya" con `ResponseDots.tsx`
- `ResponseDots.tsx` — puntos de luz que reaccionan a `PLAYER_RESPONSE_COUNT`
- `RoundResult.tsx` — resultado de ronda
- `FinalRanking.tsx` — pantalla final con ranking

**Store Zustand `juegoSlice`:**
```typescript
interface JuegoState {
  faseRonda: 'idle' | 'showing' | 'answered' | 'result'
  fotoActual: { url: string; opciones: string[]; rondaNum: number } | null
  respuestaSeleccionada: string | null
  rankingActual: RankingItem[]
  miPuntuacion: number
  esMiFoto: boolean
  respuestaCount: { count: number; total: number }
}
```

**Tarea de verificación:** Jugar una partida completa de 3 rondas con 2 jugadores reales (dos tabs del browser, contra el worker en producción). Flujo completo sin animaciones de juego.

---

## FASE 4 — ANIMACIONES DE JUEGO
### Objetivo: Implementar todos los GSAP timelines de PRODUCT.md sección 6.
### Duración estimada: 1-2 sesiones de trabajo

> **Instrucción para el chat de esta fase:** El asistente debe leer la sección 6 de PRODUCT.md y la sección 7 de DESIGN.md antes de escribir cualquier animación.

---

### Sprint 4.1 — Animaciones de UI (no de juego) — PENDIENTE
### Sprint 4.2 — Timeline del reveal de foto — PENDIENTE
### Sprint 4.3 — Timer urgente y animaciones de respuesta — PENDIENTE
### Sprint 4.4 — Timeline de resultado de ronda + puntos volando — PENDIENTE
### Sprint 4.5 — Timeline de pantalla final — PENDIENTE

---

## FASE 5 — PULIDO Y DEPLOY
### Sprint 5.1 — Estados de error completos — PENDIENTE
### Sprint 5.2 — `prefers-reduced-motion` y accesibilidad final — PENDIENTE
### Sprint 5.3 — Modo oscuro — PENDIENTE
### Sprint 5.4 — Deploy y configuración Cloudflare — ✅ COMPLETO
- Worker desplegado y funcionando en producción
- Frontend desplegado en Cloudflare Pages
- Bucket R2 creado y operativo
- `VITE_API_URL` configurada en `.env` local y en Cloudflare Pages dashboard
### Sprint 5.5 — Testing con usuarios reales — PENDIENTE

---

## NOTAS PARA EL ASISTENTE DE DESARROLLO

Cuando se abra un chat nuevo con este archivo adjunto, el asistente debe:

1. **Leer el "Estado actual" al inicio de este archivo** para saber exactamente dónde está el proyecto.
2. **No proponer refactors de lo que ya está hecho** salvo que haya un bug concreto que lo requiera.
3. **Completar un sprint entero antes de pasar al siguiente.** Si el sprint tiene una "Tarea de verificación", el código no está hecho hasta que esa tarea pasa.
4. **Nunca instalar dependencias no listadas** en la sección "Stack" de las reglas globales.
5. **Cuando escriba código TypeScript**, todos los tipos deben estar definidos. No `as any` sin comentario explicativo.
6. **Los tokens CSS siempre por variable CSS**, nunca valores hardcoded en componentes.
7. **Si hay ambigüedad** entre DESIGN.md y PRODUCT.md, DESIGN.md tiene precedencia en decisiones visuales, PRODUCT.md en decisiones de lógica y contrato de datos.
8. **VITE_API_URL ya está configurada** — usar siempre `import.meta.env.VITE_API_URL` como base, nunca hardcodear la URL del worker. El WebSocket debe derivar `wss://` de esa variable.

---

*Versión: 1.2 — Actualizado tras completar Fase 2 completa (incluyendo R2 testeado en producción). Próximo: Fase 3 Sprint 3.1.*