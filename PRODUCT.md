# 🎮 Photo Guesser — Especificación técnica v3.1

> Documento de referencia completo para desarrollo.
> Pegar este archivo como contexto en cualquier chat nuevo para que el asistente entienda exactamente qué construir, cómo, con qué herramientas y por qué cada decisión existe.

> **Changelog v3.1:** Flujo de "Unirse a partida" especificado técnicamente, aviso de privacidad reposicionado al momento de unirse (antes de la selección de fotos), evento WebSocket `PLAYER_RESPONSE_COUNT` añadido para el estado "foto es tuya", jerarquía de modos de selección de fotos actualizada (Modo B como default), estados de carga y error añadidos a los edge cases, evento de reset explicitado en el contrato WebSocket, orientación de dispositivo añadida.

---

## 1. Visión del producto

### 1.1 El problema que resuelve

Cuando un grupo de amigos quiere jugar juntos en el móvil o en el ordenador, las opciones existentes tienen fricción: hay que instalar una app, crear una cuenta, pagar una suscripción, o el juego solo funciona bien en nativo. **Photo Guesser elimina todo eso.**

La promesa del producto es una sola frase:

> **"En menos de 60 segundos, sin instalar nada ni registrarse, un grupo de amigos puede estar jugando juntos con sus propias fotos."**

### 1.2 El núcleo emocional

Photo Guesser no es un juego de trivia ni de habilidad. Es un **espejo social**: el juego revela cuánto conoces a tus amigos, provoca risas con fotos inesperadas, genera momentos de "¿eso eres tú?!" y crea recuerdos compartidos en tiempo real.

El objetivo no es ganar. El objetivo es el **caos divertido** que pasa mientras juegas.

Eso tiene una implicación de diseño importante: **cada decisión de UX y animación debe amplificar el momento social, no el mecanismo del juego.** La puntuación existe para crear tensión, no para que nadie se tome en serio quién gana.

### 1.3 Usuario objetivo

Grupos de amigos de entre 3 y 10 personas que quedan en persona o por videollamada. Incluye siempre un perfil crítico: el **no-gamer del grupo** — la persona que llega via link de WhatsApp, sin contexto de lo que viene, con 30 segundos de paciencia antes de rendirse. El diseño técnico debe garantizar que este usuario puede estar jugando sin haber leído nada.

### 1.4 Qué hace Photo Guesser diferente

| Problema habitual | Cómo lo resuelve Photo Guesser |
|---|---|
| "Hay que instalar una app" | Web app, funciona desde el navegador del móvil |
| "Hay que crear una cuenta" | Solo un nickname, sin email ni contraseña |
| "Las fotos son genéricas o aleatorias" | Cada jugador sube sus propias fotos — el contenido es personal |
| "Tarda mucho en arrancar" | Desde crear la sala hasta jugar: < 60 segundos |
| "Solo funciona bien en PC" | Mobile-first, diseñado para pantallas táctiles |
| "Las fotos quedan guardadas en el servidor" | Borrado automático al terminar — privacidad real |

---

## 2. Flujo de usuario completo

### 2.1 Pantalla de inicio
- Botón **"Crear partida"**
- Botón **"Unirse a partida"**
- Sin registro ni login requerido

### 2.2 Crear partida
1. El sistema genera un código de sala único (ej: `ABCD123`)
2. Se muestra la pantalla de **compartir sala**:
   - **Código de sala** (`ABCD123`) con botón de copiar al portapapeles
   - **Link directo** con botón de copiar
   - **QR code** generado via `qrserver.com` dentro de un frame Polaroid
   - **Botón WhatsApp** → abre `https://wa.me/?text=...`
   - **Botón Instagram** → copia el link + toast "Pégalo en un DM"
   - **Web Share API** en móvil → sheet nativo del SO
3. El creador entra al lobby como **host**
4. El creador ve el **aviso de privacidad** una única vez (ver sección 2.3)

### 2.3 Unirse a partida
> ⚠️ **v3.1 — Flujo especificado.** En v3.0 no había spec técnica de esta pantalla.

**Escenario A — Usuario viene de link directo** (`/sala/ABCD123`):
1. La URL contiene el código. El frontend lo extrae del path con React Router.
2. Se muestra directamente la pantalla de nickname con el código pre-rellenado (solo lectura).
3. El usuario escribe un nickname (máx 20 caracteres) y pulsa "Entrar".
4. Si es la primera vez (localStorage flag `pg_privacy_seen`): se muestra el aviso de privacidad debajo del campo de nickname, antes del botón. No es un modal bloqueante.
5. `POST /api/sala/ABCD123/join` con `{ nickname }`.
6. Redirect al lobby.

