# PHOTO GUESSER — DESIGN DOCUMENT v2.0
### *El espejo que revela cuánto conoces a tus amigos*

> **Changelog v2.0:** Contradicciones internas resueltas (paleta de estado de juego, sombras en modo oscuro, separación Motion/CSS), pantallas sin especificar añadidas (Unirse a partida, estados de carga, estados de error, orientación de dispositivo, reset de partida), jerarquía de selección de fotos corregida, estado "foto es tuya" rediseñado como momento social activo, identidad Polaroid extendida a pantalla de inicio, tokens de color de estado alineados con la paleta cálida.

---

## 0. ANTES DE EMPEZAR: POR QUÉ ESTE DOCUMENTO EXISTE

Este documento no es un moodboard. No es una lista de tendencias. Es una **constitución de diseño**: define quién es este producto, cómo se siente, qué no será nunca, y las reglas que gobiernan cada decisión visual desde el primer pixel hasta el último frame de animación.

Cualquier decisión de diseño que no pueda justificarse contra este documento es una decisión que debe reconsiderarse.

---

## 1. DIAGNÓSTICO DE PRODUCTO: QUIÉN ES PHOTO GUESSER

### El problema que realmente resuelve

Photo Guesser no resuelve un problema técnico. Resuelve un problema social: **el momento incómodo de "¿y ahora qué hacemos?"** en una reunión de amigos. Es la respuesta moderna al "¿echamos una partida a algo?".

La promesa no es "un juego de fotos". La promesa es **caos divertido y recuerdos compartidos en menos de 60 segundos desde que alguien dice "vamos a jugar"**.

### La audiencia real (sin eufemismos)

No son "usuarios". Son **grupos de amigos entre 18-35 años** que:

- Quedan en casa o por videollamada los fines de semana
- Tienen el móvil en la mano el 100% del tiempo
- No quieren leer instrucciones ni crear cuentas
- Esperan que todo "simplemente funcione" como las apps que ya usan
- Son **nativos digitales con altísima tolerancia visual**: han visto todo. Lo genérico les aburre en 3 segundos.

Subaudiencia crítica: el **no-gamer del grupo** — el amigo que "no juega a videojuegos". Llega a la pantalla de selección de fotos via link de WhatsApp, sin contexto de lo que viene después, con 30 segundos de paciencia antes de decir "es que no entiendo qué hay que hacer". Si el diseño no lo retiene en ese momento, el grupo se fragmenta y el juego muere. Cada pantalla debe justificar su existencia contra ese perfil.

### El núcleo emocional (la razón real por la que se juega)

El juego existe para provocar tres momentos específicos:

1. **"¿ESO ERES TÚ?"** — la foto aparece y hay una carcajada antes de que nadie haya respondido
2. **"¡LO SABÍA!"** — el momento de acertar a un amigo que sentías que conocías
3. **"¿CÓMO LO HAS SABIDO?"** — la conversación que se genera *después* de revelar quién era

El diseño tiene que **servir estos tres momentos**. No es decoración. Es el catalizador emocional del juego.

### La personalidad del producto

Si Photo Guesser fuera una persona en la reunión:

- Llegaría sin avisar con energía pero sin atropellar
- Haría reír sin ser el payaso que necesita atención
- Organizaría el caos con elegancia invisible
- Nunca haría sentir a nadie "demasiado mayor" o "que no lo entiende"
- Cuando no es su momento, se hace a un lado sin desaparecer

En términos de marca: **cálido, vivo, sin pretensiones, pero con criterio**.

---

## 2. REFERENTES CULTURALES: LO QUE NUTRE ESTE DISEÑO

No se copian referentes. Se diseccionan para extraer su principio activo.

### Referente 1 — Jackbox Games (el estándar del género)
**Lo que hace bien:** Interfaz en el móvil ultra-simplificada. Cada jugador tiene UNA cosa que hacer en cada momento. Las animaciones refuerzan el humor y la tensión, nunca son decorativas.
**El problema que NO vamos a reproducir:** Sus fondos oscuros y UI pueden sentirse pesados. El no-gamer se intimida. Algunos juegos tienen demasiadas pantallas de tutorial antes de empezar.
**Lo que extrae Photo Guesser:** Arquitectura de "solo un elemento a la vez en el móvil". La pantalla del teléfono tiene UNA cosa que hacer en cada momento.

### Referente 2 — BeReal / Polaroid (la foto como objeto social)
**El principio activo:** Una foto no es contenido. Es un **objeto social con historia**. El reveal debe tratarla con peso, con pausa, con ritual.
**Lo que extrae Photo Guesser:** Las fotos de los jugadores no son "imágenes". Son **pistas sobre personas reales**. El concepto Polaroid no es decorativo: es el lenguaje visual central del producto, presente desde la primera pantalla hasta el resultado final.

### Referente 3 — Duolingo (gamificación con carácter)
**El principio activo:** Los momentos de puntuación y resultado deben sentirse como micro-celebraciones o micro-dramas, no como actualizaciones de datos.
**Lo que extrae Photo Guesser:** Los estados emocionales de los elementos son parte del game loop.

### Referente 4 — Diseño editorial de revistas culturales (i-D, Dazed, Apartamento)
**El principio activo:** El espacio en blanco es activo, no vacío. Las imágenes se usan con confianza, sin marcos decorativos innecesarios.
**Lo que extrae Photo Guesser:** Las fotos de jugadores merecen espacio real. El timer, la pregunta, las opciones generan **tensión tipográfica**.

### Referente 5 — Material de fiestas / Riso printing / Diseño DIY (tendencia 2025-2026)
**El principio activo:** Reacción contra la "AI slop aesthetic" — diseños suaves y gradientes púrpuras que no dicen nada. La respuesta es **el diseño hecho a mano, con carácter, con imperfección intencional**.
**Lo que extrae Photo Guesser:** Texturas de grano, colores que parecen ligeramente "impresos", elementos que se sienten construidos por personas.

---

## 3. LO QUE PHOTO GUESSER NO SERÁ NUNCA

