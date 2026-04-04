# PHOTO GUESSER — PROGRESS & ROADMAP
### Estado del proyecto y plan de ejecución por fases

> **Uso de este archivo:** Adjunta este archivo junto con DESIGN.md y PRODUCT.md al inicio de cada chat de desarrollo. El asistente leerá primero PROGRESS.md para saber exactamente en qué fase estás, qué ya funciona, qué viene a continuación y qué restricciones hay que respetar. Actualiza la sección "Estado actual" y marca las tareas completadas antes de abrir cada chat nuevo.

---

## ESTADO ACTUAL DEL PROYECTO

```
Fase:        1 — Fundación
Sprint:      1.0 — Setup inicial
Completado:  GitHub repo creado ✅
             npm create vite@latest photo-guesser -- --template react-ts ✅
             cd photo-guesser ✅
Pendiente:   Todo lo demás (ver Fase 1 completa abajo)
```

**Repo GitHub:** [poner URL aquí]
**Deploy Cloudflare Pages:** no configurado aún
**Deploy Worker:** no configurado aún

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
Esta es la estructura final desde el día 1. No crear `src/` en la raíz.

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

## FASE 1 — FUNDACIÓN
### Objetivo: Proyecto corriendo localmente con la identidad visual lista antes de tocar lógica de juego.
### Duración estimada: 1-2 sesiones de trabajo

---

### Sprint 1.1 — Estructura de monorepo y dependencias
**Estado: PENDIENTE**

Comandos a ejecutar en orden exacto:

```bash
# Desde la raíz del proyecto (photo-guesser/)
# 1. Crear estructura de carpetas
mkdir -p frontend worker shared

# 2. Mover el proyecto Vite a /frontend
# (mover todos los archivos generados por create vite a /frontend/)

# 3. Instalar dependencias frontend
cd frontend
npm install react-router-dom@latest
npm install @tanstack/react-query@latest
npm install zustand@latest
npm install zod@latest
npm install gsap@latest
npm install framer-motion@latest
npm install canvas-confetti@latest
npm install clsx tailwind-merge
npm install geist
npm install -D @types/canvas-confetti

# 4. Instalar shadcn/ui (interactivo — elegir: style=default, base color=neutral, CSS variables=yes)
npx shadcn@latest init
# Componentes a instalar ahora:
npx shadcn@latest add button card dialog progress badge toast

# 5. Setup Worker
cd ../worker
npm init -y
npm install hono@latest zod@latest
npm install -D wrangler@latest typescript @cloudflare/workers-types

# 6. Crear tsconfig en worker/
# (ver contenido en la tarea de worker más abajo)

# 7. Crear wrangler.toml en worker/
# (ver contenido en la tarea de worker más abajo)
```

**Archivos a crear en este sprint:**

`shared/schemas.ts` — Zod schemas vacíos con la estructura completa (aunque sin implementación). Esto primero para que el resto importe desde aquí desde el día 1.

`shared/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "outDir": "./dist"
  }
}
```

`worker/wrangler.toml`:
```toml
name = "photo-guesser-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[[durable_objects.bindings]]
name = "GAME_ROOM"
class_name = "GameRoom"

[[migrations]]
tag = "v1"
new_classes = ["GameRoom"]

[[r2_buckets]]
binding = "PHOTOS_BUCKET"
bucket_name = "photo-guesser-photos"
```

**Tarea de verificación:** `cd frontend && npm run dev` debe arrancar en localhost sin errores.

---

### Sprint 1.2 — Sistema de diseño y tokens CSS
**Estado: PENDIENTE**
**Depende de:** Sprint 1.1 completo

Implementar todo el sistema visual de DESIGN.md antes de construir ningún componente. Esto garantiza que todos los componentes posteriores usen tokens desde el principio.

**Archivos a crear/modificar:**

