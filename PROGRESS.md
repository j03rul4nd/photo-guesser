# PHOTO GUESSER — PROGRESS & ROADMAP
### Estado del proyecto y plan de ejecución por fases

> **Uso de este archivo:** Adjunta este archivo junto con DESIGN.md y PRODUCT.md al inicio de CADA chat de desarrollo. El asistente lo lee primero para saber exactamente en qué punto está el proyecto, qué hay hecho, qué viene a continuación y qué restricciones nunca se rompen.

---

## ESTADO ACTUAL DEL PROYECTO

```
Fase:        5 — Pulido y Deploy
Sprint:      5.5 — Testing con usuarios reales (PENDIENTE)
Completado:  Fase 1 ✅  Fundación completa
             Fase 2 ✅  Backend completo y testeado en producción
             Fase 3 ✅  Flujo punta a punta funcionando
             Fase 4 ✅  Todas las animaciones GSAP implementadas
             Sprint 5.1 ✅  Estados de error + sistema Toast
             Sprint 5.2 ✅  prefers-reduced-motion
             Sprint 5.3 ✅  Modo oscuro
             Sprint 5.4 ✅  Deploy Cloudflare Pages funcionando
```

**Repo GitHub:** https://github.com/j03rul4nd/photo-guesser
**Deploy Worker:** ✅ https://photo-guesser-worker.joelbenitezdonari.workers.dev
**Deploy Frontend:** ✅ Cloudflare Pages — build funcionando
**Variable de entorno:** `VITE_API_URL=https://photo-guesser-worker.joelbenitezdonari.workers.dev`

---

## REGLAS GLOBALES — LEER ANTES DE ESCRIBIR UNA SOLA LÍNEA

Estas reglas aplican en todos los chats. El asistente las respeta sin excepción.

### Stack — solo esto, nada más
- **Frontend:** Vite 8 + React 19 + TypeScript 5 + React Router v7 + Zustand 5 + TanStack Query 5 + Zod 4 + Tailwind CSS 4 + shadcn/ui (overrideado) + GSAP 3 + Motion (Framer Motion) + canvas-confetti
- **Backend:** Cloudflare Workers + Hono 4 + Durable Objects + R2 + Zod 4
- **Prohibido:** Next.js, Vercel, Socket.io, Firebase, Supabase, Redux, GraphQL, Axios, Styled Components, Three.js, Anime.js

### TypeScript
- `strict: true` siempre. Cero `any` sin comentario `// TODO: type this`
- Zod v4: `z.record()` requiere dos argumentos → `z.record(z.string(), z.number())`

### Estructura de carpetas — no cambiar
```
photo-guesser/
├── frontend/src/
│   ├── features/         ← lógica por dominio (sala, fotos, lobby, juego)
│   ├── pages/            ← una página por ruta
│   ├── components/
│   │   ├── ui/           ← shadcn overrideados (Button, Card, Badge, Progress, Dialog, Toast)
│   │   └── shared/       ← componentes identitarios (PolaroidFrame, LoadingReveal, RotatePrompt, DarkModeToggle)
│   ├── lib/              ← api.ts, animations.ts, privacy.ts, share.ts, utils.ts
│   ├── shared/           ← copia de shared/schemas.ts (ver nota crítica abajo)
│   └── store/
├── worker/src/           ← Hono router, GameRoom DO, schemas, utils
└── shared/               ← schemas Zod originales (fuente de verdad del worker)
```

### Nota crítica sobre schemas
`frontend/src/shared/schemas.ts` es una **copia** de `shared/schemas.ts`. Zod resuelve desde `frontend/node_modules/zod`. Si se modifica `shared/schemas.ts` hay que copiar el archivo a `frontend/src/shared/schemas.ts`. El alias `@shared/*` apunta a `./src/shared/*` en vite.config.ts y tsconfig.app.json.

### Variables de entorno
- `VITE_API_URL` — siempre `import.meta.env.VITE_API_URL`, nunca hardcodeado
- WebSocket: derivar `wss://` de VITE_API_URL reemplazando `https` → `wss` (ya en `lib/api.ts → getWsUrl()`)

