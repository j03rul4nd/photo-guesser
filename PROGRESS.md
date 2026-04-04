# PHOTO GUESSER — PROGRESS & ROADMAP
### Estado del proyecto y plan de ejecución por fases

> **Uso de este archivo:** Adjunta este archivo junto con DESIGN.md y PRODUCT.md al inicio de cada chat de desarrollo.

---

## ESTADO ACTUAL DEL PROYECTO

```
Fase:        5 — Pulido y Deploy
Sprint:      5.4 — Deploy final (PENDIENTE — conectar repo a Cloudflare Pages)
Completado:  Fase 1 completa ✅
             Fase 2 completa ✅ (testeada en producción)
             Fase 3 completa ✅ (flujo punta a punta)
             Fase 4 completa ✅ (todas las animaciones GSAP)
             Sprint 5.1 — Estados de error + toast ✅
             Sprint 5.2 — prefers-reduced-motion ✅
             Sprint 5.3 — Modo oscuro ✅
```

**Deploy Worker:** ✅ https://photo-guesser-worker.joelbenitezdonari.workers.dev
**Deploy Frontend:** ✅ Cloudflare Pages (actualizar con nuevo build)
**Variable de entorno:** `VITE_API_URL=https://photo-guesser-worker.joelbenitezdonari.workers.dev`

---

## LO QUE YA ESTÁ HECHO (no tocar, no refactorizar)

### Fase 1 ✅ — Fundación completa
- Monorepo `frontend/` `worker/` `shared/`
- Sistema de diseño completo: tokens CSS, Tailwind 4, Geist fonts, grain texture
- Componentes UI: Button, Card, Badge, Progress, Dialog (todos overrideados con tokens)
- Shared: PolaroidFrame, LoadingReveal, RotatePrompt, DarkModeToggle
- Routing: todas las rutas configuradas incluyendo 404 → NotFoundPage

### Fase 2 ✅ — Backend completo y testeado en producción
- Hono 4 router: POST /api/sala, POST /api/sala/:code/join, POST /api/sala/:code/foto, GET /api/sala/:code/ws, DELETE /api/sala/:code
- Durable Object: state machine 6 estados, WebSocket manager, lógica de rondas, puntuación
- R2: presigned URLs, borrado por prefijo, DO Alarm 30 min

### Fase 3 ✅ — Flujo completo punta a punta
**lib/:** `api.ts` (VITE_API_URL + getWsUrl), `privacy.ts`, `share.ts`, `animations.ts`
**features/sala/:** PrivacyNotice, ShareRoom (GSAP reveal código + QR elastic), RoomQR
**features/fotos/:** PhotoSelector, RandomPickBtn, PhotoGrid, PhotoProgressBar, usePhotoRandom, usePhotoUpload, fotosSlice
**features/lobby/:** PlayerList (AnimatePresence), PlayerStatus (Motion layout), lobbySlice
**features/juego/:** useGameSocket (reconexión exponencial + Zod validation), juegoSlice
**pages/:** HomePage, SalaPage, JoinPage, LobbyPage, GamePage, NotFoundPage

### Fase 4 ✅ — Animaciones GSAP completas
- `src/lib/animations.ts` — todos los timelines centralizados con prefers-reduced-motion
- `animateHomeEntrance` — logo back.out + botones stagger wired en HomePage
- `animateShareRoom` — flip reveal código + stagger chars + QR elastic.out wired en ShareRoom
- `shakeElement` — GSAP shake wired en JoinPage y SalaPage
- `animatePhotoReveal` — overlay → foto expo.out → pregunta elastic → opciones stagger wired en GameRound
- `Timer` — SVG GSAP power1.in → expo.in, bump número/segundo, pulse urgente últimos 3s
- `ResponseDots` — elastic pop al activarse cada punto
- `animateRoundResult` — wrongOptions fade + correctOption scale + ownerLabel + scoreFloats wired en RoundResult
- `burstConfetti` — dynamic import canvas-confetti, burst pequeño al acertar, burst grande en FinalRanking
- `animateFinalScreen` — title expo.out + cards stagger + winner scale + pulse botón wired en FinalRanking