`frontend/src/index.css` — debe contener el bloque completo de `:root { }` y `.dark { }` de DESIGN.md sección 10, más:
```css
/* Grain texture sobre el body */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
}
.dark body::after { opacity: 0.06; }

/* Reset focus ring global */
*:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Orientación landscape en mobile */
@media (orientation: landscape) and (max-width: 767px) {
  .game-layout { display: none; }
  .rotate-prompt { display: flex; }
}
```

`frontend/index.html` — añadir Google Fonts en el `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
```

`frontend/src/main.tsx` — importar Geist después del reset:
```tsx
import 'geist/dist/fonts/geist-sans/style.css'
import 'geist/dist/fonts/geist-mono/style.css'
import './index.css'
```

`frontend/tailwind.config.ts` — extender con los tokens:
```ts
// Mapear las CSS variables a clases de Tailwind para poder usar
// bg-primary, text-accent, etc. en los componentes
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-surface': 'var(--bg-surface)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'accent': 'var(--accent)',
        'correct': 'var(--correct)',
        'incorrect': 'var(--incorrect)',
        'pending': 'var(--pending)',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        ui: ['Geist', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
        body: ['Instrument Serif', 'serif'],
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'photo': 'var(--shadow-photo)',
      },
      borderRadius: {
        'photo': 'var(--radius-photo)',
      }
    }
  }
}
```

**Componentes compartidos a crear en este sprint:**

`frontend/src/components/shared/PolaroidFrame.tsx` — el componente más identitario del producto. Acepta `children` (la imagen), `caption?: string`, y `className?`. Aplica el padding inferior mayor, shadow-photo, border-radius: 2px.

`frontend/src/components/shared/LoadingReveal.tsx` — el estado de carga con animación de cuarto oscuro. Acepta `message: string` y `progress?: number` (0-100). Si no hay progress, la barra avanza con animación autónoma GSAP que desacelera al 80%.

`frontend/src/components/shared/RotatePrompt.tsx` — el aviso de orientación. Solo se muestra en landscape + mobile via CSS.

**Override shadcn Button:** El componente Button de shadcn debe ser modificado para que su variante `default` use los estados de DESIGN.md sección 6 (incluyendo el `active: scale(0.97)` en 80ms via CSS, no JS).

**Tarea de verificación:** Crear una página temporal `frontend/src/pages/DesignSystemPage.tsx` que muestre todos los tokens: colores, tipografías, sombras, el PolaroidFrame con una imagen placeholder. Esta página se elimina antes de la Fase 2. Si todo se ve como DESIGN.md, el sprint está completo.

---

### Sprint 1.3 — Routing y páginas vacías
**Estado: PENDIENTE**
**Depende de:** Sprint 1.2 completo

Configurar React Router con todas las rutas del producto, aunque las páginas estén vacías. Esto evita tener que refactorizar el routing cuando se implemente cada feature.

`frontend/src/main.tsx`:
```tsx
import { RouterProvider, createBrowserRouter } from 'react-router-dom'

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/unirse', element: <JoinPage /> },           // Escenario B: formulario manual
  { path: '/sala/:code', element: <SalaPage /> },        // Escenario A: link directo
  { path: '/sala/:code/lobby', element: <LobbyPage /> },
  { path: '/sala/:code/juego', element: <GamePage /> },
])
```

Cada página es un componente mínimo que solo muestra su nombre en Syne 800 sobre fondo `--bg-primary`. No hay lógica. Solo la ruta existe y renderiza algo.

**Tarea de verificación:** Navegar manualmente a cada ruta en el browser. Todas deben renderizar sin errores 404 ni crashes.

---

## FASE 2 — BACKEND CORE
### Objetivo: Worker funcionando localmente con Durable Object, WebSockets y R2. Sin frontend real aún — testear con herramientas de desarrollo (wscat, curl, Postman).
### Duración estimada: 2-3 sesiones de trabajo

---

### Sprint 2.1 — Worker base con Hono y rutas HTTP
**Estado: PENDIENTE**
**Depende de:** Fase 1 completa

Implementar todas las rutas HTTP del Worker con validación Zod pero sin el Durable Object aún (respuestas mock).