### CSS — tokens siempre
- Nunca `color: #FF4D2E`. Siempre `color: var(--accent)`
- Todos los tokens están en `frontend/src/index.css` (`:root` y `.dark`)

### Animaciones — separación estricta
- **CSS transition ≤80ms** → feedback táctil (botones, selección de opción)
- **GSAP timelines** → secuencias narrativas de juego (reveal foto, resultado ronda, fin partida)
- **Motion (Framer)** → layout de React que cambia (AnimatePresence, layout prop)
- **canvas-confetti** → celebraciones puntuales (dynamic import, ya en `lib/animations.ts`)
- Nunca mezclar: GSAP no toca props que gestiona Motion, y viceversa

### Accesibilidad
- Botones con solo icono → `aria-label` obligatorio
- Touch targets → `min-height: 44px` en interactivos, `min-height: 54px` en opciones de respuesta
- Focus rings → `outline: 2px solid var(--accent); outline-offset: 2px` (ya en CSS global)
- Timer → `role="timer"` y `aria-live="polite"` (ya implementado)

---

## LO QUE YA ESTÁ HECHO — MAPA COMPLETO

### Fase 1 ✅ — Fundación

**Config:**
- `frontend/vite.config.ts` — Tailwind CSS 4 plugin, alias `@/` → `src/`, `@shared/` → `src/shared/`
- `frontend/tsconfig.app.json` — `strict: true`, path aliases sincronizados con vite
- `frontend/index.html` — Google Fonts (Syne 700/800 + Instrument Serif), viewport mobile
- `frontend/public/fonts/` — Geist Variable y GeistMono Variable (woff2)

**Design system (`frontend/src/index.css`):**
- `:root` con todos los tokens: `--bg-primary #F7F3EE`, `--accent #FF4D2E`, `--correct #1A7A4A`, `--incorrect #C0392B`, `--pending #B8860B`, `--timer-urgent #D92B0A`, radii, sombras, fuentes, spacing, transiciones
- `.dark` con todos los overrides del modo noche
- Grain texture `body::after` (opacity 0.03 claro / 0.06 oscuro)
- Focus ring global `*:focus-visible`
- `@theme` de Tailwind 4 con los tokens mapeados
- `@font-face` para Geist y GeistMono desde `public/fonts/`
- Media query landscape mobile → `.game-layout { display: none }` / `.rotate-prompt { display: flex }`

**Componentes UI (todos overrideados con tokens, NO parecen shadcn):**
- `components/ui/button.tsx` — variantes default/secondary/outline/ghost/destructive, `active:scale(0.97)` en 80ms CSS
- `components/ui/card.tsx` — CardHeader, CardTitle, CardContent, CardFooter
- `components/ui/badge.tsx` — variantes correct/incorrect/pending/secondary
- `components/ui/progress.tsx` — barra con `var(--accent)`
- `components/ui/dialog.tsx` — Radix Dialog overrideado
- `components/ui/toast.tsx` — sistema Toast completo: Zustand store, Motion slide desde abajo, auto-dismiss 5s, variantes error/success/info/action, helper `toast.error()` / `toast.success()` / `toast.info()`

**Componentes shared:**
- `components/shared/PolaroidFrame.tsx` — padding 12px/12px/12px/32px (borde Polaroid inferior), `var(--shadow-photo)`, `border-radius: 2px`, prop `caption?`, `style?`, `className?`
- `components/shared/LoadingReveal.tsx` — barra GSAP que desacelera al 80% y espera; acepta `message`, `progress?` (0-100), `style?`, `className?`
- `components/shared/RotatePrompt.tsx` — visible solo en landscape mobile via CSS, icono teléfono rotando CSS
- `components/shared/DarkModeToggle.tsx` — toggle 🌙/☀️, persiste `pg_dark_mode` en localStorage, aplica clase `.dark` a `<html>`

