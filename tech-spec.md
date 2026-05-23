# Technical Specification — Pavan Portfolio

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.1 | UI framework |
| react-dom | ^19.1 | React DOM renderer |
| vite | ^6.3 | Build tool / dev server |
| @vitejs/plugin-react | ^4.4 | Vite React integration |
| typescript | ^5.8 | Type system |
| tailwindcss | ^4.1 | Utility-first CSS |
| @tailwindcss/vite | ^4.1 | Tailwind Vite plugin |
| gsap | ^3.13 | Animation engine (includes ScrollTrigger, Flip plugins) |
| lenis | ^1.3 | Smooth scroll with inertia |
| three | ^0.175 | WebGL ocean scene |
| @types/three | ^0.175 | Three.js type definitions |
| three-custom-shader-material | ^5.4 | Bridge for custom GLSL on Three.js materials |
| html2canvas | ^1.4 | DOM-to-texture capture for 3D card meshes |

GSAP plugins used: **ScrollTrigger** (scroll-driven animations + pin), **Flip** (DOM position syncing), **ScrambleTextPlugin** (nav hover decode effect). All are free as of 2025. Register via `gsap.registerPlugin()`.

Lenis replaces `@studio-freight/lenis` — same API, current package name.

---

## Component Inventory

### Layout

| Component | Source | Reuse |
|-----------|--------|-------|
| Navigation | Custom | Single — fixed bar, transparent → glass on scroll |
| SmoothScrollProvider | Custom (Lenis wrapper) | Single — initializes Lenis, syncs with GSAP ticker |

### Sections

| Component | Source | Notes |
|-----------|--------|-------|
| HeroSection | Custom | Video bg, aurora overlay, entrance timeline, scroll indicator |
| SkillsSection | Custom | 6-card grid, scroll-triggered reveals |
| OceanSection | Custom | 300vh wrapper, sticky inner, Three.js scene, 3 project cards with Flip sync |
| ExperienceSection | Custom | Vertical timeline, contact form, sunset canvas |
| Footer | Custom | Minimal closing |

### Reusable Components

| Component | Source | Used By |
|-----------|--------|---------|
| GlassCard | Custom | SkillsSection (×6), ExperienceSection timeline items — glassmorphic card shell |
| SocialIcons | Custom | HeroSection, ExperienceSection — 4-icon row with hover glow |
| TagPill | Custom | ProjectCard, TimelineItem — bordered accent pill |

### Hooks

| Hook | Purpose |
|------|---------|
| useScrollReveal | Wraps GSAP ScrollTrigger for consistent section entrance animations (fade + translateY) |
| useOceanScene | Encapsulates entire Three.js lifecycle: init, render loop, resize, dispose, visibility toggle |
| useAuroraCanvas | Manages 2D aurora animation loop with viewport visibility gating |
| useSunsetCanvas | Manages 2D pixel-art star + mountain render loop |

---

## Animation Implementation

| Animation | Library | Approach | Complexity |
|-----------|---------|----------|------------|
| Hero entrance sequence (subtitle → name → desc → CTAs → icons) | GSAP timeline | Single GSAP timeline with absolute position delays, plays on mount after video loadeddata | Medium |
| Hero video fade-in | CSS transition | opacity 0→1 toggled by class on loadeddata event | Low |
| Scroll indicator (dot + text) | CSS @keyframes + JS | Dot animation via keyframes, hide via scroll listener (Lenis or ScrollTrigger) | Low |
| Nav background transition | CSS transition + JS scroll listener | Transparent → rgba + backdrop-filter based on scroll > 50px | Low |
| Nav link text scramble | GSAP ScrambleTextPlugin | ScrambleText on mouseenter, decode over 1000ms | Medium |
| Section scroll reveals (Skills, Experience, Contact, Footer) | GSAP + ScrollTrigger | useScrollReveal hook: scrubbed opacity + translateY with stagger | Low |
| Skill card hover | CSS transition | translateY + box-shadow + border-color, cubic-bezier easing | Low |
| Timeline item scroll entrance | GSAP + ScrollTrigger | Alternating slideX directions, 120ms stagger, scrubbed | Low |
| **Ocean WebGL scene** | Three.js + custom GLSL | Full shader pipeline: fragment/vertex shaders for water, Phong lighting, Fresnel, 5-octave noise, specular, haze. Mouse-driven tilt via uniform. 40 point lights with twinkle | **🔒 High** |
| **Ocean card Flip sync** | GSAP Flip + ScrollTrigger | 3 placeholder divs per card (default/focused/full states). Flip.fit on every frame via timeline onUpdate. Card meshes follow DOM coordinates | **🔒 High** |
| **Card underwater distortion** | Three.js + custom GLSL | Vertex shader with noise + sine displacement. 3 states (rising/focused/diving) driven by scroll progress uniforms | **🔒 High** |
| **Card texture capture** | html2canvas | DOM capture on init + resize, fed as CanvasTexture to MeshBasicMaterial | Medium |
| Ocean scroll progress indicator | GSAP ScrollTrigger | Fixed position, gradient fill height driven by scroll progress 0→1, active dot via progress ranges | Low |
| Ocean mouse tilt | JS + Three.js uniform | Cursor position normalized to -1..1, lerped multiplier drives tiltX uniform at rate 0.1/frame | Medium |
| **Aurora canvas overlay** | 2D Canvas API | 6 animated quadraticCurveTo bands with shadow glow, compositeOperation screen, perlin noise softening option | **🔒 High** |
| **Sunset canvas (stars + mountains)** | 2D Canvas API | Fixed-seed star field (200 stars, 5 color tints, twinkle), 3-layer jagged mountain polygons, city glow gradient, 320×180 native resolution with pixelated rendering | **🔒 High** |