Rutas a implementar:
- `POST /api/sala` → genera código, devuelve `{ codigo, joinUrl }`
- `POST /api/sala/:code/join` → valida código y nickname, devuelve `{ jugadorId, nickname }`
- `POST /api/sala/:code/foto` → genera presigned URL de R2, devuelve `{ uploadUrl, key }`
- `GET /api/sala/:code/ws` → stub que devuelve 501 hasta el sprint siguiente
- `DELETE /api/sala/:code` → stub

Toda la validación de entrada usa Zod. Los schemas están en `shared/schemas.ts`.
Rate limiting en `POST /api/sala`: máx 10 salas por IP/hora. Implementar con un Map en memoria del Worker (no persiste entre instancias, suficiente para MVP).

**Tarea de verificación:** `curl -X POST http://localhost:8787/api/sala` devuelve `{ codigo: "ABCD123", joinUrl: "..." }` con código 201.

---

### Sprint 2.2 — Durable Object: state machine y WebSockets
**Estado: PENDIENTE**
**Depende de:** Sprint 2.1 completo

El Durable Object es la pieza más compleja del backend. Implementar en este orden:

1. **Estructura base del DO** — clase `GameRoom` con `fetch()` que acepta WebSocket upgrades
2. **Gestión de conexiones** — `Map<string, WebSocket>`, broadcast a todos, broadcast a uno
3. **State machine** — los 6 estados de PRODUCT.md sección 4.2: `waiting → lobby_ready → round_showing → round_results → game_over → resetting`
4. **Eventos cliente→servidor** — `JOIN`, `FOTOS_READY`, `START_GAME`, `ANSWER`, `PLAY_AGAIN`
5. **Eventos servidor→cliente** — todos los eventos del contrato de PRODUCT.md sección 9
6. **DO Alarm** — cleanup automático a los 30 minutos de inactividad

El evento `PLAYER_RESPONSE_COUNT` se emite **solo al jugador propietario de la foto** cada vez que alguien responde. Nunca a los demás jugadores.

Los errores se emiten como `{ type: 'ERROR', code: string, message: string }` usando los códigos estandarizados de PRODUCT.md sección 9.

**Tarea de verificación:** Usar `wscat -c ws://localhost:8787/api/sala/TEST01/ws` y enviar `{ "type": "JOIN", "nickname": "Ana" }`. Debe recibir `{ "type": "LOBBY_UPDATE", "jugadores": [...] }`.

---

### Sprint 2.3 — R2: upload y borrado
**Estado: PENDIENTE**
**Depende de:** Sprint 2.2 completo

- Presigned URLs con TTL 1 hora
- Validación: solo imágenes (`image/jpeg`, `image/png`, `image/webp`, `image/heic`), máx 5MB
- Borrado por prefijo `fotos/{salaCode}/` al terminar la partida o en el DO Alarm
- Generar presigned URL nueva al inicio de cada ronda (por si la anterior expiró)

**Tarea de verificación:** `POST /api/sala/TEST01/foto` devuelve `{ uploadUrl, key }`. Hacer PUT con una imagen a esa URL. La imagen existe en R2. Al llamar `DELETE /api/sala/TEST01`, la imagen desaparece.

---

## FASE 3 — FEATURES CORE (FLUJO COMPLETO)
### Objetivo: El flujo completo funciona de punta a punta: crear sala → unirse → elegir fotos → jugar → resultado. Sin animaciones de juego aún — solo la lógica.
### Duración estimada: 3-4 sesiones de trabajo

---

### Sprint 3.1 — Pantalla de inicio + Unirse a partida
**Estado: PENDIENTE**
**Depende de:** Fase 2 completa

**HomePage.tsx:**
- Logo "PHOTO GUESSER" con GUESSER en `--accent`
- Tagline en Instrument Serif italic
- Botones "Crear partida" y "Unirse a partida"
- Siluetas Polaroid en el fondo (posición absoluta, opacity 0.08, `--bg-secondary`)
- Animación de entrada: GSAP al montar (logo back.out, botones stagger)
- Al pulsar "Crear partida": `POST /api/sala` → redirect a `/sala/:code` (Escenario A del join)