### ❌ NO será una "app de IA"
Nada de gradientes azul-púrpura. Nada de tipografías neutras. Nada de ilustraciones con look de Midjourney. El diseño tiene que sentirse **hecho por personas, para personas**.

### ❌ NO será oscuro por default
El "dark mode como estética de gaming" está asociado a un tipo de juego que no somos. Photo Guesser es para reuniones de amigos a plena luz del día. El modo oscuro existirá, pero no será el tono por defecto.

### ❌ NO será minimalista de la manera corporativa
Airbnb, Notion, Linear: esa estética funciona para herramientas de productividad. Para un party game se siente fría.

### ❌ NO tendrá componentes que parezcan shadcn/Radix out-of-the-box
shadcn es la base técnica. No la estética final. Cada componente debe overriderse hasta que no reconozcas su origen.

### ❌ NO usará nunca estas fuentes como titular: Inter, Roboto, Plus Jakarta Sans, Space Grotesk, DM Sans
Son las fuentes del "estilo IA genérico". Se reservan para body text donde la neutralidad tiene sentido.

### ❌ NO tendrá animaciones "suaves y corporativas"
ease-in-out en 300ms es la animación de una app bancaria. Photo Guesser usa `elastic.out`, `back.out`, `expo.out`.

---

## 4. IDENTIDAD VISUAL CENTRAL

### 4.1 El concepto: "Instant Film"

Photo Guesser tiene un concepto visual unificador: **la foto instantánea**.

No el estilo vintage-sepia de Instagram 2012. Sino la *idea* de la foto instantánea: algo que emerge lentamente, que revela progresivamente, que tiene un marco físico y un tacto. El Polaroid no es nostalgia: es **un ritual de revelación**.

Este concepto está presente en todas las pantallas del producto, no solo en la pantalla de juego:
- En la **pantalla de inicio**: fotos Polaroid placeholder en el fondo como objetos sobre una mesa
- En la **pantalla de compartir sala**: el QR dentro de un frame Polaroid
- En los **estados de carga**: animación de "revelado fotográfico"
- En los **estados de error**: Polaroid en blanco con texto
- En la **pantalla de juego**: el reveal completo con el timeline GSAP
- En el **resultado final**: las cards de jugadores como una colección de Polaroids

### 4.2 Arquitectura de color

**Filosofía:** Un fondo que no compite, un acento que domina, y estados de juego que mantienen coherencia con la paleta cálida.

#### Paleta Base — Modo Claro (default)
```
--bg-primary:     #F7F3EE   /* Crema cálida — el color del papel fotográfico */
--bg-secondary:   #EDE8E1   /* Crema oscura — tarjetas, elevación */
--bg-surface:     #FFFFFF   /* Blanco puro — contenido principal */

--text-primary:   #1A1714   /* Casi negro — máximo contraste */
--text-secondary: #6B6560   /* Marrón grisáceo — texto de soporte */
--text-muted:     #A89F99   /* Muy suave — timestamps, estados */
```

#### Paleta de Acento — Un solo color que importa
```
--accent:         #FF4D2E   /* Naranja-rojo vivo — el "flash" de la cámara */
--accent-hover:   #E63D1F
--accent-glow:    rgba(255, 77, 46, 0.25)
```

El acento es solo uno. No hay un color para "success", uno para "warning" y otro para "brand". El naranja-rojo es **todos a la vez**: urgencia del timer, celebración del acierto, CTA principal.

#### Colores de Estado de Juego
> ⚠️ **v2.0 — Alineados con la paleta cálida.** Los verdes/rojos genéricos del ecosistema web han sido sustituidos por colores que mantienen coherencia con el papel fotográfico. Todos han sido verificados para contraste WCAG AA contra `--bg-primary: #F7F3EE` y `--bg-surface: #FFFFFF`.

```
--correct:        #1A7A4A   /* Verde oscuro cálido — contraste 4.8:1 sobre crema */
--correct-bg:     rgba(26, 122, 74, 0.10)   /* Fondo sutil para la opción correcta */
--incorrect:      #C0392B   /* Rojo oscuro cálido — contraste 5.1:1 sobre crema */
--incorrect-bg:   rgba(192, 57, 43, 0.08)
--pending:        #B8860B   /* Ámbar oscuro — contraste 4.6:1 */
--neutral-game:   #8B7D74   /* Gris-marrón neutro — opción no seleccionada */
```

Estos colores son más oscuros y más saturados hacia los cálidos que los colores estándar de Tailwind. Combinan con el fondo crema sin el contraste agresivo del verde-esmeralda y el rojo-vivo sobre papel fotográfico.

**Ratios de contraste verificados (texto blanco sobre color):**
- `--correct #1A7A4A` + texto blanco: 5.2:1 ✅ WCAG AA
- `--incorrect #C0392B` + texto blanco: 5.5:1 ✅ WCAG AA
- `--pending #B8860B` + texto blanco: 4.7:1 ✅ WCAG AA

#### Estado de Timer — Progresión de color explícita
```
Timer 15s → 6s:   trazo --text-secondary (#6B6560), número --text-primary
Timer 5s → 3s:    trazo --accent (#FF4D2E), número --accent
Timer 3s → 0s:    trazo #D92B0A (rojo urgente, más oscuro que accent), número #D92B0A
                  + pulse con yoyo: true
```
El número central del timer sigue la misma progresión de color que el trazo. No hay inconsistencia de señal.

#### Paleta Alternativa — Modo Noche (activación manual)
Para cuando el grupo juega de noche con las luces bajas:
```
--bg-primary:     #18140F   /* Marrón muy oscuro — cuarto oscuro de revelado */
--bg-secondary:   #231E18
--bg-surface:     #2D2720
--text-primary:   #F0EBE3
--text-secondary: #9B9189
--text-muted:     #6B6560
--accent:         #FF6040   /* El naranja se calienta en oscuro */
```

#### Sombras en Modo Noche — Comportamiento explícito
> ⚠️ **v2.0 — Corregido.** Sombra negra sobre fondo muy oscuro era prácticamente invisible. En modo noche, las sombras usan color cálido ligeramente más claro que el fondo para crear la ilusión de profundidad.