**Escenario B — Usuario llega desde "Unirse a partida" en la pantalla de inicio**:
1. Se muestra formulario con campo de código + campo de nickname.
2. El código es case-insensitive en UI; se normaliza a uppercase antes del POST.
3. Validación inline: si el POST devuelve 404, el campo de código hace shake + borde de error.
4. Aviso de privacidad igual que en Escenario A.

**El flag `pg_privacy_seen`** también se activa cuando el creador de la sala ve el aviso en la pantalla de compartir. Así nadie lo ve dos veces, pero todo el mundo lo ve al menos una.

### 2.4 Lobby
- Lista de jugadores conectados en tiempo real con su estado
- Estado por jugador: ✅ fotos listas / ⏳ eligiendo / ❌ desconectado
- Botón **"Elegir mis fotos"** para cada jugador
- Botón **"Iniciar partida"** solo para el host, habilitado cuando ≥2 jugadores tienen fotos listas
- QR y opciones de compartir siempre accesibles desde el lobby

### 2.5 Selección de fotos

> ⚠️ **v3.1 — Jerarquía de modos actualizada.** El Modo B (random) es ahora el hero de la pantalla y el estado por defecto visible. Los modos A y C son secundarios.

#### Modo B — Random automático (hero, estado por defecto)
- Botón grande full-width, prominente: **"🎲 Elegir 10 fotos al azar"**
- El usuario selecciona su galería (o un álbum grande)
- El sistema elige aleatoriamente 10 usando Fisher-Yates sobre el array de File objects
- El usuario puede eliminar fotos individuales con ✕; al eliminar, aparece botón "🎲 Reemplazar" en el hueco
- El pool original de archivos se guarda en estado para poder hacer reemplazos

#### Modo A — Selección manual (secundario, "o elige tú mismo")
- Abre el selector de archivos del sistema
- Selecciona fotos individualmente
- Ve miniaturas con botón ✕ en cada una

#### Modo C — Por categorías (secundario, mismo nivel que A)
- Categorías: 🤳 Selfies · 🏖️ Vacaciones · 🍕 Comida · 👥 Amigos · 🐾 Mascotas · 🎉 Fiestas · 🏃 Deporte · 📸 Otras
- Botón **"🎲 Mezclar y elegir 10 al azar"**

#### Estado del selector
- Barra de progreso tipo tira de cine: `X / 10 fotos listas`
- Grid de miniaturas 3–4 columnas
- Botón **"✅ Confirmar"** habilitado solo con ≥10 fotos → estado pasa a "listo" en el lobby

### 2.6 Gameplay — rondas
1. Durable Object selecciona foto aleatoria no usada
2. Broadcast a todos: URL firmada + opciones shuffled + timer 15s
3. El dueño de la foto ve "¿Cuántos te conocen?" con puntos de luz en tiempo real
4. Cuando un jugador (no el dueño) responde: el DO emite `PLAYER_RESPONSE_COUNT` al dueño
5. El resto de jugadores responden antes de que acabe el timer
6. Al acabar: foto + dueño real + quién acertó + puntos ganados + mini ranking
7. Pausa 3s → siguiente ronda

### 2.7 Sistema de puntuación
| Resultado | Puntos |
|---|---|
| Correcto en < 5s | +100 |
| Correcto en 5–10s | +75 |
| Correcto en 10–15s | +50 |
| Incorrecto | 0 |
| Foto propia (skip) | — |

### 2.8 Fin de partida
- Se acaban todas las fotos (mínimo 10 rondas garantizadas)
- Ranking final con ganador destacado
- Opción **"Jugar otra vez"** → confirmación de 1.5s → reset de puntos → lobby nuevo → se piden fotos nuevas
- Fotos borradas automáticamente de R2

---

## 3. MoSCoW — Priorización