**JoinPage.tsx** (Escenario B — formulario manual):
- Campo código + campo nickname
- Auto-uppercase en el campo de código
- Validación inline con shake GSAP en error
- `PrivacyNotice.tsx` debajo del botón si `!localStorage.getItem('pg_privacy_seen')`
- Al enviar: `POST /api/sala/:code/join` → redirect al lobby

**SalaPage.tsx** (Escenario A — link directo):
- Extrae `:code` de la URL con `useParams()`
- Solo muestra el campo nickname (código ya pre-rellenado y visible, solo lectura)
- `PrivacyNotice.tsx` igual que en JoinPage
- Al enviar: `POST /api/sala/:code/join` → redirect al lobby

**ShareRoom.tsx** (aparece al crear sala antes del lobby):
- Código grande en Geist Mono con botón copiar
- QR dentro de `<PolaroidFrame>`
- Botones de compartir: WhatsApp, copiar link, Web Share API (degradación silenciosa si no disponible)
- Animación GSAP del código (flip reveal + stagger de caracteres)
- `PrivacyNotice.tsx` aquí también (el creador también debe verlo)

---

### Sprint 3.2 — Lobby en tiempo real
**Estado: PENDIENTE**
**Depende de:** Sprint 3.1 completo

**Lobby.tsx:**
- `useGameSocket` hook: gestiona el WebSocket lifecycle, reconexión automática con backoff exponencial (intentos: 1s, 2s, 4s, máx 10s)
- Lista de jugadores con estado usando `AnimatePresence` de Motion
- Card de jugador: borde izquierdo 3px cambia color según estado con Motion
- Botón "Elegir mis fotos" → abre `PhotoSelector.tsx`
- Botón "Iniciar partida" (solo host, solo habilitado con ≥2 jugadores listos)
- El código de sala siempre visible en el header (pequeño, con botón copiar)
- Banner de reconexión cuando se pierde la conexión

**useGameSocket hook:**
```typescript
// Contrato mínimo del hook
function useGameSocket(salaCode: string, jugadorId: string) {
  return {
    estado: 'connecting' | 'connected' | 'disconnected' | 'reconnecting',
    jugadores: Jugador[],
    sendMessage: (msg: ClientWSEvent) => void,
    lastEvent: ServerWSEvent | null,
  }
}
```

**Tarea de verificación:** Abrir la app en dos tabs del browser. Unirse con nicknames distintos. Los dos deben verse mutuamente en el lobby en tiempo real.

---

### Sprint 3.3 — Selección de fotos
**Estado: PENDIENTE**
**Depende de:** Sprint 3.2 completo

**PhotoSelector.tsx** — el orquestador:
- Modo B (Random) como hero: botón full-width con dado que rota al activarse
- Separador "— o elige tú mismo ↓ —"
- Modo A (manual) y Modo C (categorías) como botones secundarios en la misma fila
- `PhotoProgressBar.tsx`: visualización de tira de cine con `X/10 fotos listas`
- Grid de miniaturas 3 columnas en mobile
- Botón ✕ en cada miniatura (área touch mínima 44px)
- Botón "Reemplazar" cuando se elimina una foto en Modo B
- Botón "✅ Confirmar" deshabilitado si < 10 fotos
- `usePhotoUpload` hook: sube fotos a R2 una a una, actualiza progreso en `LoadingReveal`
- Al confirmar: emit `FOTOS_READY { fotoKeys }` via WebSocket

**usePhotoRandom hook:**
```typescript
function usePhotoRandom() {
  return {
    pickRandom: (files: File[], count: number) => File[],  // Fisher-Yates
    pool: File[],      // pool original para reemplazos
    replace: (index: number) => File,  // reemplaza una foto del pool
  }
}
```

---

### Sprint 3.4 — Pantalla de juego (lógica, sin animaciones de juego)
**Estado: PENDIENTE**
**Depende de:** Sprint 3.3 completo