**Routing (`frontend/src/main.tsx`):**
- `/` → HomePage
- `/unirse` → JoinPage (Escenario B)
- `/sala/:code` → SalaPage (Escenario A)
- `/sala/:code/lobby` → LobbyPage
- `/sala/:code/juego` → GamePage
- `/design-system` → DesignSystemPage (temporal, eliminar en producción)
- `*` → NotFoundPage
- `<ToastContainer />` y `<RotatePrompt />` montados en el root
- `applyReducedMotion()` y dark mode init ejecutados al arrancar

**Schemas (`frontend/src/shared/schemas.ts`):**
- `ServerWSEventSchema` — discriminatedUnion con todos los eventos: LOBBY_UPDATE, GAME_START, ROUND_START, PLAYER_RESPONSE_COUNT, ROUND_RESULT, GAME_END, GAME_RESET, PLAYER_DISCONNECTED, PLAYER_RECONNECTED, HOST_CHANGED, ERROR
- `ClientWSEventSchema` — JOIN, FOTOS_READY, START_GAME, ANSWER, PLAY_AGAIN
- HTTP schemas: CreateSalaResponse, JoinSalaResponse, FotoUploadRequest/Response
- `ERROR_CODES` y `ERROR_MESSAGES` con los 6 códigos estandarizados

---

### Fase 2 ✅ — Backend completo

**Worker (`worker/src/`):**
- `index.ts` — Hono 4 router con CORS, rate limiting 10 salas/IP/hora (Map en memoria):
  - `POST /api/sala` → genera código, inicializa DO, devuelve `{ codigo, joinUrl }`
  - `POST /api/sala/:code/join` → valida Zod, normaliza código a uppercase, delega al DO
  - `POST /api/sala/:code/foto` → valida mimeType + sizeBytes (máx 5MB), verifica auth con DO, genera key R2, devuelve presigned URL
  - `GET /api/sala/:code/ws` → verifica Upgrade header, redirige al DO
  - `DELETE /api/sala/:code` → cierra DO, borra fotos R2 por prefijo `fotos/{code}/`
  - `GET /health` → `{ status: ok }`
- `GameRoom.ts` — Durable Object completo:
  - State machine: `waiting → lobby_ready → round_showing → round_results → game_over → resetting`
  - HTTP internal routes: `/init`, `/join`, `/auth`, `/close`
  - WebSocket: `Map<string, WebSocket>`, broadcast a todos, sendTo a uno
  - Eventos cliente→servidor: JOIN, FOTOS_READY, START_GAME, ANSWER, PLAY_AGAIN
  - Lógica de rondas: Fisher-Yates shuffle del pool, opciones 1+3 distractores shuffleados, puntuación por velocidad (<5s=100, 5-10s=75, 10-15s=50)
  - `PLAYER_RESPONSE_COUNT` emitido SOLO al propietario de la foto actual
  - Gestión de desconexiones: jugador marcado ❌, host pasa al siguiente conectado
  - DO Alarm: cleanup a los 30 minutos de inactividad
- `schemas.ts` — Zod schemas locales del worker (no depende de shared/)
- `utils.ts` — generateSalaCode (7 chars sin 0/O/1/I), generateJugadorId (UUID), jsonError, normalizeSalaCode
- `types.ts` — Env interface con GAME_ROOM y PHOTOS_BUCKET
- `wrangler.toml` — DO binding GAME_ROOM, R2 binding PHOTOS_BUCKET

---

### Fase 3 ✅ — Flujo completo punta a punta

**`frontend/src/lib/`:**
- `api.ts` — `API_BASE` desde `import.meta.env.VITE_API_URL`, `getWsUrl(salaCode, jugadorId)` → `wss://`, métodos: `crearSala()`, `unirse()`, `obtenerUrlFoto()`, `subirFotoAR2()`, `cerrarSala()`
- `privacy.ts` — `privacy.hasSeen()` y `privacy.markSeen()` con try/catch (localStorage puede no estar disponible)
- `share.ts` — `getSalaUrl()`, `copyToClipboard()` con fallback `execCommand`, `shareWhatsApp()`, `canUseWebShare()`, `webShare()`
- `animations.ts` — todos los GSAP timelines (ver Fase 4)

