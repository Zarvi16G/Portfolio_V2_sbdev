---
name: portfolio-3d-hero
description: Build or change the 3D portfolio of santiagoboada.dev (React + Vite + Three.js + React Three Fiber + Drei): the room with the cartoon desk setup, the curved porcelain name, the keycap section keys, the projector-beam category tiles and the five sections (Skills die, Projects, Experience coin board, About badge, Contact envelope).
---

# santiagoboada.dev: 3D portfolio

Use this skill whenever you work on Santiago Boada's portfolio. It is the approved, final design. Build it step by step in React, show each step running, and keep every locked decision unless Santiago asks to change it.

## The reference implementation (read it)

The whole design already works as ONE plain Three.js + HTML file: `reference.html`, next to this SKILL.md (`.claude/skills/portfolio-3d-hero/reference.html`). It is also the claude.ai artifact "SantiagoBoada.dev Name". **It is the source of truth for every number, color, shader and animation.** Your job is to port it to React + R3F, not to redesign it. If `reference.html` is missing, ask Santiago for it before building.

How to read it:

| Part | Where in reference.html |
|---|---|
| All CSS (keys, tiles, sections, bubbles) | the `<style>` block; each part starts with `/* ---- Name ---- */` |
| Name scene (porcelain letters, crackle texture, curve) | 1st `<script type="module">` |
| Room, desk setup, bubbles, watering, tile beams, keys API | 2nd module: `// ===== The room`, `// ---- click the person or the plant`, `// ===== Tech tiles: projector beam`, `// ===== Section keys` |
| Skills die, section open/close, Projects / Experience / About / Contact logic | 3rd module: `// ---- Content`, `// ---- The die`, `// ---- Floating die -> section view` and below |

**Dead code to skip** (left over from earlier ideas, not part of the design): `Tesseract (4D)`, `3D sticker cards`, `Portal`, `The dive`, `Scroll setup`, `Skill pop-up` / `#tip` (chips have no pop-up now), `.motion` pause toggle CSS, `.dice-hint`, `.tiles-note`. No particle wave, sea, sky, name chain, ropes or scroll zoom.

## Locked design

| Area | Decision |
|---|---|
| Screen | One full screen, no page scroll. Sections open as panels over it. |
| Room | 3D room: textured cream wall `#f2e8d5` on top, warm oak plank floor below. The wall/floor line sits at ~70% of the screen height (higher on phones so the tiles fit). Soft shade where wall meets floor. |
| Desk setup | Cartoon low-poly setup on the floor, centered, turned -0.3 rad: black desk with a wine LED strip, two monitors with code screens, keyboard, mouse, a small plant, a black gaming chair with wine panels, and a person seen from behind (gray hoodie, wine headphones), right hand on the mouse. |
| Setup motion | Only two: the screens "type" colored code bars, then flash and restart; the right index finger clicks the mouse every ~1.7 s (a double click every third time). Nothing else moves. |
| Screen mark | A tiny coral sparkle (`#d97757`) in the bottom-right corner of the right monitor. Not a brand logo. |
| Name | Two lines `Santiago` / `Boada.dev`, gentle concave curve (ends bigger and closer). Gray crackle porcelain front `#9ea2ab`, solid wine sides `#8c0b2f`. Small: ~20% of the screen height (16% on phones), placed just under the keys. Intro animation; click replays it; tilts toward the mouse. |
| Section keys | Five keycaps top center, each with its icon left of the word: Skills, Projects, Experience, About, Contact. Black cap, wine sides, dark-wine base. 3 + 2 rows on phones. |
| Category tiles | Six tiles at the bottom: Frontend, 3D, Backend, Data, AI, Tools. Icon + name only (no years, levels or brand logos). Hover = projector beam (below). |
| Bubbles | Click the person (or chair) or the plant: a comic speech bubble pops above it. No zoom. |
| Sections | Open with the key press, the room and name zoom softly toward the key and fade, the panel grows out of the key's rectangle. Close (button or Esc) plays it in reverse. |
| UI | Poppins 500/600/700, wine `#9e1240`, soft wine `#b3154a` / `#e0577f`, cream panels `rgba(248,243,235,0.9)` with blur. |
| Languages | English and Spanish with an `EN | ES` toggle top-right (see Build decisions). |
| Favicon | Option A: "SB" keycap (see Favicon). |

## Real data

| Item | Value |
|---|---|
| Live app | `https://finance.santiagoboada.dev` |
| GitHub | `https://github.com/Zarvi16G` |
| LinkedIn | `https://www.linkedin.com/in/santiago-boada-rivas-6b4a392a4/` |
| Email | `proyectos@santiagoboada.dev` |
| Location | Bogotá, Colombia · remote or on-site |
| Age | 25 |
| Studying | Full-Stack Development Master · Conquer Blocks Academy (finishing) |

External links open in a new tab (`target="_blank" rel="noopener"`).

## Stack and files

```bash
npm create vite@latest portfolio-3d -- --template react-ts
cd portfolio-3d
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
```

```
public/fonts/Poppins_Bold.typeface.json   # the font JSON embedded in reference.html (#font-data)
src/three/crackleTexture.ts  splitEdges.ts  nameLayout.ts    # name helpers (port from module 1)
src/scene/Room.tsx            # wall + floor shaders, camera framing, blob shadows
src/scene/DeskSetup.tsx       # desk, monitors (CodeScreen), keyboard, mouse, plant, chair, person, click anim
src/scene/CodeScreen.ts       # canvas texture that types code bars and restarts
src/scene/WateringCan.tsx     # can + drops, 4.4 s animation
src/scene/NameScene.tsx       # transparent canvas with the 3D name
src/ui/SectionKeys.tsx  CategoryTiles.tsx  icons.tsx  SpeechBubble.tsx
src/sections/SectionHost.tsx  # open/close transitions from the key rect
src/sections/Skills.tsx  Projects.tsx  Experience.tsx  About.tsx  Contact.tsx
src/ui/Coin.tsx               # the 3D CSS coin (Experience + About)
src/data/content.ts           # links, skills, projects, experience: everything editable in one place
```

## Layers

| Layer | z-index |
|---|---|
| Room canvas (`#waves` in the reference), full screen | 0 |
| Name canvas (`#stage`), transparent, full screen | 1 |
| Tiles | 2 |
| Keys, speech bubbles | 3 |
| Section panels | 4–5 |

The name canvas covers the room, so clicks on the person or plant are caught by a **window click listener in the capture phase** that raycasts the room; when it hits, it stops the event so the name intro does not replay. Only when no section is open.

## Screen composition (build in this order, check each step)

The home is **two stacked full-screen canvases plus fixed HTML**, not one scene. Do **not** merge them into one R3F `<Canvas>`: the room camera and the name camera are different and each one is framed from the DOM (tiles and keys).

| # | Layer (top of the stack last) | Element | Position rule |
|---|---|---|---|
| 1 | Room canvas, z 0 | `<Canvas>` #1, `position: fixed; inset: 0` | own camera `fov 28` at `(0, 2, 8)`, pitched so the wall/floor line = `horizon` (below) |
| 2 | Desk setup | inside canvas #1, group at `(0, 0, 0.3)`, `rotation.y −0.3`, scale `clamp(visibleW·0.8/2.1, 0.5, 1)` | sits on the floor, centered; desk back edge touches the wall |
| 3 | Name canvas, z 1 | `<Canvas>` #2, transparent (`gl={{ alpha: true }}`), `position: fixed; inset: 0` | own camera `fov 30`, framed so the name is 20% of the height (16% phones) and centered `14px` under the keys |
| 4 | Tiles, z 2 | `.tiles` fixed, centered, `bottom: 6vh` (4vh phones) | 6 × 96px (3 + 3 × 84px on phones) |
| 5 | Keys, z 3 | `.keys` fixed, centered, `top: 18px` | 5 in a row (3 + 2 on phones) |
| 6 | Bubbles, z 3 | fixed, moved every frame from projected anchors | |

Order of the framing math (each frame or on resize; keys and tiles must be in the DOM first):

1. Read `tilesTop = tiles.getBoundingClientRect().top / h`. `horizon = clamp(tilesTop − 0.14, 0.56, 0.70)`.
2. Room camera: `pitch = atan(2/8) − atan((2·horizon − 1)·tan(fov/2))`, `camera.rotation.set(−pitch, 0, 0)`. In R3F set this on the default camera with `useThree` + a resize effect; do NOT use `OrbitControls`, `lookAt` or Drei `<Stage>/<Center>/<Bounds>` (they move the setup).
3. Setup scale from the visible width at depth 7.4.
4. Read `keysBottom = keys.getBoundingClientRect().bottom`. Name camera: fit distance from width and height, then `nameLift` (code below). Camera `position (0, nameLift, fitDist)`, `lookAt(0, nameLift, 0)`.