### ✅ Must Have (MVP obligatorio)
- Crear sala con código único
- Unirse con código (Escenario A: link directo + Escenario B: formulario manual)
- Aviso de privacidad en el momento de unirse (localStorage flag, una sola vez)
- Nickname sin registro
- Compartir sala: código + link + QR Polaroid + WhatsApp + Instagram + Web Share API
- Lobby en tiempo real (jugadores + estado fotos)
- Selección de fotos: Modo B (random, hero) + Modo A (manual, secundario)
- Mínimo 10 fotos, máximo 20 por jugador
- Rondas sincronizadas en tiempo real
- Timer visual 15s con progresión de color (neutro → accent → urgente)
- Estado "foto es tuya" con puntos de luz en tiempo real (evento `PLAYER_RESPONSE_COUNT`)
- Skip automático si la foto es tuya
- Puntuación con bonus por velocidad
- Ranking de ronda y ranking final
- Borrado automático de fotos al terminar
- Estados de carga con animación de "revelado" (componente `<LoadingReveal>`)
- Estados de error con tono del producto (ver sección de edge cases)
- Aviso de orientación de dispositivo en landscape mobile
- Gestión de desconexiones (partida continúa)
- Validación Zod en cliente y Worker
- TypeScript end-to-end
- Animaciones de juego con GSAP
- Responsive mobile-first, portrait forzado en mobile

### 🟡 Should Have
- Selección de fotos por categorías (Modo C)
- "Jugar otra vez" con confirmación de 1.5s y reset animado de puntos
- Animaciones de layout React con Motion
- Confetti al acertar y en ganador final
- Indicador de cuántas rondas quedan

### 🟠 Could Have
- El host puede expulsar jugadores del lobby
- Modo espectador
- Efectos de sonido ligeros
- Ver fotos propias subidas antes de confirmar

### ❌ Won't Have (fuera de scope)
- Login / cuentas persistentes
- Chat de texto
- Historial de partidas
- Moderación automática de contenido
- Más de 10 jugadores por sala (MVP)
- App nativa
- Vídeo en tiempo real

---

## 4. Arquitectura técnica

### 4.1 Patrón — Edge-First Stateful Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER                                         │
│  Vite + React SPA — Cloudflare Pages                        │
│  • Feature-based folder structure                           │
│  • Zustand slices por dominio (sala, fotos, lobby, juego)   │
│  • TanStack Query para fetch HTTP con cache                 │
│  • useGameSocket hook para WebSocket lifecycle              │
│  • GSAP para secuencias de juego                            │
│  • Motion para layout y transiciones de UI React            │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP (REST) + WebSocket upgrade
┌────────────────────▼────────────────────────────────────────┐
│  EDGE ROUTING LAYER                                         │
│  Cloudflare Worker con Hono — enrutador + validación Zod    │
│  POST   /api/sala              → crear sala                 │
│  POST   /api/sala/:code/join   → unirse a sala              │
│  POST   /api/sala/:code/foto   → presigned URL para R2      │
│  GET    /api/sala/:code/ws     → upgrade a WebSocket → DO   │
│  DELETE /api/sala/:code        → cerrar sala + limpiar R2   │
└──────────┬──────────────────────────┬───────────────────────┘
           │ DO stub                  │ R2 binding
┌──────────▼──────────────┐  ┌────────▼──────────────────────┐
│  STATEFUL REALTIME      │  │  OBJECT STORAGE               │
│  Durable Object         │  │  Cloudflare R2                │
│  1 instancia = 1 sala   │  │  fotos/{salaCode}/{uuid}      │
│  • State machine        │  │  presigned URLs 1h TTL        │
│  • WebSocket manager    │  │  borrado por prefijo          │
│  • Round orchestration  │  │  0€ egress                    │
│  • Score calculation    │  └───────────────────────────────┘
│  • Broadcast events     │
│  • DO Alarm (cleanup)   │
└─────────────────────────┘
```

### 4.2 State machine del Durable Object

```
WAITING_FOR_PLAYERS
       │ (≥2 jugadores con fotos listas)
       ▼
   LOBBY_READY
       │ (host pulsa Start)
       ▼
  ROUND_SHOWING  ←──────────────────┐
       │ (todos responden O timer)  │
       ▼                            │
  ROUND_RESULTS                     │ (quedan fotos)
       │ ──────────────────────────-┘
       │ (no quedan fotos)
       ▼
   GAME_OVER
       │ (host pulsa "Jugar otra vez")
       ▼
  RESETTING  ── (reset de puntos + fotos)
       │
       ▼
WAITING_FOR_PLAYERS  (nuevo ciclo, mismo código de sala o código nuevo)
```

Estado en memoria del DO:

```typescript
interface SalaState {
  codigo: string
  createdAt: number
  estado: 'waiting' | 'lobby_ready' | 'round_showing' | 'round_results' | 'game_over' | 'resetting'
  host: string
  jugadores: Map<string, Jugador>
  connections: Map<string, WebSocket>
  fotosPool: FotoRonda[]
  rondaActual: number
  fotoActual: FotoRonda | null
  respuestasRonda: Map<string, Respuesta>
  respuestasCount: number  // ← v3.1: contador para emitir PLAYER_RESPONSE_COUNT
  timerHandle: ReturnType<typeof setTimeout> | null
}