**`features/sala/components/`:**
- `PrivacyNotice.tsx` — aparece solo si `!privacy.hasSeen()`, lo marca visto al montarse, acepta `style?` y `className?`
- `RoomQR.tsx` — `<img>` de `api.qrserver.com` dentro de `<PolaroidFrame>`, acepta `codigo`
- `ShareRoom.tsx` — código grande Geist Mono con GSAP flip reveal, QR elastic.out, botones WhatsApp + copiar + Web Share API (degradación silenciosa), `<PrivacyNotice>`, botón "Entrar al lobby"

**`features/sala/store/`:** `salaSlice.ts`
**`features/sala/hooks/`:** `useSala.ts`

**`features/fotos/`:**
- `hooks/usePhotoRandom.ts` — `pickRandom(files, count)` Fisher-Yates, `getReplacementFor(usedNames)` para reemplazos sin repetir
- `hooks/usePhotoUpload.ts` — PUT directo a R2 presigned URL, reintentos ×2 con backoff 500ms, `toast.error()` con acción "Reintentar", actualiza `fotosSlice` con progreso real
- `store/fotosSlice.ts` — Zustand: `fotos[]`, `uploadEstado`, `uploadProgreso`, `uploadError`
- `components/RandomPickBtn.tsx` — botón hero full-width, dado que rota 360° CSS al activarse, abre `<input type=file multiple accept=image/*>`
- `components/PhotoGrid.tsx` — grid 3 columnas, miniaturas con botón ✕ (touch 44px), AnimatePresence Motion, botón "Reemplazar" en huecos (modo B)
- `components/PhotoProgressBar.tsx` — tira de cine: N cuadros que se van llenando, label "X / 10 fotos listas"
- `components/PhotoSelector.tsx` — Modo B hero + separador + Modo A secundario, `<LoadingReveal>` durante upload con `progress` real, al confirmar emite `FOTOS_READY { fotoKeys }` via WS

**`features/lobby/`:**
- `store/lobbySlice.ts` — Zustand: jugadores, hostId, salaCode, jugadorId, nickname
- `components/PlayerStatus.tsx` — card con borde izquierdo 3px animado con Motion `animate={{ color }}`, badge "Host", label estado ✅/⏳/❌
- `components/PlayerList.tsx` — `AnimatePresence` + `motion.div` slide desde derecha con spring stiffness 400

**`features/juego/`:**
- `hooks/useGameSocket.ts` — gestiona WS lifecycle, reconexión exponencial (1s/2s/4s/8s/10s máx), valida mensajes con `ServerWSEventSchema.safeParse()` y descarta silenciosamente los inválidos, `sendMessage` valida con `ClientWSEventSchema` antes de enviar
- `store/juegoSlice.ts` — Zustand: faseRonda (idle/showing/answered/result), fotoActual, respuestaSeleccionada, rankingActual, miPuntuacion, esMiFoto, respuestaCount, propietarioNickname, respuestasCorrectas, puntosGanados, gameOver, rankingFinal

**`pages/`:**
- `HomePage.tsx` — logo PHOTO GUESSER (GUESSER en accent), tagline Instrument Serif italic, 4 siluetas Polaroid decorativas en fondo opacity 0.08, botones "Crear partida" (→ POST /api/sala → /sala/:code?creator=1) y "Unirse a partida" (→ /unirse), GSAP al montar
- `SalaPage.tsx` — Escenario A: extrae `:code` de URL, muestra ShareRoom si `?creator=1`, luego campo nickname + código readonly, PrivacyNotice, POST join → /lobby
- `JoinPage.tsx` — Escenario B: campo código (auto-uppercase) + campo nickname, shake GSAP en error, PrivacyNotice, POST join → /lobby
- `LobbyPage.tsx` — header con código + botón copiar + DarkModeToggle, banner reconexión Motion, PlayerList en tiempo real, botón "Elegir mis fotos" → abre PhotoSelector inline, botón "Iniciar partida" (solo host, solo si ≥2 listos), identidad: `jugadorId/nickname` desde `sessionStorage`
- `GamePage.tsx` — orquesta todo: escucha `lastEvent` de useGameSocket y actualiza juegoSlice, detecta `esMiFoto` comparando opciones con nickname propio, redirige en GAME_RESET
- `NotFoundPage.tsx` — Polaroid en blanco con 📷 gris, título "Esta sala ya cerró", dos CTAs: "Crear sala nueva" y "Probar otro código"