Expected result (use it to check screenshots; px from the top-left):

| Viewport | Wall/floor line | Monitor tops | Head top | Desk feet | Chair feet | Plant | Setup scale |
|---|---|---|---|---|---|---|---|
| 1440 × 900 | y ≈ 616 (68%) | (623, 335) / (779, 339) | (631, 330) | (497, 660) / (851, 690) | (600, 731) | (859, 434) | 1.00 |
| 390 × 844 | y ≈ 498 (59%) | (137, 335) / (230, 340) | (144, 341) | (62, 530) / (271, 547) | (127, 569) | (277, 397) | 0.65 |

At 1440 × 900 the name fills roughly y 90–270, then the monitors start ~60px below it, the chair stands on the floor just above the tiles (tiles top ≈ 742). Nothing overlaps. If the name covers the setup or the setup floats, the framing order above was not followed.

The setup has **every part listed in the blueprint below**: desk (top, 2 side panels, back rail, wine LED strip, desk mat), 2 monitors (bezel, back, arm, foot, code screen), keyboard + glow, mouse, plant (pot + 5 leaves), gaming chair (5 legs + wheels, gas lift, seat + 2 wine side bolsters, back with 2 wine stripes and wine head pillow, 2 armrests + posts), person (thighs, shins, shoes, torso, shoulders, neck, head, hair, ears, headphone band + 2 cups, left arm to keyboard, right arm + hand group with click finger), 2 floor blob shadows + 1 wall shadow. Port it **part by part with the same numbers**; do not simplify, swap for primitives from Drei, or replace with a GLTF.

## The room (module 2)

- `PerspectiveCamera(28)`, camera at `(0, 2.0, 8.0)`. Each resize: `horizon = clamp(tilesTop/h − 0.14, 0.56, 0.70)`; `pitch = atan(2/8) − atan((2·horizon − 1)·tan(fov/2))`; `camera.rotation.x = −pitch` so the wall/floor corner lands on that line.
- Narrow screens: `setup.scale = clamp(visibleWidth·0.8 / 2.1, 0.5, 1)`.
- Wall `PlaneGeometry(40, 14)` and floor `PlaneGeometry(40, 30)` use `ShaderMaterial` (copy both shaders): wall = the cream texture in world space + `1 − 0.22·exp(−y·3.2)` corner shade; floor = oak planks 0.24 wide, 1.6 long, staggered, seams, grain, `1 − 0.3·exp(−z·2.6)` corner shade. Both end with `#include <colorspace_fragment>`.
- Lights: `RoomEnvironment` via PMREM (0.75), hemisphere `#fff4e6/#b8a58a` 0.9, directional 2.0 at `(-3, 5, 6)`, ACES tone mapping. No shadow maps: soft radial "blob" shadow planes under desk and chair and on the wall.
- Setup geometry, materials and positions: copy from `// ---- the setup ----` (RoundedBoxGeometry boxes, capsule limbs). Group at `(0, 0, 0.3)`, `rotation.y = −0.3`.
- Code screens: 512×288 canvas per monitor; 12 lines of rounded colored bars typed ~20 px every 45 ms, blinking cursor, 1.4 s hold when full, then a white flash (0.35 → 0) and a new program.

## Speech bubbles and watering

- Bubble CSS: white card, 3px `#1b1a1d` border, `box-shadow: 5px 5px 0 #1b1a1d`, radius 18, Poppins 700 15px, a two-layer tail at the bottom, pop-in `scale(.4) rotate(-6deg)` → overshoot. Positioned each frame by projecting an anchor point (person head `(0, 1.47, 1.11)`, plant top `(0.68, 1.0, 0.3)` in setup space). Click elsewhere or Esc closes. Cursor `help` over the person and plant.
- Person: "Hey, you! Want to **hire me**, or need a **freelance project**?" + button **Let's talk** = programmatically click the Contact key (it sinks, then Contact opens).
- Plant: "What's up? I'm a little thirsty... can you **water me**?" + button **Water the plant**. On click: hide the button, text "Ahh... **glug glug**", the bubble slides up `0.26` scene units (transition on `top`, not on first show) so the can stays visible. Watering can (gray body, wine rim, spout, handle) next to the plant: 0–0.4 s grow, 0.4–0.9 s tilt to 0.8 rad, 0.9–3.6 s pour (a drop every 45 ms from the spout tip, gravity 2.6, removed at pot height), leaves wiggle, 3.6–4.0 s untilt, 4.0–4.4 s shrink. Then the plant grows 5%, text "Thank you! I feel **brand new**.", auto-close after 2.4 s.

## The name (module 1)

Same porcelain as before: per-glyph `TextGeometry` (Poppins Bold, size 1, depth 0.26, bevel 0.07/0.032), `splitEdges` → `[front, side, side]` `MeshPhysicalMaterial` with the procedural crackle map + bump (front `#9ea2ab/#464a53/#c9ccd3`, sides `#8c0b2f/#4a0518/#a8173f`, clearcoat 1). Layout per line on an arc: `END_SCALE 1.22`, `CURVE 0.3`, `LINE_GAP 1.3`. Intro: 70 ms stagger, 900 ms per letter, easeOutBack.

Placement (new): `targetH = h · (w < 640 ? 0.16 : 0.2)`, width margin `0.6` (0.86 on phones); fit distance from both; then center the name `14px` below the keys' bottom by moving the camera Y (`nameLift = −yc · fitDist · tan(fov/2)`).

## Keys and tiles (CSS in reference)