interface Jugador {
  id: string
  nickname: string
  fotoKeys: string[]
  puntuacion: number
  conectado: boolean
  fotosListas: boolean
}
```

### 4.3 Validación con Zod — contratos compartidos

```typescript
// shared/schemas.ts

export const WSEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('LOBBY_UPDATE'),
    jugadores: z.array(JugadorSchema) }),
  z.object({ type: z.literal('GAME_START'),
    totalRondas: z.number() }),
  z.object({ type: z.literal('ROUND_START'),
    rondaNum: z.number(),
    fotoUrl: z.string().url(),
    opciones: z.array(z.string()),
    timerMs: z.number() }),
  // v3.1: evento nuevo para el estado "foto es tuya"
  z.object({ type: z.literal('PLAYER_RESPONSE_COUNT'),
    count: z.number(),       // cuántos han respondido ya (sin revelar qué)
    total: z.number() }),    // cuántos pueden responder en esta ronda
  z.object({ type: z.literal('ROUND_RESULT'),
    propietarioId: z.string(),
    propietarioNickname: z.string(),
    respuestasCorrectas: z.array(z.string()),
    puntosGanados: z.record(z.number()),
    rankingRonda: z.array(RankingItemSchema) }),
  z.object({ type: z.literal('GAME_END'),
    rankingFinal: z.array(RankingItemSchema) }),
  z.object({ type: z.literal('GAME_RESET'),
    nuevoCodigo: z.string().optional() }),  // v3.1: emitido cuando el host pulsa "Jugar otra vez"
  z.object({ type: z.literal('PLAYER_DISCONNECTED'),
    jugadorId: z.string(), nickname: z.string() }),
  z.object({ type: z.literal('PLAYER_RECONNECTED'),
    jugadorId: z.string() }),
  z.object({ type: z.literal('HOST_CHANGED'),
    newHostId: z.string() }),
  z.object({ type: z.literal('ERROR'),
    code: z.string(), message: z.string() }),
])
```

Cualquier mensaje WebSocket que no pase el parse de Zod se descarta silenciosamente en el cliente.

### 4.4 Flujo de subida de fotos

```
Cliente              Worker                   R2
   │                    │                      │
   │─ POST /foto ───────▶                      │
   │  { salaCode,       │ validar Zod          │
   │    jugadorId,      │ generar uuid key      │
   │    mimeType,       │─ createPresignedUrl ─▶│
   │    sizeBytes }     │◀─ presignedUrl ───────│
   │◀─ { uploadUrl, key}│                      │
   │                    │                      │
   │─ PUT uploadUrl (foto binaria) ────────────▶│
   │◀─ 200 OK ──────────────────────────────────│
   │                    │                      │
   │─ WS: FOTOS_READY { keys[] } ──▶ DO        │
```

El componente `<LoadingReveal>` se activa durante el PUT a R2. Muestra "revelando tus fotos... X de Y" con progreso real basado en cuántas fotos han completado su upload.

### 4.5 QR y compartir sala

**QR**: `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ENCODED_URL">`. La URL codificada es el link directo a la sala. Se renderiza dentro del componente `<PolaroidFrame>`.

**WhatsApp**: `window.open('https://wa.me/?text=' + encodeURIComponent(mensaje + url))`

**Instagram**: Copia el link al portapapeles + toast.

**Web Share API**: `navigator.share({ title, text, url })` como primera opción en móvil. Degradación silenciosa si no está disponible (el botón simplemente no aparece).

---

## 5. Stack tecnológico

### 5.1 Frontend

| Herramienta | Rol |
|---|---|
| **Vite 6+** | Build tool, dev server |
| **React 19** | UI framework |
| **TypeScript 5** | Tipado end-to-end |
| **React Router v7** | Routing client-side |
| **Zustand 5** | Estado global por slices de dominio |
| **TanStack Query 5** | Fetching HTTP, cache, loading/error states |
| **Zod 3** | Validación runtime, schemas compartidos |
| **Tailwind CSS 4** | Utility-first styles |
| **shadcn/ui** | Componentes base accesibles (overrideados completamente) |
| **GSAP** | Animaciones de secuencia del juego |
| **Motion (Framer Motion) 11** | Animaciones de layout React, AnimatePresence |
| **canvas-confetti** | Celebraciones puntuales (4KB, zero deps) |
| **clsx + tailwind-merge** | Composición de clases condicional |