**`features/juego/components/`:**
- `GameRound.tsx` — header sticky (ronda/total + Timer), overlay de reveal (div fixed opacity 0), foto en PolaroidFrame, pregunta, AnswerOptions; activa `animatePhotoReveal` cuando cambia `rondaActual` y `faseRonda === showing`
- `Timer.tsx` — SVG circular r=20 CIRCUMFERENCE=125.66, GSAP strokeDashoffset power1.in→expo.in, bump número cada segundo, pulse urgente últimos 3s con `animateTimerUrgentPulse`, progresión de color neutro→accent→timer-urgent
- `AnswerOptions.tsx` — grid 2×2, `min-height: 54px`, estados normal/selected/correct/incorrect/faded con CSS transition 150ms, feedback táctil CSS scale(0.96) 80ms en `onMouseDown`
- `OwnerWaiting.tsx` — "✨ Esta foto es tuya" + "¿Cuántos te conocen?" + `<ResponseDots>`
- `ResponseDots.tsx` — N puntos (uno por jugador), CSS transition 200ms a accent cuando `i < count`, pulse CSS en los pendientes, GSAP elastic pop en el nuevo punto activado
- `RoundResult.tsx` — label propietario, lista de quién acertó con puntos, mini ranking con Motion layout reordenamiento; activa `animateRoundResult` al montar y `burstConfetti({ large: false })` si el jugador acertó
- `FinalRanking.tsx` — título FIN DE LA PARTIDA, cards con barra proporcional, ganador con glow dorado, `animateFinalScreen` + `burstConfetti({ large: true })` al montar, botón "Jugar otra vez" con confirmación implícita 1.5s + GSAP pulse cada 3s

---

### Fase 4 ✅ — Animaciones GSAP

**`frontend/src/lib/animations.ts`** — todos los timelines centralizados:

| Función | Qué hace | Dónde se usa |
|---|---|---|
| `applyReducedMotion()` | `gsap.globalTimeline.timeScale(0)` si `prefers-reduced-motion` | main.tsx al arrancar |
| `animateHomeEntrance(logo, tagline, buttons, polaroids)` | logo back.out + tagline fade + botones stagger back.out | HomePage useEffect |
| `animateShareRoom(codeBg, chars, qrFrame, buttons)` | scaleX reveal → stagger chars → elastic QR → fade buttons | ShareRoom useEffect |
| `shakeElement(el)` | keyframes x: [-6,6,-4,4,-2,2,0] | JoinPage, SalaPage en error |
| `animateLobbyToGame(screen, onComplete)` | zoom-out + fade | (disponible, no wired aún) |
| `animatePhotoReveal(overlay, photo, question, options)` | overlay → foto expo.out → pregunta elastic → opciones stagger back.out | GameRound useEffect por rondaNum |
| `animateTimerUrgentPulse(el)` | scale yoyo repeat:-1 | Timer últimos 3s |
| `animateTimerNumberBump(el)` | fromTo scale 1.3→1 back.out | Timer cada segundo |
| `animateResponseDot(dot)` | from scale 0.5 elastic | ResponseDots al activarse |
| `animateRoundResult(wrong, correct, owner, scores)` | fade wrong → scale correct → slide owner → elastic scores | RoundResult useEffect |
| `animateFinalScreen(title, cards, winner)` | title expo.out → cards stagger → winner scale | FinalRanking useEffect |
| `burstConfetti({ large? })` | dynamic import canvas-confetti, burst pequeño o grande | RoundResult, FinalRanking |

---

### Fase 5 ✅ (parcial)