En este sprint la pantalla de juego funciona correctamente pero con animaciones básicas (fade/opacity). Las animaciones GSAP de juego se añaden en el sprint siguiente.

**GameRound.tsx:**
- Layout: header fijo (ronda X/Y + timer SVG) + foto + pregunta + opciones 2x2
- La foto dentro de `<PolaroidFrame>` con `border-radius: 2px`
- `Timer.tsx`: SVG circular que se vacía en 15s. Solo la progresión de color (neutro → accent → urgente) sin el efecto pulse de GSAP aún.
- `AnswerOptions.tsx`: 4 botones, `min-height: 54px`. El feedback táctil (scale 0.96) en CSS puro.
- `OwnerWaiting.tsx`: el estado "foto es tuya" con `ResponseDots.tsx`. Los puntos se actualizan al recibir `PLAYER_RESPONSE_COUNT`.
- En desktop (≥1024px): layout de dos columnas con mini ranking en sidebar.

**Estado Zustand `juegoSlice`:**
```typescript
interface JuegoState {
  faseRonda: 'idle' | 'showing' | 'answered' | 'result'
  fotoActual: { url: string; opciones: string[]; rondaNum: number } | null
  respuestaSeleccionada: string | null
  rankingActual: RankingItem[]
  miPuntuacion: number
  esMiFoto: boolean
  respuestaCount: { count: number; total: number }  // para ResponseDots
}
```

**Tarea de verificación:** Jugar una partida completa de 3 rondas con 2 jugadores reales (dos tabs del browser). Sin animaciones de juego, pero todo el flujo debe funcionar: revelar foto, responder, ver resultado, siguiente ronda, pantalla final.

---

## FASE 4 — ANIMACIONES DE JUEGO
### Objetivo: Implementar todos los GSAP timelines de PRODUCT.md sección 6. La experiencia pasa de "funciona" a "se siente como un juego".
### Duración estimada: 1-2 sesiones de trabajo

> **Instrucción para el chat de esta fase:** Adjunta DESIGN.md, PRODUCT.md y PROGRESS.md. El asistente debe leer la sección 6 de PRODUCT.md y la sección 7 de DESIGN.md antes de escribir cualquier animación. Implementar en el orden exacto de abajo para detectar problemas de rendimiento temprano.

---

### Sprint 4.1 — Animaciones de UI (no de juego)
**Estado: PENDIENTE**
**Depende de:** Fase 3 completa

- Entrada del logo en HomePage (GSAP, back.out)
- Entrada de botones en HomePage (GSAP, stagger)
- Entrada del código de sala en ShareRoom (flip reveal + stagger de caracteres)
- Entrada del QR (elastic.out)
- Transición lobby → juego (zoom-out + fade → "¡Que empiece!" → fade al juego)
- Animación del dado en RandomPickBtn (CSS rotate 360°)
- Shake horizontal en errores de formulario (GSAP `x: [-4, 4, -4, 0]`)

### Sprint 4.2 — Timeline del reveal de foto
**Estado: PENDIENTE**
**Depende de:** Sprint 4.1 completo

Implementar el timeline completo de PRODUCT.md sección 6.3 "Reveal de foto":
- Overlay oscurece (200ms)
- Foto entra desde abajo con overshoot (350ms, expo.out)
- Pregunta aparece con elastic (200ms)
- Opciones en stagger (25ms × 4 opciones, back.out)
- Total: ~900ms

Este es el momento más importante del producto. Testear en mobile real antes de dar por bueno.

### Sprint 4.3 — Timer urgente y animaciones de respuesta
**Estado: PENDIENTE**
**Depende de:** Sprint 4.2 completo

- Timer SVG con `strokeDashoffset` GSAP y easing que acelera al final
- Progresión de color del timer (incluyendo el número central)
- Pulse de urgencia en los últimos 3 segundos
- Bump del número en cada segundo
- Puntos de luz `ResponseDots` con micro-animación elastic al activarse