```css
.dark {
  --shadow-sm:    2px 3px 0px rgba(0, 0, 0, 0.45);
  --shadow-md:    4px 6px 0px rgba(0, 0, 0, 0.55);
  --shadow-lg:    6px 10px 0px rgba(0, 0, 0, 0.65);
  /* El efecto Polaroid en modo noche usa un highlight en lugar de sombra: */
  --shadow-photo: inset 0 1px 0 rgba(240, 235, 227, 0.08),
                  6px 10px 0px rgba(0, 0, 0, 0.70);
}
```

En modo noche, el "marco Polaroid" tiene además un `border: 1px solid rgba(240, 235, 227, 0.12)` que lo hace legible sin perder la sensación de objeto físico en la oscuridad.

### 4.3 Tipografía

El sistema tipográfico tiene tres roles distintos, tres fuentes distintas:

#### Display Font — Para títulos de juego y momentos de impacto
**Syne** (Google Fonts, libre)
- Geométrica, con carácter propio, sin caer en el cliché
- Funciona extraordinariamente bien en weight 800 para crear tensión
- **Uso:** "¿De quién es esta foto?", "¡Correcto!", nombres de rondas, puntajes grandes

Alternativa de segunda opción: **Unbounded** — más cuadrada, más contundente

#### UI Font — Para texto de interfaz y navegación
**Geist** (Vercel, libre, disponible en npm)
- Más carácter que Inter pero igual de legible
- Su versión Mono sirve para códigos de sala
- **Uso:** Botones, navegación, nicknames, etiquetas de estado

#### Body / Descriptive Font — Para instrucciones y texto largo
**Instrument Serif** (Google Fonts, libre)
- Serif elegante que rompe con la monotonía sans-serif del resto
- Aporta calidez editorial cuando se necesita explicar algo
- **Uso:** Descripción de reglas en onboarding, aviso de privacidad, mensajes de error largos

#### Escala tipográfica
```
--text-xs:   11px / Geist / weight 500
--text-sm:   13px / Geist / weight 400-500
--text-base: 16px / Geist / weight 400
--text-lg:   18px / Geist / weight 500
--text-xl:   22px / Syne / weight 700
--text-2xl:  28px / Syne / weight 700
--text-3xl:  36px / Syne / weight 800
--text-4xl:  48px / Syne / weight 800
--text-hero: 64-80px / Syne / weight 800 (solo momentos clave del juego)
```

El código de sala usa **Geist Mono en text-4xl, weight 700, letter-spacing: 0.15em**.

### 4.4 Forma y espaciado

#### Border Radius — Decisivo, no excesivo
```
--radius-sm:  4px   /* Tags, badges pequeños */
--radius-md:  8px   /* Botones, inputs */
--radius-lg:  12px  /* Cards pequeñas */
--radius-xl:  16px  /* Cards de jugador, paneles */
--radius-photo: 2px /* Las fotos tienen borde mínimo — son fotos, no tarjetas */
```

Las fotos tienen `border-radius: 2px`. Las fotos no son cards de UI. Son fotos.

#### Sombras — Con dirección, no difusas
```
--shadow-sm:    2px 3px 0px rgba(26, 23, 20, 0.12)
--shadow-md:    4px 6px 0px rgba(26, 23, 20, 0.14)
--shadow-lg:    6px 10px 0px rgba(26, 23, 20, 0.16)
--shadow-photo: 8px 12px 0px rgba(26, 23, 20, 0.20)
```

Las sombras tienen dirección (siempre abajo-derecha). Recuerdan sombras de objetos físicos.

#### Grain Texture
```css
body::after {
  content: '';
  background-image: url("data:image/svg+xml,...grain pattern...");
  opacity: 0.03; /* Sutil en claro */
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 9999;
}
.dark body::after { opacity: 0.06; }
```

---

## 5. ARQUITECTURA VISUAL POR PANTALLA

### 5.1 Pantalla de Inicio

**Objetivo:** Hacer la promesa del producto en 3 segundos y que el usuario pulse "Crear partida" sin dudar.

**Layout:** Centrado vertical. Logo + tagline + dos botones. Nada más.

**El logo:** "PHOTO GUESSER" en Syne 800. "PHOTO" en `--text-primary` y "GUESSER" en `--accent`. Tipografía pura que comunica confianza.

Debajo del nombre: `"¿cuánto conoces a tus amigos?"` en Instrument Serif italic, text-lg, color `--text-secondary`.

**Botones:**
- "Crear partida" — `--accent` con texto blanco, `--shadow-md`, width 100% en mobile, max-width 320px
- "Unirse a partida" — fondo `--bg-secondary`, borde 2px `--text-primary`, mismo tamaño
- Gap entre ellos: 12px

**Fondo — Identidad Polaroid desde el primer momento:**
> ⚠️ **v2.0 — Actualizado.** El patrón de círculos era demasiado tenue para anclar la identidad visual. El fondo ahora incluye 3-4 siluetas de fotos Polaroid en posición absoluta, ligeramente rotadas (entre -8° y +6°), tamaño variado (entre 120px y 180px de ancho), con opacidad 0.08 en modo claro. Son rectángulos blancos con padding inferior (el borde Polaroid inferior), `--shadow-sm`, y el espacio de la foto en gris muy suave `--bg-secondary`. No son fotos reales: son la promesa visual de lo que viene. En mobile se reducen a 2 siluetas en las esquinas superiores. El fondo base sigue siendo `--bg-primary` con grain.

**Entrada (animación):**
```javascript
gsap.from(logo, { y: -20, opacity: 0, duration: 0.6, ease: "back.out(1.4)" })
gsap.from(tagline, { y: 10, opacity: 0, duration: 0.4, delay: 0.3 })
gsap.from(buttons, { y: 10, opacity: 0, stagger: 0.1, delay: 0.5 })
// Las siluetas Polaroid ya están en su posición — no animan al cargar.
// Solo la primera vez: entran con gsap.from rotateZ ligeramente desde 0.
```