### 5.2 Backend

| Herramienta | Rol |
|---|---|
| **Cloudflare Workers** | Runtime edge, enrutador HTTP |
| **Hono 4** | Router HTTP dentro del Worker |
| **Durable Objects** | Estado de sala + WebSockets en tiempo real |
| **Cloudflare R2** | Almacenamiento temporal de fotos, 0€ egress |
| **Zod 3** | Validación de entrada HTTP |
| **TypeScript 5** | Tipado del Worker y DO |
| **Wrangler 3** | CLI: desarrollo local y deploy |

### 5.3 Infraestructura — todo gratis

| Servicio | Tier gratuito | Uso estimado por partida |
|---|---|---|
| **Cloudflare Pages** | Ilimitado | — |
| **Workers** | 100k req/día | ~20 req |
| **Durable Objects** | Free tier | 1 DO por sala |
| **R2 Storage** | 10GB/mes | ~50MB (borrado al terminar) |
| **R2 Egress** | 0€ siempre | — |
| **QR Server API** | Gratis sin key | 1 llamada por sala |

---

## 6. Estrategia de animaciones

### 6.1 Por qué importan las animaciones en este producto

Photo Guesser es un juego social. La animación convierte un evento técnico ("el servidor envió el resultado") en un **momento emocional** ("¡lo adiviné!").

### 6.2 Separación estricta de herramientas

**GSAP** — momentos de juego con timing exacto (secuencias narrativas).
**Motion** — layout de React que reacciona al estado (AnimatePresence, layout).
**CSS transitions** — feedback táctil inmediato (< 100ms, nunca GSAP ni Motion aquí).
**canvas-confetti** — celebraciones puntuales.

**Regla de no-mezcla:** Si un elemento necesita feedback táctil CSS Y luego una secuencia GSAP, el GSAP actúa sobre una clase diferente a la que gestiona el transform del CSS. No hay conflicto porque son propiedades distintas o porque GSAP toma el control limpiamente con `gsap.set` antes de animar.

### 6.3 Momentos animados

#### Pantalla de inicio
- Logo: `gsap.from` + `elastic.out` al montar
- Botones: stagger vertical 80ms con `back.out(1.7)`

#### Compartir sala
- Código: flip reveal + stagger de caracteres (slot machine)
- QR: `elastic.out(1, 0.5)` — se "materializa"

#### Lobby
- Cards de jugador: `AnimatePresence` Motion con slide desde derecha + fade
- Estado ⏳/✅/❌: `layout` Motion
- Botón "Iniciar": ilumina con transición de color Motion

#### Estados de carga (`<LoadingReveal>`)
- Barra de progreso con GSAP que desacelera al 80% y espera hasta resolución
- Texto tipo máquina de escribir: caracteres uno a uno, Geist Mono

#### Inicio de partida
- Lobby zoom-out + fade → negro 200ms → "¡Que empiece!" expo.out → fade al juego

#### Reveal de foto
```javascript
const revealTimeline = gsap.timeline()
  .to(overlay, { opacity: 0.6, duration: 0.2 })
  .from(photoEl, { y: 60, scale: 0.92, opacity: 0, duration: 0.35, ease: "expo.out" }, 0.2)
  .from(questionEl, { scale: 0, opacity: 0, duration: 0.2, ease: "elastic.out(1, 0.4)" }, 0.5)
  .from(optionEls, { y: 20, opacity: 0, duration: 0.25, ease: "back.out(1.4)", stagger: 0.06 }, 0.65)
```

#### Timer (15 segundos)
- SVG `strokeDashoffset` animado con GSAP
- Easing: `power1.in` primeros 10s → `expo.in` últimos 5s (urgencia creciente)
- Últimos 3s: pulse con `yoyo: true`, color `--timer-urgent` tanto en trazo como en número central
- El número hace bump cada segundo con `gsap.fromTo` scale(1→1.3→1)

#### Estado "foto es tuya" — puntos de luz
- Recibe evento WS `PLAYER_RESPONSE_COUNT` del DO
- Cada punto que pasa de "esperando" a "respondido": CSS transition `background-color 200ms` + `gsap.from(dot, { scale: 0.5, duration: 0.2, ease: "elastic.out(1, 0.5)" })`
- Sin revelar la respuesta — solo que alguien respondió