### Sprint 4.4 — Timeline de resultado de ronda + puntos volando
**Estado: PENDIENTE**
**Depende de:** Sprint 4.3 completo

- Opciones incorrectas se desvanecen (200ms)
- Opción correcta se ilumina y escala
- Nombre del dueño aparece sobre la foto (label Polaroid)
- Puntos "+100/+75/+50" aparecen y viajan en arco al marcador
- canvas-confetti burst pequeño al acertar
- Mini ranking se reordena con Motion layout

### Sprint 4.5 — Timeline de pantalla final
**Estado: PENDIENTE**
**Depende de:** Sprint 4.4 completo

- Entrada del título "FIN DE LA PARTIDA" (expo.out desde arriba)
- Cards de jugadores en stagger desde abajo
- Ganador: scale + glow dorado
- canvas-confetti burst grande (3 segundos)
- Pulse del botón "Jugar otra vez" cada 3 segundos

---

## FASE 5 — PULIDO Y DEPLOY
### Objetivo: El producto está listo para que amigos lo usen de verdad.
### Duración estimada: 1-2 sesiones de trabajo

---

### Sprint 5.1 — Estados de error completos
**Estado: PENDIENTE**
**Depende de:** Fase 4 completa

Implementar todos los estados de error de DESIGN.md sección 5.10:
- Toast para errores transitorios (subida fallida, etc.) con Motion slide desde abajo
- Pantalla de "Sala no encontrada" con Polaroid en blanco
- Banner de reconexión con icono rotando
- Todos los mensajes de error usando el microcopy del producto (nunca códigos técnicos)

### Sprint 5.2 — `prefers-reduced-motion` y accesibilidad final
**Estado: PENDIENTE**
**Depende de:** Sprint 5.1 completo

- `gsap.globalTimeline.timeScale(0)` cuando `prefers-reduced-motion: reduce` está activo
- Animaciones funcionales simplificadas (timer, feedback de respuesta) pero presentes
- Audit de todos los `aria-label` faltantes
- Verificar orden de tabulación en pantalla de juego
- `aria-live="polite"` en el timer

### Sprint 5.3 — Modo oscuro
**Estado: PENDIENTE**
**Depende de:** Sprint 5.2 completo

- Toggle de modo oscuro (guardado en localStorage)
- Todos los tokens del modo `.dark` de DESIGN.md sección 10
- El frame Polaroid en modo oscuro: `border: 1px solid rgba(240, 235, 227, 0.12)`
- `RotatePrompt` en modo oscuro

### Sprint 5.4 — Deploy y configuración Cloudflare
**Estado: PENDIENTE**
**Depende de:** Sprint 5.3 completo

```bash
# Worker
cd worker
npx wrangler login
npx wrangler r2 bucket create photo-guesser-photos
npx wrangler deploy

# Frontend
cd ../frontend
# Conectar repo GitHub a Cloudflare Pages desde el dashboard
# Build command: npm run build
# Build output: dist
# Root directory: frontend
```

Variables de entorno a configurar en Cloudflare Pages:
- `VITE_API_URL` = URL del Worker desplegado

### Sprint 5.5 — Testing con usuarios reales
**Estado: PENDIENTE**
**Depende de:** Sprint 5.4 completo

Hacer una partida real con al menos 3 personas en dispositivos distintos (no simulados). Observar sin intervenir. Los puntos que alguien no entiende en menos de 30 segundos son bugs de UX, no de código.

Checklist mínimo:
- [ ] El no-gamer del grupo puede unirse y subir fotos sin preguntar nada
- [ ] El código de sala se puede compartir por WhatsApp y funciona al abrirlo
- [ ] El timer se siente urgente en los últimos 3 segundos
- [ ] El reveal de la foto genera una reacción visible en el grupo
- [ ] La partida completa dura entre 5 y 12 minutos con 10 rondas
- [ ] Las fotos se borran correctamente (verificar en panel R2 después)

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

---

*Actualiza el "Estado actual" al inicio de este archivo cada vez que completes un sprint.*
*Versión: 1.0 — Creado al inicio del proyecto.*