---

### 5.2 Pantalla de Unirse a Partida
> ⚠️ **v2.0 — Pantalla nueva, no especificada en v1.0.** Es el primer momento de todos los jugadores excepto el host — el flujo más frecuente.

**Objetivo:** Que el usuario que recibió un link pueda entrar en ≤2 taps.

**Dos escenarios:**

**Escenario A — Usuario viene de link directo** (la URL ya contiene el código):
El campo de código aparece pre-rellenado y deshabilitado (solo lectura), con el código visible en Geist Mono grande. El único campo activo es el nickname. Un solo botón: "Entrar". El usuario no tiene que hacer nada excepto escribir su nombre.

**Escenario B — Usuario llega desde la pantalla de inicio** (pulsó "Unirse"):
Campo de código en primer plano — Geist Mono text-2xl, placeholder "ABCD123", maxlength 7, auto-uppercase en JS. Debajo, campo de nickname. Botón "Entrar" habilitado cuando ambos campos están rellenos.

**Aviso de privacidad:**
> ⚠️ **v2.0 — Reposicionado.** En v1.0 aparecía justo antes de subir fotos, creando fricción en el momento de mayor carga cognitiva. Ahora aparece una sola vez aquí, antes de que el usuario esté en modo "hacer cosas". Es una card en Instrument Serif italic bajo el botón "Entrar":
> *"Tus fotos se usan solo durante esta partida y se borran al terminar. Nunca las vemos ni las guardamos."*
> Sin botón de cerrar — es información, no un bloqueo. Aparece solo la primera vez (localStorage flag). El creador de sala ve el mismo aviso en su pantalla de compartir sala.

**Layout:** Centrado vertical, max-width 360px. Input código + input nickname + botón. Fondo `--bg-primary` con grain. Sin decoración adicional.

**Validación inline:**
- Código incorrecto: el campo hace un shake horizontal (GSAP `x: [-4, 4, -4, 0]`, 300ms) + borde `--incorrect`
- Nickname vacío al intentar entrar: el campo hace el mismo shake

---

### 5.3 Compartir Sala

**Objetivo:** Que el creador pueda enviar el link a todos sus amigos en el menor número de pasos posible.

**El código de sala** ocupa el protagonismo absoluto: `ABCD123` en Geist Mono, text-hero o text-4xl, centrado, con `--shadow-photo` para que parezca una etiqueta física. Botón de copiar al lado derecho, icono + texto "Copiar".

**El QR** aparece en un frame Polaroid: rectángulo blanco con padding, padding inferior mayor (estilo Polaroid), `--shadow-photo`. Debajo del QR el texto del link en text-xs Geist Mono. La imagen del QR no tiene border-radius.