---

## State & Logic Plan

### Ocean Section — Imperative Three.js ↔ React Bridge

The ocean scene is fundamentally imperative (Three.js render loop, GSAP Flip DOM manipulation). It cannot be driven by React state without severe performance issues.

**Architecture**:
- `useOceanScene` hook encapsulates the entire Three.js lifecycle. It receives refs to the canvas element and card DOM elements.
- The hook holds all imperative state internally via `useRef` — never triggers React re-renders. This includes: scene, camera, renderer, clock, mesh references, shader uniform references, city light array, GSAP timeline, Flip placeholder refs.
- Scroll progress from ScrollTrigger is consumed directly in GSAP timeline callbacks — not stored in React state.
- Mouse position over the ocean section is tracked via a ref (not state) and lerped inside the render loop.
- **Cleanup**: The hook returns a cleanup function that disposes all Three.js resources (geometries, materials, textures, renderer, context loss) and kills ScrollTrigger instances. This is triggered by IntersectionObserver or ScrollTrigger onLeave — ocean disposes when scrolled past, re-initializes when scrolled back.

### Card DOM ↔ WebGL Synchronization

Each project card exists in two representations simultaneously:

1. **DOM element** — the actual HTML card, styled with CSS, interactive, accessible
2. **WebGL mesh** — a PlaneGeometry with the card's html2canvas texture, visible as the "floating" card on the ocean

The synchronization pipeline:
- 9 placeholder `<div>` elements are created at `document.body` level (3 states × 3 cards). Their inline styles define the 3 CSS positions per card.
- The GSAP ScrollTrigger timeline drives which state is active per card.
- On every `onUpdate` tick: `Flip.fit(actualCardDom, activePlaceholder, { scale: true, duration: 0 })` moves the DOM card to the placeholder's position.
- The WebGL mesh position is computed from the DOM card's `getBoundingClientRect()`: `mesh.position.set(domX + width/2 - innerWidth/2, -domY - height/2 + innerHeight/2, 0)` (Y inverted for Three.js coordinate system).
- The mesh's underwater distortion shader uniforms are set from the card's animation state (`underWater` / `focused` / `underWaterFull`).

**Key constraint**: The DOM cards must remain interactive (pointer-events) even while visually appearing to float on the ocean. The outer ocean container has `pointer-events: none`, but each card has `pointer-events: auto`.

### Lenis ↔ GSAP Ticker Synchronization

Lenis must be wired into GSAP's animation frame loop, not run independently:
- `lenis.on('scroll', ScrollTrigger.update)` — Lenis scroll events trigger ScrollTrigger recalculation
- `gsap.ticker.add(time => lenis.raf(time * 1000))` — GSAP's ticker drives Lenis's raf
- `gsap.ticker.lagSmoothing(0)` — disable lag smoothing for consistent playback
- This synchronization is set up once in `SmoothScrollProvider` and must be torn down on unmount.

### Aurora Visibility Gating

The aurora animation loop should not run when the hero is not visible:
- Use an IntersectionObserver on the hero section (or a ScrollTrigger) to toggle a `isVisible` ref.
- The `requestAnimationFrame` loop checks this ref and skips rendering when false. This saves CPU cycles on other sections.

---

## Other Key Decisions

**Single-file build**: Vite bundles everything. Three.js shaders are written as template literal strings in the source files — no GLSL loader needed. Raw GLSL is fed to `onBeforeCompile` for the ocean material and to `THREE.ShaderMaterial` for card meshes.

**No shadcn/ui**: The design uses fully custom glassmorphic components with specific border gradients, backdrop blur, and glow effects. No standard shadcn components match this aesthetic. Everything is custom-built with Tailwind.

**html2canvas async handling**: Card texture capture is async. The ocean scene initialization must wait for all 3 captures to complete before creating meshes. Show a loading state or simply delay card visibility until textures are ready.

**Reduced motion**: All GSAP timelines and shader time uniforms must be wrapped in `if (!prefersReducedMotion)`. On reduced motion: show static states, disable aurora animation, disable ocean wave time uniform (freeze at t=0), disable star twinkle.