**Sprint 5.1 ✅ — Estados de error:**
- `components/ui/toast.tsx` — store Zustand + Motion slide + `toast.error/success/info()` helpers
- `ToastContainer` en main.tsx (visible en toda la app)
- Toast de error wired en `usePhotoUpload` con acción "Reintentar"
- `NotFoundPage` con Polaroid en blanco y microcopy correcto

**Sprint 5.2 ✅ — prefers-reduced-motion:**
- `applyReducedMotion()` en main.tsx → `gsap.globalTimeline.timeScale(0)`
- Guards `if (reducedMotion) return` en cada función de `animations.ts`
- Animaciones funcionales (timer color, opciones feedback) simplificadas pero presentes

**Sprint 5.3 ✅ — Modo oscuro:**
- `DarkModeToggle` — toggle emoji, persiste `pg_dark_mode` en localStorage
- Init en main.tsx: lee localStorage y añade clase `.dark` a `<html>` antes del render
- Tokens `.dark` completos en `index.css`
- DarkModeToggle en header de LobbyPage

**Sprint 5.4 ✅ — Deploy:**
- Worker desplegado en Cloudflare Workers
- Frontend desplegado en Cloudflare Pages
- R2 bucket `photo-guesser-photos` creado y operativo
- `VITE_API_URL` configurada en `.env.local` y en Cloudflare Pages dashboard
- Fix crítico: `@shared` alias apunta a `./src/shared/` (no `../shared/`) en vite.config.ts y tsconfig.app.json

---

## FASE 5 — LO QUE QUEDA

### Sprint 5.5 — Testing con usuarios reales y bug fixing
**Estado: PENDIENTE — este es el próximo sprint**

El producto está desplegado y funcionando. El objetivo ahora es jugar partidas reales con personas reales en dispositivos reales y resolver los problemas que aparezcan.

**Cómo hacer el testing:**
1. Enviar el link de Cloudflare Pages a un grupo de WhatsApp con al menos 3 personas
2. Observar sin intervenir — los problemas que aparezcan en los primeros 30 segundos son bugs de UX
3. Documentar exactamente qué falla, en qué dispositivo y en qué momento del flujo

**Checklist de verificación antes de dar el sprint por completo:**
- [ ] El creador de sala ve ShareRoom con el código y el QR correctamente
- [ ] Un invitado puede entrar vía link directo `/sala/:code` sin problemas
- [ ] Un invitado puede entrar vía formulario `/unirse` con código manual
- [ ] El aviso de privacidad aparece solo la primera vez (localStorage flag)
- [ ] El selector de fotos funciona en iOS Safari (input[type=file] con múltiples archivos)
- [ ] El selector de fotos funciona en Android Chrome
- [ ] El upload de fotos a R2 funciona sin errores (verificar en panel R2 de Cloudflare)
- [ ] El lobby muestra jugadores en tiempo real cuando alguien se une
- [ ] El host puede iniciar la partida cuando ≥2 jugadores tienen fotos listas
- [ ] El reveal de la foto se ve fluido en móvil (testear en iPhone SE mínimo)
- [ ] El timer baja con urgencia visual en los últimos 3 segundos
- [ ] El propietario de la foto ve los puntos de luz actualizarse en tiempo real
- [ ] El resultado de ronda muestra correctamente quién acertó y los puntos
- [ ] El confetti aparece al acertar y al final de la partida
- [ ] La pantalla final muestra el ranking correcto con el ganador destacado
- [ ] "Jugar otra vez" funciona y vuelve al lobby limpio
- [ ] Las fotos se borran de R2 al terminar la partida (verificar en panel)
- [ ] Dark mode funciona correctamente en móvil
- [ ] El aviso de rotar el teléfono aparece en landscape mobile
- [ ] La reconexión WebSocket funciona (matar la pestaña y volver)

**Bugs conocidos que revisar:**
- La detección de `esMiFoto` en `GamePage.tsx` usa una heurística (comparar opciones con el nickname). Si hay falsos positivos, el DO debería enviar explícitamente `esMiFoto: boolean` en `ROUND_START`. Revisar en partidas reales.
- El `totalRondas` en `GamePage.tsx` se estima como `jugadores.length * 10`. El DO debería enviarlo en `GAME_START` y se debería guardar en `juegoSlice`. Verificar que el header de ronda muestra el total correcto.
- El `jugadorId` y `nickname` se guardan en `sessionStorage` — si el usuario cierra la pestaña y vuelve, los pierde. Verificar comportamiento de reconexión.