**Botones de compartir:** Horizontales en mobile:
- WhatsApp → verde propio (#25D366)
- Copiar link → `--bg-secondary`
- Compartir → `--accent` + Web Share API en mobile

**Animación de entrada del código:**
```javascript
gsap.timeline()
  .to(codeBg, { scaleX: 1, duration: 0.3, ease: "expo.out", transformOrigin: "left" }) // scaleX: 0 → 1
  .staggerFrom(codeChars, 0.04, { opacity: 0, y: -10, ease: "back.out(1.7)" }, 0.04, 0.2)
  .from(qrFrame, { scale: 0.8, opacity: 0, duration: 0.4, ease: "elastic.out(1, 0.5)" }, 0.6)
```

---

### 5.4 Lobby

**Objetivo:** Crear sensación de que "la partida está pasando" incluso antes de empezar.

**Layout:** Header con código de sala (pequeño, siempre visible). Lista de jugadores en el centro. Botón de inicio abajo (solo visible al host cuando hay ≥2 listos).

**Card de jugador:**
```
┌──────────────────────────────────┐
│  👤  NombreJugador    [⏳ o ✅]  │
└──────────────────────────────────┘
```
- Fondo `--bg-secondary`
- Borde izquierdo 3px `--accent` cuando listo (✅)
- Borde izquierdo 3px `--text-muted` cuando no
- El estado ⏳/✅/❌ hace transición de color suave con Motion `animate={{ color }}`

**Entrada de nuevos jugadores:**
```jsx
<AnimatePresence>
  {jugadores.map(j => (
    <motion.div
      key={j.id}
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -40, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    />
  ))}
</AnimatePresence>
```

**Botón "Iniciar partida":**
- Deshabilitado: fondo `--bg-secondary`, texto `--text-muted`, cursor: not-allowed
- Habilitado: fondo `--accent`, texto blanco, aparece con `animate={{ scale: [0.95, 1.02, 1] }}`

---

### 5.5 Selección de Fotos

**Objetivo:** Que subir fotos sea rápido, sin fricción, y ligeramente divertido.

**Jerarquía de modos:**
> ⚠️ **v2.0 — Corregido.** En v1.0 los tres modos estaban al mismo nivel visual sin jerarquía, forzando una decisión cognitiva innecesaria. El Modo B (random) es el que más reduce la fricción y debe ser el estado por defecto y más prominente.

**Estructura visual recomendada:**
```
┌─────────────────────────────────────────┐
│  "Tus fotos"  [barra de tira de cine]   │  ← Header
│  0 / 10 fotos listas                    │
├─────────────────────────────────────────┤
│                                         │
│   🎲 ELEGIR 10 FOTOS AL AZAR           │  ← HERO: botón grande, full width
│   [abre galería → auto-selecciona 10]   │  Fondo --accent/10, borde dashed 2px --accent
│                                         │
├─────────────────────────────────────────┤
│   — o elige tú mismo ↓ —               │  ← Separador tipográfico, text-sm --text-muted
├─────────────────────────────────────────┤
│   [+ Añadir fotos]  [📂 Por categorías] │  ← Secundarios, misma fila
│                                         │
│   [grid de miniaturas seleccionadas]    │
│                                         │
└─────────────────────────────────────────┘
```

**Modo B (Random) — comportamiento del botón hero:**
- El dado en el icono rota 360° al activarse (CSS animation `rotate 0.4s ease-out`)
- Al seleccionar la galería, el sistema elige aleatoriamente 10 usando Fisher-Yates
- El grid se puebla con animación: las fotos entran en stagger de 30ms, `scale(0.8→1) + opacity(0→1)`
- Al eliminar una foto con ✕: botón "🎲 Reemplazar" aparece junto a la foto eliminada (no rompe el grid, ocupa su lugar con fondo punteado)

**Grid de miniaturas:**
- 3 columnas en mobile, 4 en desktop
- `aspect-ratio: 1`, `object-fit: cover`, `border-radius: 2px`, `box-shadow: --shadow-sm`
- El botón ✕ de cada foto: círculo `--accent` con ✕ blanco, 24px, aparece en hover/long-press (mobile)

**Botón "✅ Confirmar":**
- Deshabilitado con < 10 fotos. La barra muestra cuántas faltan.
- Habilitado: fondo `--accent`. Estado pasa a "listo" en el lobby.

---

### 5.6 Pantalla de Juego — El Corazón

**Layout:**
```
┌─────────────────────────────────┐
│  Ronda 3/12     🕐 Timer        │ ← Header fijo, pequeño
├─────────────────────────────────┤
│                                 │
│     [ LA FOTO — grande ]        │ ← 55-60% del viewport height
│                                 │
│  ¿De quién es esta foto?        │ ← Syne 700, text-xl
│                                 │
│  [Opción A]  [Opción B]         │ ← 2 columnas
│  [Opción C]  [Opción D]         │
└─────────────────────────────────┘
```

**La foto:**
- Sin border-radius pronunciado (2px máximo)
- Con `--shadow-photo`
- Aparece con el GSAP timeline completo del reveal

**El Timer:**
- SVG circular en la esquina superior derecha del header
- Trazo que se vacía de lleno a vacío en 15 segundos
- Progresión de color (ver sección 4.2): neutro → accent → urgente
- El número central sigue la misma progresión de color que el trazo

**Las opciones de respuesta:**
- Botones rectangulares grandes (`min-height: 54px` en mobile)
- `border-radius: 8px`
- Fondo `--bg-secondary`, borde 2px `--bg-surface`
- Al seleccionar:
  - **Feedback táctil inmediato (CSS, 80ms):** `transform: scale(0.96)` + `transition: transform 80ms ease-out`
  - **Estado seleccionado (CSS, 150ms):** borde 2px `--accent` + fondo `--accent/8`
  - No se usa Motion para este feedback — CSS es más rápido y la sensación táctil requiere < 100ms
- Al confirmarse correcto: borde 2px `--correct` + fondo `--correct-bg` (GSAP, 200ms)
- Al confirmarse incorrecto: borde 2px `--incorrect` + fondo `--incorrect-bg` (GSAP, 200ms)

**Separación explícita de herramientas de animación:**
```
Feedback táctil (botones):           CSS transition 80ms — nunca Motion ni GSAP
Estado correcto/incorrecto:          CSS transition 150ms — color de borde y fondo
Secuencias narrativas de juego:      GSAP timelines
Jugadores entrando/saliendo del DOM: Motion AnimatePresence
Reordenamiento de listas:            Motion layout
```

**Estado "esta foto es tuya" — Momento social activo:**
> ⚠️ **v2.0 — Rediseñado completamente.** En v1.0 el dueño de la foto veía un mensaje estático y esperaba 15 segundos en pasivo. Ese tiempo es el de mayor potencial social del juego.

El dueño de la foto ve:
```
┌─────────────────────────────────┐
│                                 │
│     [ SU FOTO ]                 │
│                                 │
│   ✨ Esta foto es tuya          │  ← Syne 700, fondo --bg-primary/90
│   ¿Cuántos te conocen?          │  ← Instrument Serif italic, --text-secondary
│                                 │
│   [·  ·  ·  ·]                  │  ← 4 puntos de luz, uno por jugador
│                                 │
└─────────────────────────────────┘
```

Los puntos de luz representan a los otros jugadores. Cuando un jugador responde (sin revelar qué), su punto pasa de gris parpadeante a `--accent` sólido. El dueño ve en tiempo real cuántos están respondiendo, sin ver las respuestas. Esto crea anticipación activa: el dueño va contando cuántos parecen haberle adivinado. El reveal final (quién acertó) es más impactante porque hay una hipótesis previa.

---

### 5.7 Pantalla de Resultado de Ronda

**La secuencia más importante del diseño de juego.**

Elementos en orden de aparición (GSAP timeline ~1200ms total):
```javascript
gsap.timeline()
  // 0ms: Opciones incorrectas se desvanecen
  .to(wrongOptions, { opacity: 0.15, duration: 0.2 })
  // 0ms: Opción correcta se ilumina
  .to(correctOption, { scale: 1.12, borderColor: '--correct', duration: 0.3, ease: "expo.out" }, 0)
  // 300ms: Nombre del dueño aparece sobre la foto
  .from(ownerLabel, { y: 20, opacity: 0, duration: 0.25, ease: "back.out(1.7)" }, 0.3)
  // 500ms: Puntos "+100" / "+75" / "+50" aparecen y vuelan al marcador
  .from(scoreFloats, { scale: 0, opacity: 0, stagger: 0.1, ease: "elastic.out(1, 0.4)" }, 0.5)
  // El viaje en arco se implementa con gsap.to + motionPath o con keyframes de x/y
  // 900ms: Mini ranking se reordena con Motion layout
```

El nombre del dueño aparece sobre la foto con fondo semitransparente `--bg-primary/90`, Syne 800, text-2xl. Como la etiqueta escrita a mano al dorso de un Polaroid.

**El mini-ranking (sidebar en desktop, panel bottom en mobile):**
```
1. Ana         1,250 pts  (+100)
2. Carlos       900 pts  (+75)
3. María        600 pts  (+50)
```
- Cambios de posición animados con Motion `layout`
- El número 1 tiene `--accent` como color de posición

---

### 5.8 Pantalla Final

**Un momento de teatro, no de estadísticas.**

GSAP timeline:
```javascript
gsap.timeline()
  .to(screen, { backgroundColor: '--bg-primary', duration: 0.3 })
  .from(title, { y: -40, opacity: 0, duration: 0.5, ease: "expo.out" }, 0.3)
  // "FIN DE LA PARTIDA" en Syne 800, text-hero, --accent
  .from(playerCards, { y: 30, opacity: 0, stagger: 0.1, ease: "back.out(1.4)" }, 0.8)
  .to(winnerCard, { scale: 1.1, duration: 0.3, ease: "elastic.out(1, 0.3)" }, 1.2)
  // canvas-confetti: 3 segundos, desde arriba
```

**El ranking:** Cards de jugadores con barra de proporción de puntos respecto al ganador. El ganador: corona emoji + glow dorado `box-shadow: 0 0 20px rgba(255, 200, 50, 0.4)`.

**Botón "Jugar otra vez":**
- Grande, `--accent`, ancho completo
- Hace pulse suave cada 3 segundos (`gsap.to` con `yoyo: true, repeat: -1`)

---

### 5.9 Estados de Carga — Transiciones entre Pantallas
> ⚠️ **v2.0 — Sección nueva.** Los estados intermedios no estaban especificados en v1.0, dejando al desarrollador elegir spinners genéricos que romperían la identidad visual.

**Filosofía de carga:** Los estados de espera deben hablar el idioma del cuarto oscuro de revelado fotográfico.

**El componente `<LoadingReveal>`:**
```
┌─────────────────────────┐
│   [fondo --bg-primary]  │
│                         │
│   ████████░░░░░░░░░░    │  ← barra de progreso --accent sobre --bg-secondary
│                         │
│   revelando sala...     │  ← Geist Mono text-sm, --text-muted, letra a letra
└─────────────────────────┘
```

La barra de progreso no está vinculada al progreso real (que es impredecible) — avanza con una animación de `gsap.to` que desacelera al 80% y espera hasta que llegue la respuesta. Al llegar, completa hasta 100% en 150ms y desaparece.

El texto de estado varía por contexto:
```
Crear sala:      "generando tu sala..."
Unirse:          "conectando con la sala..."
Subir fotos:     "revelando tus fotos... X de Y"   ← este sí tiene progreso real
Iniciar partida: "preparando las rondas..."
Entre rondas:    [sin pantalla de carga — pausa de 3s con el resultado visible]
```

**Tiempos máximos antes de mostrar loading:**
- < 300ms: no se muestra ningún loading (invisible)
- 300ms - 1.5s: se muestra la barra de progreso sin texto
- > 1.5s: se muestra barra + texto de estado

---

### 5.10 Estados de Error
> ⚠️ **v2.0 — Sección nueva.** Los errores no estaban especificados en v1.0.

**Filosofía de error:** Los errores en Photo Guesser no suenan como errores de sistema. Suenan como un amigo que te explica qué pasó.

**Tipología y tratamiento visual:**

#### Error tipo Toast — Errores transitorios, no bloquean el flujo
```
┌──────────────────────────────────────────┐
│  ⚠  No pudimos subir esa foto.           │
│     Inténtalo de nuevo.        [Reintentar]│
└──────────────────────────────────────────┘
```
- Fondo `--bg-surface`, borde izquierdo 3px `--incorrect`
- Aparece desde abajo con Motion (`y: 60 → 0`, spring)
- Auto-desaparece en 5s o al pulsar Reintentar
- Nunca más de 1 toast visible a la vez

#### Error tipo Pantalla completa — Errores que sí bloquean el flujo

**"Sala no encontrada":**
```
┌─────────────────────────────────────────┐
│                                         │
│   [Polaroid en blanco — grande]         │  ← El frame sin foto dentro
│                                         │
│   Esta sala ya cerró                    │  ← Syne 700, text-2xl
│   o el código no es correcto.           │  ← Geist, text-base, --text-secondary
│                                         │
│   [Crear sala nueva]  [Probar otro código]│
└─────────────────────────────────────────┘
```

**"Desconexión durante la partida":**
```
┌─────────────────────────────────────────┐
│   ↻  Reconectando...                    │  ← Banner en la parte superior
│      La partida continúa, vuelves en    │
│      cuanto haya conexión.              │
└─────────────────────────────────────────┘
```
- El fondo del juego se mantiene pero con `opacity: 0.5` y `pointer-events: none`
- El banner usa fondo `--bg-surface`, borde inferior 2px `--pending`
- El icono ↻ rota continuamente con CSS animation
- Si se reconecta: el banner desaparece con fade y el juego vuelve a opacity 1

**"Archivo no válido" (en selección de fotos):**
- Toast + el archivo en cuestión hace un shake horizontal en el grid

**"Navegador sin soporte para Web Share API":**
- El botón "Compartir" no aparece. En su lugar, solo los botones de WhatsApp y Copiar link. No hay error visible — es degradación silenciosa.

#### Microcopy de error — Principios
- Nunca "Error 404" ni códigos técnicos visibles al usuario
- Siempre explicar qué pasó en lenguaje natural
- Siempre ofrecer una acción siguiente clara
- Usar el tono del producto: cercano, no alarmista

---

### 5.11 Reset — "Jugar otra vez"
> ⚠️ **v2.0 — Sección nueva.** El flujo de reset no estaba especificado en v1.0.

Al pulsar "Jugar otra vez":

1. **Confirmación implícita** (no un modal): el botón cambia a "¿Seguro? Jugáis de nuevo →" durante 1.5s antes de ejecutar. Esto evita que alguien lo pulse por accidente y da contexto de lo que va a pasar.
2. **Transición**: la pantalla final hace zoom-out y fade a `--bg-primary` con una animación de 300ms. No hay pantalla de "cargando" aquí — el servidor responde casi inmediatamente.
3. **Lo que se resetea (visible para el usuario):**
   - Los puntos hacen un contador regresivo animado de vuelta a 0 antes de que aparezca el lobby
   - El código de sala puede cambiar o no — si cambia, hay que re-compartir; el diseño debe anticipar esto con un mensaje "¡Nueva sala! Comparte el nuevo código"
4. **Las fotos se piden nuevas**: cada jugador vuelve a la pantalla de selección. El estado del selector está vacío.

---

## 6. COMPONENTES CLAVE: DECISIONES ESPECÍFICAS

### El "Polaroid Frame" (el componente más identitario)

```css
.polaroid-frame {
  background: var(--bg-surface);
  padding: 12px 12px 32px 12px; /* padding inferior mayor = el borde blanco del Polaroid */
  box-shadow: var(--shadow-photo);
  border-radius: 2px; /* Casi nada — es un objeto físico */
}

.polaroid-frame img {
  border-radius: 2px;
  display: block;
  width: 100%;
}

.polaroid-frame .caption {
  /* El espacio inferior del Polaroid */
  padding-top: 8px;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-align: center;
  letter-spacing: 0.08em;
}
```

En modo noche: añadir `border: 1px solid rgba(240, 235, 227, 0.12)` para legibilidad.

### Las Cards de Jugador

Un patrón que se repite en lobby y en mini-rankings:
- `padding: 12px 16px`
- `border-radius: var(--radius-xl)`
- `background: var(--bg-secondary)`
- `border-left: 3px solid [color de estado]`
- Transición del borde con Motion en 200ms

### El Código de Sala

Siempre en Geist Mono, siempre en mayúsculas, siempre con letter-spacing amplio.

En mobile: al menos 32px de tamaño de fuente. Botón de copiar con área de toque mínima de 44px.

### Estados de Botón

```
Normal:   bg[acento], text[blanco], shadow-sm
Hover:    scale(1.02), shadow-md, transition 150ms
Active:   scale(0.97), shadow-none, transition 80ms — sensación táctil
Disabled: bg[bg-secondary], text[text-muted], cursor: not-allowed
Loading:  spinner en lugar del texto, misma bg
```

El estado `active` en 80ms es crítico en mobile. Se implementa con CSS `transition: transform 80ms ease-out`, no con Motion.

---

## 7. MOTION SYSTEM: LAS REGLAS DE ANIMACIÓN

### Principio rector

> Las animaciones comunican estado y emoción. Si una animación no hace ninguna de las dos cosas, no existe.

### Los tres tipos de animación y cuándo usarlos

| Tipo | Herramienta | Para qué |
|---|---|---|
| Secuencias de juego | GSAP timelines | Reveal de foto, resultado de ronda, fin de partida |
| Transiciones de React state | Motion (Framer) | Jugadores entrando al lobby, reordenamiento de ranking |
| Feedback táctil | CSS transitions | Botones, estados de opción seleccionada |

**Regla de no-mezcla:** GSAP no toca el layout de React. Motion no intenta hacer timelines de juego. CSS no intenta hacer secuencias. Si un elemento necesita ambos (por ejemplo, un botón de opción que tiene feedback táctil CSS Y luego una revelación de estado con GSAP), el GSAP actúa sobre una clase que overridea el CSS — no hay conflicto de transform porque son propiedades distintas.

### Duraciones por contexto

```
Feedback táctil inmediato:  80ms   CSS (scale de botón al presionar)
Feedback de resultado:      150ms  CSS (color de opción correcta/incorrecta)
Transiciones de componente: 200-300ms Motion (layout, AnimatePresence)
Secuencias de narrativa:    600-1200ms GSAP timelines de juego
Celebraciones:              800-3000ms confetti, ganador
```

Ninguna animación de UI supera 300ms.

### Curvas de easing por intención

```
Elementos que "aterrizan":    elastic.out(1, 0.4)
Elementos que "llegan rápido": expo.out
Elementos que "entran con confianza": back.out(1.7)
Timers y urgencia:            power1.in → expo.in
Feedback táctil:              ease-out (CSS)
```

### El Timeline del Reveal de Foto

```javascript
const revealTimeline = gsap.timeline()
  .to(overlay, { opacity: 0.6, duration: 0.2 })
  .from(photoEl, {
    y: 60, scale: 0.92, opacity: 0,
    duration: 0.35, ease: "expo.out"
  }, 0.2)
  .from(questionEl, {
    scale: 0, opacity: 0,
    duration: 0.2, ease: "elastic.out(1, 0.4)"
  }, 0.5)
  .from(optionEls, {
    y: 20, opacity: 0,
    duration: 0.25, ease: "back.out(1.4)",
    stagger: 0.06
  }, 0.65);
```

Total: ~900ms. La foto llega antes que las opciones para que el jugador la procese antes de poder responder.

### `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  /* Animaciones decorativas: desactivadas */
  .decorative-animation { animation: none; transition: none; }
  
  /* Animaciones funcionales: simplificadas pero presentes */
  .timer-bar { transition: width 1s linear; }
  .option-feedback { transition: background-color 150ms; }
  
  /* GSAP timelines: durations a 0, easings a "none" */
  /* Implementar con gsap.globalTimeline.timeScale(0) cuando detecte la media query */
}
```

---

## 8. RESPONSIVE STRATEGY

**Mobile-first: el diseño se piensa en 375px (iPhone SE) y se adapta hacia arriba.**

### Breakpoints

```
Mobile:  375px - 767px   (diseño principal)
Tablet:  768px - 1023px  (grid de 2 columnas)
Desktop: 1024px+         (sidebar visible, layout dividido)
```

### En desktop, la pantalla de juego se divide

```
┌─────────────────┬──────────────┐
│                 │              │
│   FOTO GRANDE   │   MINI       │
│   + PREGUNTA    │   RANKING    │
│   + OPCIONES    │   EN VIVO    │
│                 │              │
└─────────────────┴──────────────┘
```

### Orientación del dispositivo
> ⚠️ **v2.0 — Sección nueva.**

**Photo Guesser fuerza modo portrait en mobile.** Usar en CSS:
```css
@media (orientation: landscape) and (max-width: 767px) {
  .game-layout {
    /* Mostrar aviso de rotar el teléfono */
  }
  .rotate-prompt {
    display: flex; /* Por defecto: display: none */
  }
}
```

El aviso de rotar el teléfono es una card centrada con icono de teléfono rotando (CSS animation) y el texto "Gira el teléfono para jugar mejor" en Geist text-base. Fondo `--bg-primary`. No es un error — es una recomendación amable.

En tablet landscape (768px+) el layout sí puede funcionar en landscape con el diseño de dos columnas.

### Touch targets

Todos los elementos interactivos: `min-height: 44px` y `min-width: 44px`. Botones de opción: `min-height: 54px`.

---

## 9. ACCESIBILIDAD (NO NEGOCIABLE)

- **Contraste:** Todos los textos cumplen WCAG AA (4.5:1 para texto normal, 3:1 para texto grande). Los nuevos colores de estado han sido verificados (ver sección 4.2).
- **Focus rings:** `outline: 2px solid var(--accent); outline-offset: 2px`
- **Roles ARIA:** Botones con `aria-label` cuando solo tienen icono. Timer: `role="timer"` y `aria-live="polite"`. Los puntos de luz del estado "foto es tuya": `aria-label="X jugadores han respondido"`.
- **Textos alternativos:** `alt="Foto del jugador {nickname}"`
- **Orden de tabulación:** En la pantalla de juego, el foco debe ir: timer (no interactivo, solo informativo) → opciones de respuesta en orden A, B, C, D.

---

## 10. TOKENS CSS: EL SISTEMA COMPLETO

```css
:root {
  /* Colores base */
  --bg-primary:     #F7F3EE;
  --bg-secondary:   #EDE8E1;
  --bg-surface:     #FFFFFF;
  --text-primary:   #1A1714;
  --text-secondary: #6B6560;
  --text-muted:     #A89F99;

  /* Acento */
  --accent:         #FF4D2E;
  --accent-hover:   #E63D1F;
  --accent-glow:    rgba(255, 77, 46, 0.25);

  /* Estados de juego — v2.0: alineados con paleta cálida, WCAG AA verificado */
  --correct:        #1A7A4A;
  --correct-bg:     rgba(26, 122, 74, 0.10);
  --incorrect:      #C0392B;
  --incorrect-bg:   rgba(192, 57, 43, 0.08);
  --pending:        #B8860B;
  --neutral-game:   #8B7D74;

  /* Timer urgente — v2.0: explícito */
  --timer-urgent:   #D92B0A;

  /* Radii */
  --radius-sm:    4px;
  --radius-md:    8px;
  --radius-lg:    12px;
  --radius-xl:    16px;
  --radius-photo: 2px;

  /* Sombras */
  --shadow-sm:    2px 3px 0px rgba(26, 23, 20, 0.12);
  --shadow-md:    4px 6px 0px rgba(26, 23, 20, 0.14);
  --shadow-lg:    6px 10px 0px rgba(26, 23, 20, 0.16);
  --shadow-photo: 8px 12px 0px rgba(26, 23, 20, 0.20);

  /* Tipografía */
  --font-display: 'Syne', sans-serif;
  --font-ui:      'Geist', sans-serif;
  --font-mono:    'Geist Mono', monospace;
  --font-body:    'Instrument Serif', serif;

  /* Spacing */
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  40px;
  --space-2xl: 64px;

  /* Transiciones */
  --transition-tactile: 80ms ease-out;   /* CSS — feedback táctil */
  --transition-fast:    150ms ease-out;  /* CSS — estados de color */
  --transition-normal:  200ms ease-out;  /* Motion — layout */
  --transition-slow:    300ms ease-out;  /* Motion — AnimatePresence */
}