- Keys: copy `.keys`, `.key-base`, `.key`, `.key .ico`. Click: `.pressed` for 200 ms, then open from the key's rect.
- Icons: the original 24×24 set in `icons.tsx` (Skills die, Projects folder, Experience briefcase, About person, Contact envelope, Frontend window, 3D cube, Backend server, Data cylinder, AI sparkle, Tools wrench, Code brackets). Classes `f` = soft wine fill, `dot` = solid. No brand logos.
- Tiles: 96×104 (84×92 on phones, 3 + 3 grid). **Projector beam on hover/focus:** tile lifts 4px and gets a `#e0577f` ring + glow, its own icon fades to 25%; a beam (150×128, pink gradient, trapezoid `clip-path: polygon(38% 100%, 62% 100%, 100% 0, 0 0)`) grows from the tile top (`scaleY 0→1`); a hologram (the tile's icon at 66px + name) fades in 34px above it with a short flicker and scan lines. Hologram strokes and name are **white** with a thin `#6a0b2c` outline and a wine glow. On phones the bottom row's beam is 232px and its hologram sits 136px up, so it clears the top row.

## Sections

All panels: centered, `min(1080px, 100vw − 32px)`, max-height `100dvh − 104px`, scroll inside, cream glass. "Back to portfolio" pill top-left (top-right on phones).

### Skills
Die on the left (`RoundedBoxGeometry(3,3,3,10,0.42)` gray porcelain, wine decals with count, "SKILLS" and category; slow auto-rotate; hovering a category card turns that face to the camera) and the panel on the right ("What I work with"). Chips are **plain tags**: wine border + tint on hover, `cursor: help`, **no pop-up, no years, no extra info**.

**Die interaction (fixed bug: no OrbitControls).** The camera is fixed (looking at the origin); dragging rotates the die group itself like a trackball: horizontal drag around the camera's up axis, vertical drag around the camera's right axis (`0.0085` rad per px), applied with `group.quaternion.premultiply()`. No poles: it turns fully in every direction. Inertia on release (`exp(−3.2·dt)` damping, frame-rate independent; none with reduced motion; no throw if the pointer was held still >80 ms). Slow idle spin around screen Y (`0.063` rad/s), paused while dragging and 4 s after release, and while a category card is hovered. Starting a drag cancels any face-align animation. A click that moves less than 6 px selects the face. `setPointerCapture` while dragging, `touch-action: none` on the canvas. Code: `// ---------------- Die rotation` in reference.html.

**Open/close (no jumps).** The die box is mounted at its final size and place from the start (58vw × 100dvh on the left on desktop, 100vw × 44dvh on top on phones), so the canvas is measured once. Animate only `transform` (FLIP, `flipFrom()` in reference.html): uniform scale (the smaller factor, so nothing stretches) + translate from the Skills key rect, plus opacity. Closing is the exact reverse toward the key.

Categories:

| Category | Skills |
|---|---|
| Frontend | React, TypeScript, Vite, HTML & CSS, Tailwind |
| 3D & Graphics | Three.js, React Three Fiber, Drei, GLSL Shaders, Blender |
| Backend | Django, REST APIs, Django REST Framework |
| Databases | PostgreSQL, MySQL, MongoDB, Redis |
| DevOps & Tools | Git, GitHub Actions, Docker, Vercel |
| Design | Figma, UI / UX, Motion |

### Projects
"Things I've built" · "1 live · 1 in progress". One card: left, a browser frame (keycap shadow, URL bar `finance.santiagoboada.dev`) with a mini dashboard drawn in the app's own palette (bg `#f6f4ef`, ink `#241f1b`, brand `#3b4a6b`, income `#2f6b4f`, expense `#9c4a3a`; Newsreader + Public Sans) that tilts toward the pointer (±10°/±8°). Right: `01 · Personal finance · Web app · Live`, title **Patrimonio**, pitch "A personal finance app that measures net worth, not just cash flow: what you own, minus what you owe.", four features (net worth registry, financial health, multi-currency, two-step login), chips Frontend / Backend / Data / Self-hosted on a VPS. Buttons: **Visit live site ↗** (keycap, live app), **More projects on GitHub ↗** (outlined, fills black on hover), **Case study · soon** (dashed, disabled; keep it). Below: dashed card "02 · Next project — In progress. It lands here when it ships."

### Experience
"The road so far". A CSS-3D game board (520×1000, cream with grid, `rotateX(56deg)` from its bottom edge, scaled to the stage, tilts in from 20° on open) with a winding road from **START at the bottom** to the top; the travelled part is a dashed wine line up to checkpoint 02, the rest dotted gray. Upright **3D coins** (see Coin) stand on it with labels:
- 01 · **Teleperformance** · 2025 — Technical Support · Call center (BPO, tech-company account): hardware/software troubleshooting live, learned the product end to end, plain-language explanations. Why it matters: methodical debugging and clear communication.
- 02 · **Sutherland** · 2026 – Now — Technical Support · Web development & infrastructure (BPO, web hosting client: VPS, hosting, email, domains): migrations, first websites with WordPress and AI builders, DNS/SSL/VPS sizing, Linux over SSH. Tags cPanel/WHM/Plesk, DNS & SSL, Linux & SSH, VPS, WordPress, AI site builders. A wine flag **SB.dev** beside it ("YOU ARE HERE") and a green ring pulsing **on the ground** under it.
- 03 · **Web dev company** · Goal — ghost coin (light pink); next step: a full-stack role in a development team.
Hover (desktop) / tap (phones) a coin: it stops and a detail window opens beside the board (above/below the coin on phones). Migration and site counts are still unknown: show no numbers until Santiago gives them.

### Coin (Experience + About)
A real CSS-3D coin: two faces (`#1b1a1d`, inset wine ring, white number) at `translateZ(±6px)`, an edge band of thin strips around the rim (`N ≈ R·1.15`, width `2πR/N + 1.4`, `rotateZ(a) translateY(−R+0.6) rotateX(90deg)`, shaded by angle) and four solid core discs inside so nothing shows through edge-on. Spin: hold front 60% of 5 s, then one full turn with ease-in-out; all coins in sync; pause on hover.

### About
Centered: "About" + "Hi, I'm Santiago Boada." and an **ID badge** hanging from a striped wine strap with a dark clip, swinging like a pendulum (±2.2°, 4.2 s, very soft). Front: SB coin (static), name, "Self-taught web developer", rows Age 25 · Based in Bogotá, Colombia · Day to day Websites · VPS · DNS & SSL · Migrations · Looking for Full-stack or web developer role. Click/tap flips it (0.8 s): back = Studying (Full-Stack Development Master, Conquer Blocks Academy · finishing), Available for (Remote or on-site, Bogotá), a decorative barcode, santiagoboada.dev. Height follows content: nothing may overflow.

### Contact
"Open to work · Bogotá, remote or on-site". A wine **envelope** (front pocket with a V cut, "santiagoboada.dev" at the bottom) whose flap opens in 3D (`perspective(900px) rotateX(0→180deg)`, perspective on the flap only) and a letter slides up: "DEAR RECRUITER, / Let's talk. / Write me about a role or a project. I'll get back to you soon.", the email with a **Copy** button (→ "Copied"), GitHub and LinkedIn buttons. The envelope height and lift are computed from the letter's height. **When the slide ends, park the letter with `top` and `transform: none`** — a leftover transform made its text blurry.

## Responsive

| | Phone < 640 | Tablet 640–1023 | Desktop | TV ≥ 1920 |
|---|---|---|---|---|
| Keys | 3 + 2 rows | one row | one row | one row, UI ×1.25–2 |
| Tiles | 3 + 3 (84px) | one row from 760px | one row | one row |
| Room | horizon higher, setup scaled down | | horizon 70% | |
| Sections | one column | | two columns where designed | |

Check at 390×844, 820×1180, 1440×900 and 3840×2160.

## Favicon (official: option A, keycap)

"SB" in white on a black keycap with wine sides, like the section keys. The files are in `assets/favicon/` next to this SKILL.md; copy them to `public/`:

| File | Use |
|---|---|
| `favicon.svg` | main icon (letters already converted to paths, no font needed) |
| `favicon.ico` | 16/32/48 px fallback for old browsers |
| `favicon-32.png`, `favicon-16.png` | PNG fallbacks |
| `apple-touch-icon.png` | 180 px, cream background, for iPhone home screen |
| `icon-512.png` | 512 px for a web manifest or social previews |

```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<title>Santiago Boada · Web Developer</title>
<meta name="theme-color" content="#f2e8d5" />
```

## Assets

Everything else is made by code (shaders, canvas textures, CSS, SVG icons): there are no image files to add. The only other asset is the font: extract the JSON inside `<script id="font-data">` of reference.html to `public/fonts/Poppins_Bold.typeface.json`, and self-host Poppins 500/600/700, Newsreader 500 and Public Sans 400/600 with `@fontsource/*` (imported in `main.tsx`, bundled into `/assets`). **No Google Fonts**: the CSP only allows this origin.

## Build decisions (confirmed by Santiago)

| Decision | Choice |
|---|---|
| Repository | A **new repo from scratch** (suggested name `santiagoboada-portfolio`). The current site stays online until the new one replaces it. |
| Hosting | **Santiago's VPS** (Docker, host Nginx, GoDaddy certificate, Cloudflare proxy): Docker image on GHCR deployed by GitHub Actions after his approval. See Deploy to the VPS. |
| Language | **English + Spanish** with a toggle. English is the default; Spanish when the browser language starts with `es`; the choice is remembered (`localStorage`, try/catch) and `<html lang>` follows it. The name `Santiago / Boada.dev` and the brand names never change. |
| Weak devices | **Automatic light version** (below). |

### Language toggle

A small pill `EN | ES` fixed at the **top-right** (`right: 16px`, below the safe area), glass background, the active side in wine. Hidden while a section is open. All copy lives in `src/data/content.ts` as `{ en, es }`; components read it through a `useLang()` context. Spanish copy:

| Place | English | Spanish |
|---|---|---|
| Keys | Skills · Projects · Experience · About · Contact | Habilidades · Proyectos · Experiencia · Sobre mí · Contacto |
| Tiles | Frontend · 3D · Backend · Data · AI · Tools | Frontend · 3D · Backend · Datos · IA · Herramientas |
| Back pill | Back to portfolio | Volver al portafolio |
| Person bubble | Hey, you! Want to **hire me**, or need a **freelance project**? · Let's talk | ¡Hey, tú! ¿Quieres **contratarme** o necesitas un **proyecto freelance**? · Hablemos |
| Plant bubble | What's up? I'm a little thirsty... can you **water me**? · Water the plant | ¿Qué tal? Tengo un poquito de sed... ¿me **riegas**? · Regar la planta |
| Watering | Ahh... **glug glug** / Thank you! I feel **brand new**. | Ahh... **glu glu** / ¡Gracias! Me siento **como nueva**. |
| Skills | What I work with · Hover a category to turn the die. · N skills | Con qué trabajo · Pasa el mouse por una categoría para girar el dado. · N habilidades |
| Skill categories | Frontend · 3D & Graphics · Backend · Databases · DevOps & Tools · Design | Frontend · 3D y gráficos · Backend · Bases de datos · DevOps y herramientas · Diseño |
| Projects head | Things I've built · 1 live · 1 in progress | Lo que he construido · 1 en línea · 1 en progreso |
| Project meta | Personal finance · Web app · Live | Finanzas personales · App web · En línea |
| Pitch | A personal finance app that measures net worth, not just cash flow: what you own, minus what you owe. | Una app de finanzas personales que mide el patrimonio, no solo el flujo de caja: lo que tienes menos lo que debes. |
| Features | Net worth registry: assets against debts, and liquid money against what is locked in. / Financial health: savings rate, months of emergency fund and debt-to-income, each with a plain verdict. / Multi-currency: every movement keeps the currency it happened in; totals convert to COP. / Two-step login with an authenticator app. | Registro patrimonial: activos frente a deudas, y dinero líquido frente a lo inmovilizado. / Salud financiera: tasa de ahorro, meses de fondo de emergencia y deuda sobre ingreso, cada uno con un veredicto claro. / Multimoneda: cada movimiento guarda la moneda en que ocurrió; los totales se convierten a COP. / Inicio de sesión en dos pasos con app de autenticación. |
| Project chips | Frontend · Backend · Data · Self-hosted on a VPS | Frontend · Backend · Datos · Alojado en un VPS propio |
| Project buttons | Visit live site · More projects on GitHub · Case study · soon | Ver sitio en vivo · Más proyectos en GitHub · Caso de estudio · pronto |
| Next project | 02 · Next project — In progress. It lands here when it ships. | 02 · Próximo proyecto — En progreso. Aparecerá aquí cuando esté listo. |
| Mini dashboard | (English labels) | the app's original Spanish labels: Patrimonio neto, Ingresos, Gastos, Buenas tardes, Zarvi., Tasa de ahorro 60 % · Sólida, Fondo de emergencia 4,5 meses · Suficiente, Deuda / ingreso 28,5 % · Sana |
| Experience head | The road so far · It starts at the bottom. Hover / Tap a coin to open the checkpoint. | El camino hasta ahora · Empieza abajo. Pasa el mouse / Toca una moneda para abrir el checkpoint. |
| Coin labels | CHECKPOINT 01 / 02 / 03 · NEXT · Now · Goal · YOU ARE HERE · Why it matters: · Current | CHECKPOINT 01 / 02 / 03 · SIGUIENTE · Hoy · Meta · ESTÁS AQUÍ · Por qué importa: · Actual |
| Teleperformance | Technical Support · Call center / BPO · tech-company account / Solved hardware and software problems for customers of a tech company, guiding them step by step until it worked. / Diagnosed hardware faults and software errors live, on the call, and walked users through the fix. / Learned how the product works end to end, to find the cause of a bug without touching the code. / Turned technical answers into plain language for non-technical users. / methodical debugging and explaining technical problems clearly. | Soporte técnico · Call center / BPO · cuenta de empresa tecnológica / Resolví problemas de hardware y software para clientes de una empresa tecnológica, guiándolos paso a paso hasta que funcionara. / Diagnostiqué fallas de hardware y errores de software en vivo, durante la llamada, y acompañé al usuario hasta la solución. / Aprendí cómo funciona el producto de punta a punta para encontrar la causa de un error sin tocar el código. / Traduje respuestas técnicas a un lenguaje simple para usuarios no técnicos. / depuración metódica y explicar problemas técnicos con claridad. |
| Sutherland | Technical Support · Web development & infrastructure / BPO · web hosting client: VPS, hosting, email, domains / I look after customers' websites and servers from start to finish, applying web development on every case. / Migrate websites, email accounts and databases between plans and servers. / Build first websites for small businesses with WordPress and AI site builders. / Fix infrastructure issues: DNS, domains, SSL certificates, and sizing VPS resources (CPU, RAM) so a project can run. / Work on Linux servers over SSH: logs, services and permissions. / hands-on with the whole life of a website: build, deploy, migrate and secure. | Soporte técnico · Desarrollo web e infraestructura / BPO · cliente de hosting web: VPS, hosting, correo, dominios / Acompaño los sitios web y servidores de los clientes de principio a fin, aplicando desarrollo web en cada caso. / Migro sitios web, cuentas de correo y bases de datos entre planes y servidores. / Creo primeros sitios web para pequeños negocios con WordPress y constructores con IA. / Resuelvo problemas de infraestructura: DNS, dominios, certificados SSL y dimensionar recursos de VPS (CPU, RAM) para que un proyecto funcione. / Trabajo en servidores Linux por SSH: logs, servicios y permisos. / experiencia práctica con toda la vida de un sitio web: construir, desplegar, migrar y asegurar. |
| Goal coin | Web dev company · A web development company · Full-stack developer, with a foot in infrastructure · The next step: building products with a development team, bringing what I already do every day with hosting, servers and websites. · Ready to ship: front end, back end and the server it runs on. · Used to real customers, real incidents and real deadlines. · Looking for: a team where I can grow as a developer. Let's talk in Contact. | Empresa de desarrollo · Una empresa de desarrollo web · Desarrollador full-stack, con base en infraestructura · El siguiente paso: construir productos con un equipo de desarrollo, aportando lo que ya hago cada día con hosting, servidores y sitios web. · Listo para entregar: front end, back end y el servidor donde corre. · Acostumbrado a clientes reales, incidentes reales y plazos reales. · Busco: un equipo donde crecer como desarrollador. Hablemos en Contacto. |
| About | Hi, I'm Santiago Boada. · Self-taught web developer · Age · Based in · Day to day · Looking for · Full-stack or web developer role · Click / Tap the badge to flip it · Studying · Available for · Remote or on-site · finishing | Hola, soy Santiago Boada. · Desarrollador web autodidacta · Edad · Vivo en · Día a día · Busco · Cargo de desarrollador full-stack o web · Haz clic / Toca el carnet para darle la vuelta · Estudiando · Disponible para · Remoto o presencial · por terminar |
| Contact | Open to work · Bogotá, remote or on-site · DEAR RECRUITER, · Let's talk. · Write me about a role or a project. I'll get back to you soon. · Copy / Copied | Disponible · Bogotá, remoto o presencial · ESTIMADO RECLUTADOR, · Hablemos. · Escríbeme sobre un cargo o un proyecto. Te respondo pronto. · Copiar / Copiado |
| Page title | Santiago Boada · Web Developer | Santiago Boada · Desarrollador Web |

Check the Spanish layout too: longer words ("Habilidades", "Herramientas", "Experiencia") must still fit the keys and tiles at 390 px.

### Light version (weak devices)

Decide once on load, before mounting the 3D canvases:

- **Light** when any is true: no WebGL2 (`canvas.getContext('webgl2')` is null), `navigator.deviceMemory <= 2`, `navigator.hardwareConcurrency <= 2`, or `prefers-reduced-data`. After mount, if the average frame rate of the first 2 s is below 24 fps, switch to light too (and remember it for the session).
- In light mode: no room canvas and no name canvas. The background is the cream color `#f2e8d5` with a soft CSS radial vignette; the name is HTML text in Poppins 700 (`Santiago` / `Boada.dev`, gray `#9ea2ab` with a stacked wine `text-shadow` for depth), at the same place and size. No desk, no bubbles.
- Everything else works the same: keys, tiles with the projector beam, all five sections (the Skills die becomes the six category cards only, without the 3D die), the language toggle and the favicon.

### Deploy to the VPS

**Docker image on GHCR, deployed by GitHub Actions after Santiago's approval.** Claude never connects to the VPS (no ssh, scp or remote commands): anything on the server goes in `docs/SERVER-SETUP.md`, which Santiago runs. No secrets in the repo. Never push or create the remote repo without asking.

```
tag v* / Run workflow ─► build: npm ci, npm audit, docker build ─► ghcr.io/zarvi16g/santiagoboada-portfolio:AAAAMMDD-HHMM-<sha7> (private)
                      ─► deploy: environment "production" (required reviewer) ─► ssh deploy@<VPS IP> "<tag>" ─► /opt/portfolio/deploy.sh
                      ─► check: curl -sfI https://santiagoboada.dev → 200 + Content-Security-Policy
visitor ─► Cloudflare (proxy, Full strict, TLS ≥ 1.2) ─► host Nginx :443 (GoDaddy cert, HSTS, real IP) ─► container 127.0.0.1:8081 → 8080
```

| File | Rules |
|---|---|
| `Dockerfile` | multi-stage: `node:22.x-alpine` (`npm ci`, `npm audit --audit-level=high`, `npm run build`) → `nginxinc/nginx-unprivileged:<version>-alpine` (no root, port 8080) with `dist/` only. Base images pinned by **version + digest**. `HEALTHCHECK` with `wget` on `/`. `vite build.sourcemap = false`. `.dockerignore`: node_modules, .git, .github, .claude, .env*, dist, docs, scripts, deploy, *.md |
| `docker/nginx.conf` + `docker/security-headers.conf` | `server_tokens off`, `autoindex off`, GET/HEAD only (405), hidden files 404, gzip (js, css, json, svg). Cache: `/assets/*` `public, max-age=31536000, immutable`; `index.html` `no-cache`; un-hashed icons/webp/font JSON 30 days; cache headers only on success (no `always`). The security headers are a snippet **included in every location** (an `add_header` in a location drops the server-level ones) |
| `deploy/docker-compose.yml` | `ghcr.io/zarvi16g/santiagoboada-portfolio:${TAG}` with `TAG` in `/opt/portfolio/.env`; ports `"127.0.0.1:8081:8080"` (never 0.0.0.0: Docker bypasses ufw); `restart: unless-stopped`, `read_only`, tmpfs `/tmp` and `/var/cache/nginx`, `no-new-privileges`, `cap_drop: ALL`, `mem_limit: 128m`, json-file logs 10m × 3, its own network (separate from the finance app) |
| `deploy/deploy.sh` | in `/opt/portfolio/`, the **only** command the GitHub key can run (`authorized_keys`: `command="/opt/portfolio/deploy.sh",no-pty,no-port-forwarding,no-agent-forwarding,no-X11-forwarding`). Takes only a tag from `SSH_ORIGINAL_COMMAND` (or `$1` by hand), validated with `^[0-9]{8}-[0-9]{4}-[0-9a-f]{7}$`; `flock`; saves the previous tag; `docker compose pull` (if it fails nothing changes); `up -d`; waits for `healthy` (60 s); otherwise goes back to the previous tag without pulling; keeps the newest 3 images of this project; logs to `/opt/portfolio/deploy.log` |
| `deploy/nginx-santiagoboada.conf` | host Nginx: 443 ssl with the GoDaddy certificate (`__SSL_CERT__` / `__SSL_KEY__` placeholders, filled on the server), 80 → https, a separate `www` block → 301 `https://santiagoboada.dev`, `proxy_pass http://127.0.0.1:8081` with Host and X-Forwarded-Proto, `set_real_ip_from` with Cloudflare's official ranges + `real_ip_header CF-Connecting-IP`, HSTS `max-age=31536000` (no includeSubDomains/preload yet), `server_tokens off` |
| `.github/workflows/deploy.yml` | on `push` of tags `v*` and `workflow_dispatch` (never every push to main). Job build: `permissions: contents read, packages write`, push to GHCR with `GITHUB_TOKEN`, tag `AAAAMMDD-HHMM-<sha7>` (UTC). Job deploy: `environment: production` (Santiago approves), SSH to the VPS **IP** (Cloudflare does not pass SSH) with `known_hosts` from a secret and `StrictHostKeyChecking=yes` (never `no`), then the live check. Every action pinned by full commit SHA |
| `docs/SERVER-SETUP.md` | Spanish, step by step: diagnosis (read only), backup, `deploy` user (no password, no sudo, docker group), restricted ed25519 key, `/opt/portfolio` (root:deploy 1770, deploy.sh 750), `docker login ghcr.io` with a `read:packages` token, host Nginx (`nginx -t` before reload), secrets, environment, Cloudflare, port 8000, rollback, GoDaddy renewal |

**Secrets** (environment `production` only): `VPS_HOST` (IP), `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS`. Nothing else.

**CSP** (container): `default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://cloudflareinsights.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'`, plus `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`, `Cross-Origin-Opener-Policy: same-origin`. So: **no inline scripts, no other origin** (fonts self-hosted, see Assets) except Cloudflare Web Analytics, which Cloudflare injects into every page (its beacon script and its reports). Before relaxing it further, say what broke.

**First deploy order** (the site is never down): run the workflow; when build is done and deploy waits for approval, run `sudo -iu deploy /opt/portfolio/deploy.sh <tag>` on the server; switch the host Nginx to the new block; then approve (same tag again, the check passes).

## Working rules

- Port one piece at a time, running in `npm run dev`, compared side by side with `reference.html` (open it in the browser too: `npx serve .claude/skills/portfolio-3d-hero`).
- After the room, name, keys and tiles: take Playwright screenshots at 1440×900 and 390×844 and compare with the "Expected result" table in Screen composition. Fix the layout before moving on.
- R3F: geometries, materials and textures in `useMemo`; animation in `useFrame` with refs; never `setState` per frame.
- Never animate the width/height of an element that contains a WebGL canvas; animate `transform` (FLIP) instead.
- No `OrbitControls` anywhere in this project.
- **Time: never `THREE.Clock`** (deprecated since three r183, it logs a warning). Inside R3F use the `delta` from `useFrame((state, delta) => …)` and accumulate your own elapsed time in a ref. In any plain loop (code screens, watering timeline, outside a Canvas) use `THREE.Timer`: `const timer = new THREE.Timer(); timer.connect(document);` then once per frame `timer.update(now)`, `timer.getDelta()`, `timer.getElapsed()`; `timer.dispose()` on unmount. Unlike Clock, Timer does nothing until `update()` is called. `reference.html` already uses Timer (three 0.183.0).
- Keep all content in `src/data/content.ts`, in both languages.
- Respect `prefers-reduced-motion` (no intro, no coin spin, no pendulum, no watering animation, instant transitions).
- Before a step is done: no console errors, nothing overflows its card, keys and tiles work with the keyboard, every section opens from its key and closes back into it, Esc closes sections and bubbles.

## Appendix: core code (the same code lives in reference.html)

Use these if reference.html is not at hand.

### Porcelain material

```ts
function glaze(colors: [number, number, number], side: boolean) {
  const { map, bump } = crackle(...colors)
  const tex = (c: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.1, 1.1); t.anisotropy = 8
    if (srgb) t.colorSpace = THREE.SRGBColorSpace
    return t
  }
  return new THREE.MeshPhysicalMaterial({
    map: tex(map, true), bumpMap: tex(bump, false), bumpScale: 1.6,
    roughness: side ? 0.35 : 0.3, clearcoat: 1, clearcoatRoughness: 0.04, sheen: 0.3, sheenRoughness: 0.6, ior: 1.5,
    emissive: new THREE.Color(side ? 0x5c0019 : 0x000000), emissiveIntensity: side ? 0.3 : 0,
  })
}
```

```ts
// src/three/splitEdges.ts: faces / walls / bevel as separate material groups
export function splitEdges(geo: THREE.BufferGeometry, depth: number) {
  const src = geo.attributes, caps: number[] = [], walls: number[] = [], bevel: number[] = []
  const capGroups = geo.groups.filter((g) => g.materialIndex === 0)
  const isCap = (v: number) => capGroups.some((g) => v >= g.start && v < g.start + g.count)
  const z = src.position.array as Float32Array
  for (let t = 0; t < src.position.count / 3; t++) {
    const v = t * 3
    if (isCap(v)) { caps.push(t); continue }
    let isBevel = false
    for (let k = 0; k < 3; k++) { const zz = z[(v + k) * 3 + 2]; if (zz > depth + 1e-5 || zz < -1e-5) isBevel = true }
    ;(isBevel ? bevel : walls).push(t)
  }
  const order = [...caps, ...walls, ...bevel], out = new THREE.BufferGeometry()
  for (const name of Object.keys(src)) {
    const a = src[name] as THREE.BufferAttribute, size = a.itemSize, arr = new Float32Array(a.count * size)
    order.forEach((t, i) => { for (let k = 0; k < 3 * size; k++) arr[i * 3 * size + k] = (a.array as Float32Array)[t * 3 * size + k] })
    out.setAttribute(name, new THREE.BufferAttribute(arr, size))
  }
  out.addGroup(0, caps.length * 3, 0)
  out.addGroup(caps.length * 3, walls.length * 3, 1)
  out.addGroup((caps.length + walls.length) * 3, bevel.length * 3, 2)
  return out
}
```

```ts
// src/three/crackleTexture.ts: tileable 512px crackle glaze -> { map, bump } canvases
const N = 512
const hex = (h: number) => [(h >> 16) & 255, (h >> 8) & 255, h & 255]
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t)
const sstep = (e0: number, e1: number, x: number) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t) }
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function valueNoise(p: number, seed: number) {
  const r = rng(seed), g = Float32Array.from({ length: p * p }, r)
  return (x: number, y: number) => {
    const fx = x * p, fy = y * p, x0 = Math.floor(fx), y0 = Math.floor(fy)
    const tx = fx - x0, ty = fy - y0, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty)
    const xa = ((x0 % p) + p) % p, xb = (xa + 1) % p, ya = ((y0 % p) + p) % p, yb = (ya + 1) % p
    const a = g[ya * p + xa], b = g[ya * p + xb], c = g[yb * p + xa], d = g[yb * p + xb]
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
  }
}
function fbm(base: number, oct: number, seed: number) {
  const L = Array.from({ length: oct }, (_, o) => valueNoise(base * 2 ** o, seed + o * 101))
  return (x: number, y: number) => { let v = 0, amp = 0.5, tot = 0; for (const n of L) { v += n(x, y) * amp; tot += amp; amp *= 0.5 } return v / tot }
}
function voronoi(cells: number, seed: number) {
  const r = rng(seed), pts = Float32Array.from({ length: cells * cells * 2 }, r)
  return (x: number, y: number) => {
    const fx = x * cells, fy = y * cells, cx = Math.floor(fx), cy = Math.floor(fy)
    let f1 = 9, f2 = 9
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const gx = cx + i, gy = cy + j, wx = ((gx % cells) + cells) % cells, wy = ((gy % cells) + cells) % cells
      const k = (wy * cells + wx) * 2, d = Math.hypot(gx + pts[k] - fx, gy + pts[k + 1] - fy)
      if (d < f1) { f2 = f1; f1 = d } else if (d < f2) f2 = d
    }
    return [f1, f2]
  }
}
export function crackle(base: number, crack: number, light: number) {
  const B = hex(base), C = hex(crack), Lc = hex(light)
  const v1 = voronoi(9, 11), v2 = voronoi(23, 29), n = fbm(6, 3, 5)
  const map = document.createElement('canvas'), bump = document.createElement('canvas')
  map.width = map.height = bump.width = bump.height = N
  const mi = map.getContext('2d')!.createImageData(N, N), bi = bump.getContext('2d')!.createImageData(N, N)
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N, [a1, b1] = v1(u, v), [a2, b2] = v2(u, v)
    const k = Math.max(1 - sstep(0, 0.035, b1 - a1), (1 - sstep(0, 0.03, b2 - a2)) * 0.45), tone = (n(u, v) - 0.5) * 0.08
    const c = mix(mix(B, Lc, Math.max(0, tone)), C, k * 0.75), h = Math.round(Math.min(1, Math.max(0, 0.85 - k * 0.7 + tone)) * 255)
    const i = (y * N + x) * 4
    mi.data.set([c[0], c[1], c[2], 255], i); bi.data.set([h, h, h, 255], i)
  }
  map.getContext('2d')!.putImageData(mi, 0, 0); bump.getContext('2d')!.putImageData(bi, 0, 0)
  return { map, bump }
}
```

### Name layout: two curved lines

```ts
// src/three/nameLayout.ts: one line on a gentle arc; ends come toward the viewer and are a bit bigger
export const LINES = ['Santiago', 'Boada.dev']
export const LINE_GAP = 1.3        // vertical distance between the lines (letter units)
export const END_SCALE = 1.22      // end letters vs middle letters
export const CURVE = 0.3           // 0 = flat, 1 = strong bend
// chars: [{ ch, adv }], adv = (font.data.glyphs[ch]?.ha ?? 500) * (1 / font.data.resolution)
export function layoutLine(chars: { ch: string; adv: number }[]) {
  const flatW = chars.reduce((a, c) => a + c.adv, 0)
  let x = 0
  const withU = chars.map((c) => { const u = ((x + c.adv / 2) / flatW) * 2 - 1; x += c.adv; return { ...c, u } })
  const sized = withU.map((c) => ({ ...c, s: 1 + (END_SCALE - 1) * Math.pow(Math.abs(c.u), 1.6) }))
  const totalW = sized.reduce((a, c) => a + c.adv * c.s, 0)
  const R = totalW / (0.4 + 2.2 * CURVE)
  let cursor = -totalW / 2
  return sized.map((c) => {
    const w = c.adv * c.s, arcX = cursor + w / 2; cursor += w
    const theta = arcX / R
    // x = R sin θ, z = R (1 − cos θ), y = lineY + glyphCenter.y * s, rotation.y = −θ, scale = s
    return { ch: c.ch, s: c.s, theta, x: R * Math.sin(theta), z: R * (1 - Math.cos(theta)) }
  })
}
```

Line `li` sits at `lineY = -li * LINE_GAP`. The intro `order` keeps counting across both lines (Santiago first). After placing every letter, center the whole group on its bounding box.

### Name motion

```ts
// per letter, in useFrame (easeOutBack overshoot 1.5, easeOutCubic for scale)
const local = clamp((now - introStart - order * 70) / 900, 0, 1)
const p = easeOutBack(local), s = easeOutCubic(Math.min(local * 1.6, 1))
mesh.scale.setScalar(Math.max(s * homeScale, 1e-4))
mesh.position.set(home.x, home.y - (1 - p) * 0.9, home.z + (1 - p) * 0.6)
mesh.rotation.set((1 - p) * 1.1, homeRotY - (1 - p) * 0.5, 0)
```

- Reduced motion: `local = 1` straight away. Clicking the canvas restarts `introStart`.
- Tilt: the whole name eases toward `rotation.y = pointer.x * 0.22 + sin(t * 0.6) * 0.03`, `rotation.x = -pointer.y * 0.14` (factor `1 - exp(-3 * dt)`).

### Icons

An original SVG icon set (no brand logos), 24×24 grid, `fill: none; stroke-linecap: round; stroke-linejoin: round`. Elements with class `f` get a soft wine fill, class `dot` a solid wine fill. Reference artifact: "Portfolio Icon Set" (line, duotone, keycap and tile styles); reuse it for any new icon.

```ts
// src/ui/icons.tsx: inner SVG markup per icon (render inside <svg viewBox="0 0 24 24" aria-hidden="true">)
export const ICONS: Record<string, string> = {
  Skills:     '<rect class="f" x="3.5" y="3.5" width="17" height="17" rx="4"/><circle class="dot" cx="8.3" cy="8.3" r="1.35"/><circle class="dot" cx="12" cy="12" r="1.35"/><circle class="dot" cx="15.7" cy="15.7" r="1.35"/>',
  Projects:   '<path class="f" d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l2 2h8.5A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/><path d="M3 10.5h18"/>',
  Experience: '<rect class="f" x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18"/><path d="M11 12.5v1.5h2v-1.5"/>',
  About:      '<circle class="f" cx="12" cy="8.5" r="3.6"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
  Contact:    '<rect class="f" x="3" y="5" width="18" height="14" rx="2"/><path d="M3.6 6.6 12 13l8.4-6.4"/>',
  Frontend:   '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 8.5h18"/><circle class="dot" cx="6" cy="6.3" r=".75"/><circle class="dot" cx="8.4" cy="6.3" r=".75"/><rect class="f" x="6" y="11.2" width="5" height="5.8" rx="1"/><path d="M14 12h4M14 15h4"/>',
  '3D':       '<path class="f" d="M12 12 20 7.5v9L12 21z"/><path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
  Backend:    '<rect class="f" x="4" y="4" width="16" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="16" height="6.5" rx="1.6"/><circle class="dot" cx="7.5" cy="7.25" r="1"/><circle class="dot" cx="7.5" cy="16.75" r="1"/><path d="M11 7.25h5.5M11 16.75h5.5"/>',
  Data:       '<ellipse class="f" cx="12" cy="6" rx="7" ry="2.8"/><path d="M5 6v12c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8V6"/><path d="M5 12c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8"/>',
  AI:         '<path class="f" d="M11 3.5c.6 4.1 2.7 6.2 6.8 6.8-4.1.6-6.2 2.7-6.8 6.8-.6-4.1-2.7-6.2-6.8-6.8 4.1-.6 6.2-2.7 6.8-6.8z"/><path d="M18 14.8c.25 1.5 1 2.25 2.5 2.5-1.5.25-2.25 1-2.5 2.5-.25-1.5-1-2.25-2.5-2.5 1.5-.25 2.25-1 2.5-2.5z"/>',
  Tools:      '<path class="f" d="M14.6 3.6a4.6 4.6 0 0 0-4.3 6.2L3.9 16.2a2 2 0 0 0 2.8 2.8l6.4-6.4a4.6 4.6 0 0 0 6.2-4.3l-2.7 2.7-2.6-.4-.4-2.6z"/>',
  Code:       '<path d="m8.5 7.5-5 4.5 5 4.5M15.5 7.5l5 4.5-5 4.5"/><path class="f" d="m13.4 5-2.8 14"/>',
}
export const Icon = ({ name, className }: { name: string; className?: string }) => (
  <svg className={`ico ${className ?? ''}`} viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[name] }} />
)
```

```css
svg.ico { fill: none; stroke-linecap: round; stroke-linejoin: round; flex: none; }
.ico .dot { fill: #e0577f; stroke: none; }
```

### Desk setup blueprint (verbatim from reference.html, `// ---- the setup ----` to the end of `layout()`)

Port this to `DeskSetup.tsx` with the same values. `RoundedBoxGeometry` comes from `three/examples/jsm/geometries/RoundedBoxGeometry.js`. Keep `PLANT_FROM/TO` and `PERSON_FROM/TO` as tags (`userData.kind`) for the click raycast.

```js
// ---- the setup ----
const setup = new THREE.Group();
scene.add(setup);
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...o });
const M = {
  desk: mat(0x2a2830), deskDark: mat(0x1c1b20), mat: mat(0x3a1622, { roughness: 0.9 }),
  bezel: mat(0x141317, { roughness: 0.4 }), metal: mat(0x3a3840, { roughness: 0.35, metalness: 0.4 }),
  chair: mat(0x232127, { roughness: 0.6 }), wine: mat(0x8c0b2f, { roughness: 0.5 }),
  hoodie: mat(0xb9bcc4, { roughness: 0.8 }), skin: mat(0xe2b48e, { roughness: 0.7 }), hair: mat(0x2b1f1b, { roughness: 0.75 }),
  phones: mat(0x8c0b2f, { roughness: 0.35 }), pants: mat(0x2f3340, { roughness: 0.8 }),
  led: new THREE.MeshBasicMaterial({ color: 0xff3d78, toneMapped: false }),
  pot: mat(0x9ea2ab, { roughness: 0.3 }), leaf: mat(0x4f7a52, { roughness: 0.7 }),
};
function rbox(w, h, d, r, material, x, y, z, parent = setup) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2, h / 2, d / 2)), material);
  m.position.set(x, y, z); parent.add(m); return m;
}
function limb(a, b, r, material, parent = setup) {   // a capsule between two points
  const dir = new THREE.Vector3().subVectors(b, a), len = dir.length();
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(len - 0, 0.001), 6, 12), material);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  parent.add(m); return m;
}
const ball = (r, material, x, y, z, parent = setup) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), material); m.position.set(x, y, z); parent.add(m); return m; };

// desk (against the wall), with a wine LED strip under the front edge
rbox(1.62, 0.06, 0.7, 0.02, M.desk, 0, 0.74, 0.4);
rbox(0.05, 0.71, 0.62, 0.015, M.deskDark, -0.75, 0.355, 0.4);
rbox(0.05, 0.71, 0.62, 0.015, M.deskDark, 0.75, 0.355, 0.4);
rbox(1.45, 0.08, 0.03, 0.01, M.deskDark, 0, 0.62, 0.12);
const strip = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.012, 0.012), M.led); strip.position.set(0, 0.705, 0.745); setup.add(strip);
rbox(1.1, 0.008, 0.4, 0.004, M.mat, 0.02, 0.774, 0.53);

// two monitors turned a little toward the chair; their screens are canvases with code
function codeScreen(seed, withMark) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 288;
  const g = c.getContext('2d'), tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const r = (() => { let a = seed >>> 0; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; })();
  const COLORS = ['#e0577f', '#9ea2ab', '#c9ccd3', '#b3154a', '#6b6f78', '#f4eff2', '#d9a35a'];
  let lines = [];
  function newProgram() {
    lines = []; let indent = 0;
    const n = 12;
    for (let i = 0; i < n; i++) {
      if (i > 0 && r() < 0.3 && indent < 3) indent++; else if (r() < 0.35 && indent > 0) indent--;
      const segs = []; let w = 0, k = 1 + Math.floor(r() * 3);
      while (k--) { const sw = 22 + r() * 90; segs.push({ w: sw, c: COLORS[Math.floor(r() * COLORS.length)] }); w += sw + 8; }
      lines.push({ indent, segs, w });
    }
  }
  newProgram();
  const total = () => lines.reduce((a, l) => a + l.w, 0);
  let shown = 0, holdUntil = 0, flash = 0;
  function draw(cursorOn) {
    g.fillStyle = '#17151c'; g.fillRect(0, 0, 512, 288);
    g.fillStyle = '#211e27'; g.fillRect(0, 0, 512, 22);                    // title bar
    ['#e0577f', '#6b6f78', '#6b6f78'].forEach((col, i) => { g.fillStyle = col; g.beginPath(); g.arc(14 + i * 14, 11, 4, 0, 7); g.fill(); });
    g.fillStyle = '#1b1920'; g.fillRect(0, 22, 30, 266);                     // line-number gutter
    let left = shown, cx = 0, cy = 0;
    lines.forEach((l, i) => {
      const y = 36 + i * 19;
      g.fillStyle = '#3a3742'; g.fillRect(10, y, 10, 6);
      let x = 40 + l.indent * 20;
      for (const s of l.segs) {
        if (left <= 0) break;
        const w = Math.min(s.w, left); left -= s.w + 8;
        g.fillStyle = s.c; g.globalAlpha = 0.9;
        g.beginPath(); g.roundRect(x, y, w, 7, 3.5); g.fill(); g.globalAlpha = 1;
        cx = x + w + 3; cy = y; x += s.w + 8;
      }
    });
    if (cursorOn) { g.fillStyle = '#f4eff2'; g.fillRect(cx, cy - 2, 2, 11); }
    if (withMark) {                                                          // tiny sparkle in the corner
      const mx = 497, my = 274, s = 6;
      g.fillStyle = '#d97757'; g.beginPath();
      g.moveTo(mx, my - s); g.quadraticCurveTo(mx + 1, my - 1, mx + s, my); g.quadraticCurveTo(mx + 1, my + 1, mx, my + s);
      g.quadraticCurveTo(mx - 1, my + 1, mx - s, my); g.quadraticCurveTo(mx - 1, my - 1, mx, my - s); g.fill();
    }
    if (flash > 0) { g.fillStyle = `rgba(244,239,242,${flash})`; g.fillRect(0, 22, 512, 266); }
    tex.needsUpdate = true;
  }
  let last = 0;
  function update(now) {
    if (now - last < 45) return; last = now;
    if (holdUntil) {
      if (now > holdUntil) { holdUntil = 0; shown = 0; newProgram(); flash = 0.35; }   // boom: start again
    } else {
      shown += 14 + r() * 26;
      if (shown >= total()) { shown = total(); holdUntil = now + 1400; }
    }
    flash = Math.max(0, flash - 0.07);
    draw(Math.floor(now / 450) % 2 === 0);
  }
  if (reduceMotion) { shown = total() * 0.7; draw(false); }
  else draw(true);
  return { tex, update };
}
const screens = [];
[[-0.34, 0.17, 7, false], [0.34, -0.17, 19, true]].forEach(([x, ry, seed, mark]) => {
  const mon = new THREE.Group(); mon.position.set(x, 0, 0.28); mon.rotation.y = ry; setup.add(mon);
  rbox(0.66, 0.39, 0.035, 0.012, M.bezel, 0, 1.13, 0, mon);
  rbox(0.3, 0.2, 0.05, 0.02, M.bezel, 0, 1.12, -0.035, mon);
  rbox(0.045, 0.3, 0.03, 0.01, M.metal, 0, 0.92, -0.06, mon);
  rbox(0.24, 0.016, 0.17, 0.008, M.metal, 0, 0.785, -0.02, mon);
  const scr = codeScreen(seed, mark); screens.push(scr);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.349), new THREE.MeshBasicMaterial({ map: scr.tex, toneMapped: false }));
  s.position.set(0, 1.135, 0.0185); mon.add(s);
});
// keyboard and mouse
rbox(0.46, 0.022, 0.15, 0.008, M.bezel, -0.12, 0.79, 0.56);
const kbGlow = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.004, 0.12), new THREE.MeshBasicMaterial({ color: 0x5a0f26, toneMapped: false }));
kbGlow.position.set(-0.12, 0.802, 0.56); setup.add(kbGlow);
const mouse = rbox(0.065, 0.03, 0.105, 0.015, M.bezel, 0.42, 0.792, 0.57);
// a small plant on the desk
const PLANT_FROM = setup.children.length;
const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.1, 20), M.pot); pot.position.set(0.68, 0.82, 0.3); setup.add(pot);
for (let i = 0; i < 5; i++) {
  const lf = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), M.leaf);
  const a = (i / 5) * Math.PI * 2; lf.scale.set(0.6, 1.4, 0.6);
  lf.position.set(0.68 + Math.cos(a) * 0.035, 0.92, 0.3 + Math.sin(a) * 0.035); lf.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
  setup.add(lf);
}

const PLANT_TO = setup.children.length;
// gaming chair (back toward us), black with wine panels
const PERSON_FROM = setup.children.length;
const chair = new THREE.Group(); chair.position.set(0, 0, 1.18); setup.add(chair);
for (let i = 0; i < 5; i++) {
  const a = (i / 5) * Math.PI * 2 + 0.3;
  const leg = rbox(0.05, 0.035, 0.3, 0.012, M.chair, Math.sin(a) * 0.15, 0.07, Math.cos(a) * 0.15, chair); leg.rotation.y = a;
  ball(0.03, M.chair, Math.sin(a) * 0.29, 0.03, Math.cos(a) * 0.29, chair);
}
const gas = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.32, 16), M.metal); gas.position.set(0, 0.26, 0); chair.add(gas);
rbox(0.52, 0.09, 0.5, 0.04, M.chair, 0, 0.46, 0, chair);
rbox(0.07, 0.1, 0.48, 0.03, M.wine, -0.25, 0.49, 0, chair);
rbox(0.07, 0.1, 0.48, 0.03, M.wine, 0.25, 0.49, 0, chair);
const back = new THREE.Group(); back.position.set(0, 0.5, 0.24); back.rotation.x = 0.12; chair.add(back);
rbox(0.5, 0.58, 0.09, 0.05, M.chair, 0, 0.32, 0, back);
rbox(0.07, 0.5, 0.02, 0.01, M.wine, -0.15, 0.3, 0.046, back);
rbox(0.07, 0.5, 0.02, 0.01, M.wine, 0.15, 0.3, 0.046, back);
rbox(0.28, 0.1, 0.07, 0.035, M.wine, 0, 0.56, 0.02, back);
rbox(0.06, 0.03, 0.26, 0.012, M.chair, -0.29, 0.66, -0.02, chair);
rbox(0.06, 0.03, 0.26, 0.012, M.chair, 0.29, 0.66, -0.02, chair);
rbox(0.03, 0.16, 0.03, 0.01, M.chair, -0.29, 0.57, 0.05, chair);
rbox(0.03, 0.16, 0.03, 0.01, M.chair, 0.29, 0.57, 0.05, chair);

// the person: seen from behind, headphones on, right hand on the mouse
const P = new THREE.Vector3();
const v = (x, y, z) => new THREE.Vector3(x, y, z);
limb(v(-0.1, 0.55, 1.05), v(-0.1, 0.55, 0.78), 0.075, M.pants);      // thighs
limb(v(0.1, 0.55, 1.05), v(0.1, 0.55, 0.78), 0.075, M.pants);
limb(v(-0.1, 0.53, 0.76), v(-0.1, 0.12, 0.74), 0.06, M.pants);       // shins
limb(v(0.1, 0.53, 0.76), v(0.1, 0.12, 0.74), 0.06, M.pants);
rbox(0.09, 0.06, 0.16, 0.03, M.deskDark, -0.1, 0.05, 0.7);           // shoes
rbox(0.09, 0.06, 0.16, 0.03, M.deskDark, 0.1, 0.05, 0.7);
limb(v(0, 0.66, 1.16), v(0, 0.96, 1.13), 0.17, M.hoodie);            // torso
limb(v(-0.2, 1.03, 1.12), v(0.2, 1.03, 1.12), 0.1, M.hoodie);        // shoulders
ball(0.05, M.skin, 0, 1.12, 1.12);                                    // neck
const head = new THREE.Group(); head.position.set(0, 1.27, 1.11); setup.add(head);
ball(0.14, M.skin, 0, 0, 0, head);
const hair = ball(0.147, M.hair, 0, 0.018, 0.022, head); hair.scale.set(1, 1, 0.98);
ball(0.032, M.skin, -0.14, -0.01, 0, head); ball(0.032, M.skin, 0.14, -0.01, 0, head);
const band = new THREE.Mesh(new THREE.TorusGeometry(0.158, 0.016, 8, 32, Math.PI), M.phones); band.position.set(0, 0, -0.005); head.add(band);
[-1, 1].forEach((sx) => { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.04, 24), M.phones); cup.rotation.z = Math.PI / 2; cup.position.set(sx * 0.155, -0.01, 0); head.add(cup); });
// left arm to the keyboard
limb(v(-0.25, 1.02, 1.1), v(-0.33, 0.84, 0.84), 0.055, M.hoodie);
limb(v(-0.33, 0.84, 0.84), v(-0.2, 0.82, 0.6), 0.048, M.hoodie);
ball(0.042, M.skin, -0.18, 0.815, 0.57);
// right arm to the mouse: the hand is a group so it can click
const hand = new THREE.Group(); hand.position.set(0.42, 0.825, 0.585); setup.add(hand);
ball(0.044, M.skin, 0, 0, 0, hand).scale.set(1, 0.75, 1.15);
const finger = limb(v(-0.012, 0.012, -0.03), v(-0.012, 0.004, -0.075), 0.012, M.skin, hand);
const fingerHome = finger.position.clone(), fingerQ = finger.quaternion.clone();
limb(v(0.25, 1.02, 1.1), v(0.38, 0.85, 0.85), 0.055, M.hoodie);
const forearm = limb(v(0.38, 0.85, 0.85), v(0.42, 0.83, 0.62), 0.048, M.hoodie);

const PERSON_TO = setup.children.length;
// blob shadows on the floor and on the wall behind the desk
const sh1 = blob(2.1, 1.1, 0.42); sh1.position.set(0, 0.003, 0.42); setup.add(sh1);
const sh2 = blob(0.95, 0.95, 0.45); sh2.position.set(0, 0.004, 1.18); setup.add(sh2);
const wallShadow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.3), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity: 0.16, depthWrite: false, toneMapped: false }));
wallShadow.position.set(0.1, 0.85, 0.004); scene.add(wallShadow);

// the whole setup turned a little, so it reads in 3D
setup.rotation.y = -0.3;
setup.position.set(0, 0, 0.3);

// ---- framing ----
function layout() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return false;
  renderer.setSize(w, h, false);
  uniforms.uRes.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
  uniforms.uDpr.value = renderer.getPixelRatio();
  camera.aspect = w / h;
  const tiles = document.querySelector('.tiles');
  const tilesTop = tiles ? tiles.getBoundingClientRect().top / h : 0.82;
  const horizon = THREE.MathUtils.clamp(tilesTop - 0.14, 0.56, 0.7);     // where the wall meets the floor (from the top)
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  // pitch so the wall/floor corner (y=0, z=0) lands on that line
  const pitch = Math.atan(CAM_H / CAM_D) - Math.atan((2 * horizon - 1) * tanV);
  camera.position.set(0, CAM_H, CAM_D);
  camera.rotation.set(-pitch, 0, 0);
  camera.updateProjectionMatrix();
  // narrow screens: shrink the setup so it fits the width
  const visibleW = 2 * (CAM_D - 0.6) * tanV * camera.aspect;
  setup.scale.setScalar(THREE.MathUtils.clamp((visibleW * 0.8) / 2.1, 0.5, 1));
  return true;
}

// ---- animation: the code on the screens and the mouse clicks ----
const clickAt = (t) => {                                   // 0..1 press amount, clicks every ~1.7 s (some double)
  const period = 1.7, k = t % period, n = Math.floor(t / period);
  const press = (x) => Math.max(0, 1 - Math.abs(x - 0.06) / 0.06);
  let p = press(k);
  if (n % 3 === 1) p = Math.max(p, press(k - 0.2));       // a double click now and then
```

### Name framing (verbatim from module 1)

```js
let built = false;
let fitDist = 10;
let nameLift = 0;
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  if (!built) { built = true; build(); startIntro(); }
  // Fit: the ends are closest to the camera, so fit against the front edge
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const tanH = tanV * camera.aspect;
  // The name sits just under the keys and stays small, so the room and the desk below are visible.
  const keysEl = document.querySelector('.keys');
  const keysBottom = keysEl ? keysEl.getBoundingClientRect().bottom : 80;
  const targetH = h * (w < 640 ? 0.16 : 0.2);                     // name height in px
  const margin = w < 640 ? 0.86 : 0.6;                            // max share of the width
  const halfW = Math.max(Math.abs(bounds.min.x), Math.abs(bounds.max.x));
  const halfH = Math.max(Math.abs(bounds.min.y), Math.abs(bounds.max.y));
  const dW = halfW / (tanH * margin) + bounds.max.z;
  const dH = halfH / (tanV * (targetH / h)) + bounds.max.z;
  fitDist = Math.max(dW, dH);
  const realH = (halfH / ((fitDist - bounds.max.z) * tanV)) * h;  // px
  const centerPx = keysBottom + 14 + realH / 2;
  const yc = 1 - (2 * centerPx) / h;                               // NDC of the name center
  nameLift = -yc * fitDist * tanV;
  camera.position.set(0, nameLift, fitDist);
  camera.lookAt(0, nameLift, 0);
  camera.updateProjectionMatrix();
}
```