### Fase 5 (parcial) ✅
- `Toast` — sistema completo con Zustand store, Motion slide desde abajo, auto-dismiss 5s, variantes error/success/info
- `ToastContainer` — montado en main.tsx, activo en toda la app
- Toasts wired en `usePhotoUpload` (error de subida con acción "Reintentar")
- `NotFoundPage` — Polaroid en blanco, microcopy correcto, dos CTAs
- `prefers-reduced-motion` — `applyReducedMotion()` en main.tsx → `gsap.globalTimeline.timeScale(0)`
- Dark mode — `DarkModeToggle` componente, persiste en localStorage, clase `.dark` en `<html>`, tokens `.dark` en index.css
- `DarkModeToggle` montado en header de LobbyPage

---

## REGLAS GLOBALES (leer antes de escribir código)

- Stack fijo — ver PROGRESS.md versión anterior para lista completa
- `VITE_API_URL=https://photo-guesser-worker.joelbenitezdonari.workers.dev` — usar siempre `import.meta.env.VITE_API_URL`
- WebSocket: `wss://` derivado automáticamente de VITE_API_URL en `getWsUrl()`
- TypeScript `strict: true` — cero `any` sin comentario
- Tokens CSS siempre `var(--token)` — nunca hardcoded
- `src/shared/schemas.ts` — copia de `shared/schemas.ts` sincronizada manualmente (zod resuelve desde frontend/node_modules)
- Zod v4: `z.record()` requiere DOS argumentos: `z.record(z.string(), z.number())`
- Animaciones: CSS ≤80ms táctil, GSAP narrativas, Motion layout React

---

## FASE 5 — PULIDO Y DEPLOY (pendiente)

### Sprint 5.4 — Deploy y configuración Cloudflare
**Estado: PENDIENTE**

Pasos para el deploy final:

```bash
# 1. Subir los cambios al repo GitHub
git add -A && git commit -m "feat: Fases 3-5 completas"
git push

# 2. En Cloudflare Pages — rebuild automático si el repo está conectado
# Si no está conectado aún:
# Dashboard → Pages → Create project → Connect to Git → photo-guesser
# Build command: npm run build
# Build output: dist
# Root directory: frontend

# 3. Variables de entorno en Cloudflare Pages:
# VITE_API_URL = https://photo-guesser-worker.joelbenitezdonari.workers.dev
```

### Sprint 5.5 — Testing con usuarios reales
**Estado: PENDIENTE**

Checklist mínimo:
- [ ] El no-gamer puede unirse y subir fotos sin preguntar nada
- [ ] El código se puede compartir por WhatsApp y funciona al abrirlo
- [ ] El timer se siente urgente en los últimos 3 segundos
- [ ] El reveal de la foto genera reacción visible
- [ ] La partida completa dura entre 5 y 12 minutos con 10 rondas
- [ ] Las fotos se borran al terminar (verificar panel R2)
- [ ] Dark mode funciona en todos los dispositivos
- [ ] `prefers-reduced-motion` desactiva las animaciones decorativas

---

## NOTAS PARA EL ASISTENTE

1. Leer "Estado actual" primero
2. No proponer refactors de lo que ya funciona
3. Completar un sprint entero antes de pasar al siguiente
4. Nunca instalar dependencias nuevas sin listarlo aquí
5. `src/shared/schemas.ts` y `shared/schemas.ts` deben mantenerse sincronizados manualmente
6. El chunk size warning en el build es esperado — GSAP + Motion + React. Ignorar hasta Sprint 5.4 si no afecta al LCP.

---

*Versión: 1.3 — Fases 3, 4 y 5 (parcial) completadas. Build limpio. Próximo: deploy final + testing real.*