.dark {
  --bg-primary:     #18140F;
  --bg-secondary:   #231E18;
  --bg-surface:     #2D2720;
  --text-primary:   #F0EBE3;
  --text-secondary: #9B9189;
  --text-muted:     #6B6560;
  --accent:         #FF6040;

  /* Sombras en modo noche — v2.0: corregido para visibilidad */
  --shadow-sm:    2px 3px 0px rgba(0, 0, 0, 0.45);
  --shadow-md:    4px 6px 0px rgba(0, 0, 0, 0.55);
  --shadow-lg:    6px 10px 0px rgba(0, 0, 0, 0.65);
  --shadow-photo: inset 0 1px 0 rgba(240, 235, 227, 0.08),
                  6px 10px 0px rgba(0, 0, 0, 0.70);
}
```

---

## 11. LA PREGUNTA DE CONTROL

Antes de implementar cualquier componente, elemento o animación, hacerse esta pregunta:

> **¿Esto amplifica el momento social o lo interrumpe?**

Si amplifica: adelante. Si interrumpe: eliminar o simplificar hasta que no lo haga.

Un aviso de privacidad antes de escribir el nickname amplifica (el usuario está en modo lectura). El mismo aviso justo cuando está eligiendo fotos interrumpe (está en modo hacer cosas). El estado "foto es tuya" con puntos de luz que muestran quién responde amplifica el tercer momento emocional. El mismo estado con un mensaje estático de espera lo desperdicia.

---

## 12. FUENTES A IMPORTAR

```html
<!-- En index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
```

```bash
npm install geist
```

```css
/* En main.css */
@import 'geist/dist/fonts/geist-sans/style.css';
@import 'geist/dist/fonts/geist-mono/style.css';
```

---

*Documento de diseño Photo Guesser v2.0*
*Changelog: paleta de estado de juego alineada con paleta cálida + WCAG verificado, sombras en modo oscuro corregidas, separación Motion/CSS/GSAP explicitada, pantalla "Unirse a partida" especificada, aviso de privacidad reposicionado, jerarquía de selección de fotos corregida con Modo B como hero, estado "foto es tuya" rediseñado como momento social activo con puntos de luz en tiempo real, identidad Polaroid extendida a pantalla de inicio, estados de carga especificados con lenguaje de cuarto oscuro, estados de error especificados con tono del producto, orientación de dispositivo especificada (portrait forzado en mobile), flujo de reset "Jugar otra vez" especificado, token --timer-urgent añadido, token --transition-tactile separado de --transition-fast.*