---

### Sprint 5.6 — Pulido visual post-testing (si necesario)
**Estado: BLOQUEADO — espera resultados de Sprint 5.5**

Ajustes que podrían salir del testing real:

**UX probables:**
- Mensaje de "esperando que el host inicie" más claro en el lobby
- Estado de transición entre rondas (3s de pausa) — mostrar algo en lugar de pantalla en blanco
- Feedback cuando se envía la respuesta pero el timer sigue corriendo (el jugador ya no puede cambiar)
- Número de rondas restantes visible durante el juego

**Rendimiento en móvil:**
- Si las animaciones GSAP van lentas en móviles gama baja, reducir duración de `animatePhotoReveal` de 900ms a 600ms
- Si el bundle de 650KB causa LCP lento, añadir code splitting manual en vite.config.ts para GSAP y Motion

**Accesibilidad pendiente:**
- `aria-live="polite"` en el mini ranking cuando cambia
- Verificar orden de tabulación en GameRound en desktop
- Confirmar que VoiceOver/TalkBack puede jugar una ronda completa

**Mejoras "Should Have" del MoSCoW si hay tiempo:**
- Modo C de selección de fotos por categorías (`CategoryPicker.tsx`)
- Indicador de rondas restantes en el header del juego
- Animación de transición lobby → juego (`animateLobbyToGame` ya está en animations.ts, solo falta wired)

---

### Sprint 5.7 — Bugs del worker (si necesario)
**Estado: BLOQUEADO — espera resultados de Sprint 5.5**

Mejoras al Durable Object que pueden ser necesarias tras testing real:

**Cambio recomendado 1 — `esMiFoto` en ROUND_START:**
```typescript
// Añadir al evento ROUND_START del DO:
{ type: 'ROUND_START', rondaNum, fotoUrl, opciones, timerMs, esMiFoto: boolean }
// El DO sabe quién es el propietario, puede enviar este flag directamente
// Eliminar la heurística actual en GamePage.tsx
```

**Cambio recomendado 2 — `totalRondas` persistido en juegoSlice:**
```typescript
// GAME_START ya envía totalRondas
// Guardarlo en juegoSlice en lugar de estimarlo
// juegoSlice.setGameStart(totalRondas) al recibir GAME_START
```

**Cambio recomendado 3 — Tiempo de pausa entre rondas configurable:**
```typescript
// El DO espera 3s entre rondas con setTimeout
// Considerar emitir un evento ROUND_WAITING { secsLeft: 3 } para que el frontend muestre countdown
```

---

## NOTAS PARA EL ASISTENTE DE DESARROLLO

Cuando se abra un chat nuevo con este archivo adjunto:

1. **Leer el bloque "ESTADO ACTUAL" primero** — dice exactamente en qué sprint estás
2. **No refactorizar lo que ya funciona** — si no hay un bug concreto, no tocar
3. **Completar un sprint entero antes de pasar al siguiente** — la tarea de verificación es el criterio
4. **Nunca instalar dependencias nuevas** sin que estén en el stack de las Reglas Globales
5. **TypeScript strict siempre** — build limpio (`tsc -b && vite build`) antes de dar un sprint por completo
6. **Tokens CSS siempre** — `var(--accent)` nunca `#FF4D2E`
7. **GSAP solo para narrativas** — no para feedback táctil (eso es CSS)
8. **Si hay ambigüedad** entre DESIGN.md y PRODUCT.md: DESIGN.md manda en visual, PRODUCT.md en lógica y datos
9. **`src/shared/schemas.ts`** debe estar sincronizado con `shared/schemas.ts` si se modifica alguno

---

*Versión: 1.4 — Fases 1-5 completadas (Sprint 5.5 pendiente). Deploy funcionando en producción. Próximo: testing real con usuarios.*