#### Respuesta del jugador
- Al tocar una opción: **CSS** `transform: scale(0.96)`, `transition: 80ms ease-out` (táctil inmediato)
- Confirmación correcto/incorrecto: CSS `transition: border-color 150ms, background-color 150ms`

#### Resultado de ronda
```javascript
gsap.timeline()
  .to(wrongOptions, { opacity: 0.15, duration: 0.2 })
  .to(correctOption, { scale: 1.12, duration: 0.3, ease: "expo.out" }, 0)
  .from(ownerLabel, { y: 20, opacity: 0, duration: 0.25, ease: "back.out(1.7)" }, 0.3)
  .from(scoreFloats, { scale: 0, opacity: 0, stagger: 0.1, ease: "elastic.out(1, 0.4)" }, 0.5)
```
- canvas-confetti burst pequeño al acertar
- Mini ranking se reordena con Motion `layout`

#### Fin de partida + reset
- GSAP timeline ganador: zoom, stagger cards, scale ganador, confetti 3s
- "Jugar otra vez": botón cambia a texto de confirmación 1.5s, luego los puntos hacen contador regresivo a 0 con GSAP `countTo`, luego transición al lobby

### 6.4 Principios

**Impacto sobre suavidad.** `elastic.out`, `back.out`, `expo.out` sobre `ease` genérico.
**Brevedad.** Ninguna animación de UI > 300ms. Secuencias narrativas: máx 1200ms.
**Nunca bloquear la interacción.** Las animaciones corren en paralelo con la lógica.
**`prefers-reduced-motion`:** Animaciones decorativas desactivadas. Funcionales simplificadas pero presentes. `gsap.globalTimeline.timeScale(0)` para desactivar todos los GSAP de golpe.

---

## 7. Herramientas prohibidas

| Herramienta | Por qué NO |
|---|---|
| **Next.js** | SSR innecesario; no soporta WebSockets en serverless |
| **Vercel** | No soporta WebSockets en Functions |
| **NestJS** | Requiere servidor siempre encendido |
| **Socket.io** | Pesado; los DO tienen WebSockets nativos |
| **Firebase / Supabase Realtime** | Vendor lock-in; tier gratuito limitado |
| **AWS / GCP / Azure** | Coste desde primer request en tiempo real |
| **PostgreSQL / MySQL** | No hay estado persistente; todo es efímero |
| **Express / Fastify** | No funcionan en Workers; usar Hono |
| **Redux / Redux Toolkit** | Boilerplate innecesario; usar Zustand |
| **GraphQL** | Overkill; REST + WebSockets es suficiente |
| **Three.js** | 160KB+ para un party game 2D |
| **Anime.js** | Ecosistema menor sin ventaja sobre GSAP |
| **Docker / Kubernetes** | No aplica en arquitectura edge serverless |
| **Axios** | Fetch nativo con TanStack Query es suficiente |
| **Styled Components / Emotion** | Usar Tailwind + shadcn; CSS-in-JS añade bundle |

---

## 8. Estructura de carpetas

