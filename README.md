# 📸 Photo Guesser

> **¿Cuánto conoces a tus amigos?**  
> Un party game para grupos de 3–10 personas. Sin instalar nada. Sin crear cuenta. Jugando en menos de 60 segundos.

---

## ¿Qué es Photo Guesser?

Photo Guesser es un juego social multijugador en tiempo real donde cada jugador sube sus propias fotos y el resto del grupo intenta adivinar de quién es cada imagen. El contenido es personal, los momentos son únicos y las risas están garantizadas.

No es un juego de habilidad. Es un **espejo social**: revela cuánto conoces realmente a la gente con la que juegas.

---

## Cómo se juega

1. **Alguien crea una sala** → recibe un código tipo `ABCD123`
2. **El resto se une** con el código, un link o escaneando el QR
3. **Cada jugador sube sus fotos** (mínimo 10, máximo 20)
4. **Empieza la partida** → aparece una foto, 4 opciones, 15 segundos para responder
5. **Puntos por velocidad** → quien más rápido y mejor adivina, gana
6. **Al acabar las fotos** → ranking final, confetti, y opción de jugar otra vez

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite 6 + TypeScript 5 |
| Estilos | Tailwind CSS 4 + shadcn/ui |
| Estado | Zustand 5 (slices por dominio) |
| Fetching | TanStack Query 5 |
| Animaciones | GSAP (juego) + Motion/Framer (layout) + canvas-confetti |
| Validación | Zod 3 (compartido cliente ↔ servidor) |
| Backend | Cloudflare Workers + Hono 4 |
| Tiempo real | Durable Objects + WebSockets nativos |
| Storage | Cloudflare R2 (borrado automático al terminar) |
| Deploy | Cloudflare Pages |

---

## Arquitectura

```
Frontend (Vite SPA)
    │
    ├── HTTP (REST)  →  Cloudflare Worker (Hono)
    │                        │
    └── WebSocket   →  Durable Object (1 por sala)
                             │
                        Cloudflare R2 (fotos temporales)
```

El estado de cada sala vive en un **Durable Object**: gestiona la máquina de estados del juego, los WebSockets de todos los jugadores, la lógica de rondas y la puntuación. Las fotos se almacenan en R2 con URLs firmadas y se borran automáticamente al terminar la partida.

---

## Sistema de puntuación

| Resultado | Puntos |
|---|---|
| Correcto en < 5s | +100 |
| Correcto en 5–10s | +75 |
| Correcto en 10–15s | +50 |
| Incorrecto | 0 |
| Es tu propia foto | — (skip automático) |

---

## Estructura del proyecto

```
photo-guesser/
├── frontend/
│   └── src/
│       ├── features/
│       │   ├── sala/        # Crear sala, unirse, compartir (QR, WhatsApp...)
│       │   ├── fotos/       # Selector manual, aleatorio y por categorías
│       │   ├── lobby/       # Lista de jugadores en tiempo real
│       │   └── juego/       # Rondas, timer, resultados, ranking
│       ├── pages/
│       ├── components/ui/   # shadcn/ui customizado
│       └── lib/             # API client, animaciones GSAP, utilidades
├── worker/
│   └── src/
│       ├── index.ts         # Hono router
│       ├── GameRoom.ts      # Durable Object
│       └── schemas.ts       # Zod schemas
└── shared/
    └── schemas.ts           # Tipos compartidos frontend ↔ worker
```

---

## Privacidad

Las fotos se usan **únicamente durante la partida** y se borran automáticamente de Cloudflare R2 al terminar. No se guardan, no se analizan, no se comparten. Las URLs de descarga son firmadas con TTL de 1 hora y solo accesibles con el token correcto.

---

## Desarrollar en local

```bash
# Instalar dependencias
cd frontend && npm install
cd ../worker && npm install

# Arrancar frontend
cd frontend && npm run dev

# Arrancar worker (requiere Wrangler)
cd worker && npx wrangler dev
```

Requiere una cuenta de Cloudflare con Workers, Durable Objects y R2 habilitados (todos disponibles en el tier gratuito).

---

## Documentación

- [`PRODUCT.md`](./PRODUCT.md) — Especificación técnica completa (arquitectura, flujos, contratos WebSocket, edge cases)
- [`DESIGN.md`](./DESIGN.md) — Sistema de diseño (paleta, tipografía, animaciones, componentes)

---

## Licencia

MIT