```
photo-guesser/
│
├── frontend/
│   ├── src/
│   │   ├── features/
│   │   │   ├── sala/
│   │   │   │   ├── components/
│   │   │   │   │   ├── CreateRoom.tsx
│   │   │   │   │   ├── JoinRoom.tsx          ← v3.1: spec completa (Escenario A + B)
│   │   │   │   │   ├── ShareRoom.tsx
│   │   │   │   │   ├── RoomQR.tsx            ← usa <PolaroidFrame>
│   │   │   │   │   └── PrivacyNotice.tsx     ← v3.1: componente compartido entre JoinRoom y ShareRoom
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useSala.ts
│   │   │   │   └── store/
│   │   │   │       └── salaSlice.ts
│   │   │   │
│   │   │   ├── fotos/
│   │   │   │   ├── components/
│   │   │   │   │   ├── PhotoSelector.tsx     ← orquestador con Modo B como hero
│   │   │   │   │   ├── PhotoGrid.tsx
│   │   │   │   │   ├── RandomPickBtn.tsx     ← hero de la pantalla
│   │   │   │   │   ├── CategoryPicker.tsx    ← secundario
│   │   │   │   │   └── PhotoProgressBar.tsx  ← tira de cine
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── usePhotoRandom.ts
│   │   │   │   │   └── usePhotoUpload.ts
│   │   │   │   └── store/
│   │   │   │       └── fotosSlice.ts
│   │   │   │
│   │   │   ├── lobby/
│   │   │   │   ├── components/
│   │   │   │   │   ├── Lobby.tsx
│   │   │   │   │   ├── PlayerList.tsx
│   │   │   │   │   └── PlayerStatus.tsx
│   │   │   │   └── store/
│   │   │   │       └── lobbySlice.ts
│   │   │   │
│   │   │   └── juego/
│   │   │       ├── components/
│   │   │       │   ├── GameRound.tsx
│   │   │       │   ├── AnswerOptions.tsx
│   │   │       │   ├── Timer.tsx
│   │   │       │   ├── OwnerWaiting.tsx       ← v3.1: estado "foto es tuya" con puntos de luz
│   │   │       │   ├── ResponseDots.tsx       ← v3.1: los puntos de luz individuales
│   │   │       │   ├── RoundResult.tsx
│   │   │       │   ├── ScoreFloat.tsx
│   │   │       │   └── FinalRanking.tsx
│   │   │       ├── hooks/
│   │   │       │   ├── useGameSocket.ts
│   │   │       │   └── useRoundAnimation.ts
│   │   │       └── store/
│   │   │           └── juegoSlice.ts
│   │   │
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── JoinPage.tsx                   ← v3.1: nueva (Escenario B)
│   │   │   ├── SalaPage.tsx                   ← /sala/:code (Escenario A: pre-rellena código)
│   │   │   ├── LobbyPage.tsx
│   │   │   └── GamePage.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                            ← shadcn/ui overrideados
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── progress.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   └── toast.tsx
│   │   │   └── shared/
│   │   │       ├── PolaroidFrame.tsx           ← componente identitario reutilizable
│   │   │       ├── LoadingReveal.tsx           ← v3.1: estados de carga con animación cuarto oscuro
│   │   │       └── RotatePrompt.tsx            ← v3.1: aviso de orientación landscape mobile
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── share.ts
│   │   │   ├── random.ts
│   │   │   ├── animations.ts                  ← GSAP timelines reutilizables
│   │   │   ├── privacy.ts                     ← v3.1: gestión del flag pg_privacy_seen (localStorage)
│   │   │   └── utils.ts
│   │   │
│   │   ├── store/
│   │   │   └── index.ts
│   │   │
│   │   └── main.tsx
│   │
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── worker/
│   ├── src/
│   │   ├── index.ts
│   │   ├── GameRoom.ts                        ← state machine (incluye estado 'resetting')
│   │   ├── schemas.ts
│   │   └── utils.ts
│   ├── wrangler.toml
│   └── tsconfig.json
│
└── shared/
    └── schemas.ts                             ← incluye PLAYER_RESPONSE_COUNT y GAME_RESET
```

---

## 9. Eventos WebSocket — contrato completo

### Servidor → Clientes

```typescript
{ type: 'LOBBY_UPDATE',
  jugadores: Array<{ id, nickname, fotosListas, conectado, puntuacion }> }

{ type: 'GAME_START', totalRondas: number }

{ type: 'ROUND_START',
  rondaNum: number,
  fotoUrl: string,
  opciones: string[],
  timerMs: number }

// v3.1 — Solo se emite al propietario de la foto actual
{ type: 'PLAYER_RESPONSE_COUNT',
  count: number,    // cuántos han respondido (sin revelar qué)
  total: number }   // cuántos pueden responder en esta ronda

{ type: 'ROUND_RESULT',
  propietarioId: string,
  propietarioNickname: string,
  respuestasCorrectas: string[],
  puntosGanados: Record<string, number>,
  rankingRonda: Array<{ id, nickname, puntos, puntosTotal }> }

{ type: 'GAME_END',
  rankingFinal: Array<{ id, nickname, puntosTotal, fotosAdivinadas }> }

// v3.1 — Emitido a todos cuando el host confirma "Jugar otra vez"
{ type: 'GAME_RESET',
  nuevoCodigo?: string }  // Si el código cambia, los clientes deben actualizar la URL

{ type: 'PLAYER_DISCONNECTED', jugadorId: string, nickname: string }
{ type: 'PLAYER_RECONNECTED', jugadorId: string }
{ type: 'HOST_CHANGED', newHostId: string }
{ type: 'ERROR', code: string, message: string }
```

**Códigos de error estandarizados** (para que el frontend pueda mostrar mensajes específicos):
```typescript
'ROOM_NOT_FOUND'        → "Esta sala ya cerró o el código no es correcto."
'ROOM_FULL'             → "Esta sala ya tiene el máximo de jugadores."
'GAME_ALREADY_STARTED'  → "La partida ya empezó. Espera a la siguiente."
'INVALID_NICKNAME'      → "El nickname debe tener entre 1 y 20 caracteres."
'UPLOAD_FAILED'         → "No pudimos subir esa foto. Inténtalo de nuevo."
'INSUFFICIENT_PHOTOS'   → "Necesitas al menos 10 fotos para confirmar."
```

### Cliente → Servidor

```typescript
{ type: 'JOIN', nickname: string }
{ type: 'FOTOS_READY', fotoKeys: string[] }
{ type: 'START_GAME' }                          // solo host
{ type: 'ANSWER', propietarioId: string, tiempoMs: number }
{ type: 'PLAY_AGAIN' }                          // v3.1: solo host, después de GAME_END
```

---

## 10. Edge cases

| Situación | Comportamiento |
|---|---|
| Jugador se desconecta en lobby | Marcado ❌, puede reconectarse; sala continúa |
| Jugador se desconecta en partida | Sus respuestas se saltan; partida continúa; banner de reconexión visible para ese jugador |
| Host se desconecta | Rol pasa al primer jugador conectado; evento `HOST_CHANGED` |
| Sala no existe | Error `ROOM_NOT_FOUND` → pantalla de error con Polaroid en blanco |
| Código case-insensitive | Normalizar a uppercase en Worker |
| Jugador sube < 10 fotos | No puede confirmar; barra muestra cuántas faltan |
| Foto propia en una ronda | Skip automático; estado `OwnerWaiting` con puntos de luz |
| Presigned URL expirada | Worker genera nueva al inicio de cada ronda |
| Subida falla | Reintento ×2, luego toast de error con código `UPLOAD_FAILED` |
| Archivo no es imagen | Validación en cliente (`accept="image/*"`) + Worker (Zod + Content-Type) |
| Sala inactiva > 30 min | DO Alarm borra fotos R2 y cierra sala |
| Pool random < 10 fotos | Toast: "Necesitas al menos 10 fotos. Selecciona más desde tu galería." |
| Dispositivo en landscape mobile | `<RotatePrompt>` superpuesto con animación de rotación |
| Web Share API no disponible | El botón "Compartir" no aparece — degradación silenciosa |
| localStorage no disponible | `pg_privacy_seen` flag no se puede guardar → mostrar aviso siempre |
| `GAME_RESET` con nuevo código | El cliente actualiza la URL con `React Router navigate()` + muestra "¡Nueva sala! Comparte el nuevo código" |
| `PLAYER_RESPONSE_COUNT` count === total | Todos respondieron antes del timer → el DO puede adelantar el resultado (opcional) |

---

## 11. Privacidad y seguridad

- Aviso claro antes de la primera interacción que implique fotos: aparece al unirse a la sala (pantalla de nickname), gestionado con `localStorage` flag `pg_privacy_seen`. El creador lo ve en la pantalla de compartir.
- URLs de R2 son presigned con TTL 1h
- El Worker valida que el jugadorId pertenezca a la sala antes de generar cualquier URL
- Sin persistencia: nicknames y fotos solo existen mientras el DO está activo
- Validación doble: Zod en cliente (UX) y en Worker (seguridad)
- Rate limiting: máximo 10 salas creadas por IP/hora
- Tamaño máximo por foto: 5MB, validado en Worker
- `PLAYER_RESPONSE_COUNT` solo se emite al propietario de la foto, nunca a los demás jugadores — no se puede inferir las respuestas de los demás

---

*Fin del documento — versión 3.1*
*Changelog: flujo "Unirse a partida" especificado (Escenario A + B), aviso de privacidad reposicionado al momento de unirse con flag localStorage, evento WebSocket `PLAYER_RESPONSE_COUNT` añadido para estado "foto es tuya" con puntos de luz, jerarquía de selección de fotos con Modo B como hero, componentes nuevos `<OwnerWaiting>`, `<ResponseDots>`, `<LoadingReveal>`, `<RotatePrompt>`, `<PrivacyNotice>`, `<PolaroidFrame>` añadidos a la estructura de carpetas, estado `resetting` añadido a la state machine del DO, evento `PLAY_AGAIN` añadido al contrato cliente→servidor, evento `GAME_RESET` añadido al contrato servidor→clientes, códigos de error estandarizados, edge cases de orientación y Web Share API añadidos.*