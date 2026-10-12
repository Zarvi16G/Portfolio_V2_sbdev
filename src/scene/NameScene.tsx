import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'
import { FontLoader, type Font } from 'three/addons/loaders/FontLoader.js'
import { NAME_LINES, UI } from '../data/content'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useUiLayoutVersion } from '../hooks/useUiLayout'
import { useLang } from '../i18n/lang'
import { crackle } from '../three/crackleTexture'
import { layoutLine, LINE_GAP } from '../three/nameLayout'
import { splitEdges } from '../three/splitEdges'
import { useTimer } from '../hooks/useTimer'

// The name in 3D porcelain: gray crackle front, solid wine sides, two curved lines.
// Small (~20% of the screen height, 16% on phones), just under the keys.

const FONT_URL = '/fonts/Poppins_Bold.typeface.json'
const GEO = { size: 1, depth: 0.26, curveSegments: 14, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.032, bevelOffset: 0, bevelSegments: 10 }

function glaze(base: number, crack: number, side: boolean) {
  const { map, bump } = crackle(base, crack)
  const tex = (c: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.1, 1.1); t.anisotropy = 8
    if (srgb) t.colorSpace = THREE.SRGBColorSpace
    return t
  }
  return new THREE.MeshPhysicalMaterial({
    map: tex(map, true), bumpMap: tex(bump, false), bumpScale: 1.6,
    roughness: side ? 0.35 : 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, sheen: 0.3, sheenRoughness: 0.6, ior: 1.5,
    emissive: new THREE.Color(side ? 0x5c0019 : 0x000000), emissiveIntensity: side ? 0.3 : 0,
  })
}

type LetterData = { home: THREE.Vector3; rotY: number; s: number; order: number }

function buildName(font: Font) {
  const front = glaze(0x9ea2ab, 0x464a53, false)   // gray glaze, dark graphite cracks
  const side = glaze(0x8c0b2f, 0x4a0518, true)     // solid wine glaze, darker cracks
  const mats = [front, side, side]
  const scaleU = 1 / font.data.resolution
  const glyphs = font.data.glyphs as Record<string, { ha?: number }>
  const cache = new Map<string, { geo: THREE.BufferGeometry; center: THREE.Vector3 }>()
  const glyph = (ch: string) => {
    let g = cache.get(ch)
    if (!g) {
      const geo = splitEdges(new TextGeometry(ch, { font, ...GEO }), GEO.depth)
      geo.computeBoundingBox()
      const center = geo.boundingBox!.getCenter(new THREE.Vector3())
      geo.translate(-center.x, -center.y, -center.z)    // pivot at the letter's center, so it pops in place
      g = { geo, center }; cache.set(ch, g)
    }
    return g
  }

  const word = new THREE.Group()
  const letters: THREE.Mesh[] = []
  let order = 0
  NAME_LINES.forEach((line, li) => {
    const lineY = -li * LINE_GAP
    const chars = [...line].map((ch) => ({ ch, adv: (glyphs[ch]?.ha ?? 500) * scaleU }))
    for (const c of layoutLine(chars)) {
      const { geo, center } = glyph(c.ch)
      const m = new THREE.Mesh(geo, mats)
      const data: LetterData = { home: new THREE.Vector3(c.x, lineY + center.y * c.s, c.z), rotY: -c.theta, s: c.s, order: order++ }
      m.userData = data
      m.position.copy(data.home); m.rotation.y = data.rotY; m.scale.setScalar(c.s)
      word.add(m); letters.push(m)
    }
  })
  // center the whole name on its bounding box
  const bounds = new THREE.Box3().setFromObject(word)
  word.position.copy(bounds.getCenter(new THREE.Vector3()).negate())
  bounds.setFromObject(word)

  const dispose = () => {
    cache.forEach(({ geo }) => geo.dispose())
    for (const m of [front, side]) { m.map?.dispose(); m.bumpMap?.dispose(); m.dispose() }
  }
  return { word, letters, bounds, dispose }
}

const easeOutBack = (t: number) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2) }
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

// bottom of the section keys in px (before the keys exist: 80)
function keysBottom() {
  const keys = document.querySelector('.keys')
  return keys ? keys.getBoundingClientRect().bottom : 80
}

function Name({ introStart }: { introStart: React.RefObject<number> }) {
  const font = useLoader(FontLoader, FONT_URL)
  const reduceMotion = useReducedMotion()
  const uiLayout = useUiLayoutVersion()
  const { gl, scene, camera, size } = useThree()
  const name = useMemo(() => buildName(font), [font])
  const pivot = useRef<THREE.Group>(null)
  const pointer = useRef(new THREE.Vector2())

  useEffect(() => () => name.dispose(), [name])

  // soft studio reflections: what makes porcelain read as porcelain
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    scene.environmentIntensity = 0.85
    return () => { scene.environment = null; env.dispose(); pmrem.dispose() }
  }, [gl, scene])

  // the intro starts when the name is ready
  useEffect(() => { introStart.current = performance.now() }, [name, introStart])

  useEffect(() => {
    const onMove = (e: PointerEvent) => pointer.current.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1)
    addEventListener('pointermove', onMove)
    return () => removeEventListener('pointermove', onMove)
  }, [])

  // ---- fit: small, centered 14px under the keys ----
  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    const { width: w, height: h } = size
    if (!w || !h) return
    const { bounds } = name
    cam.aspect = w / h
    const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2), tanH = tanV * cam.aspect
    const targetH = h * (w < 640 ? 0.16 : 0.2)                     // name height in px
    const margin = w < 640 ? 0.86 : 0.6                            // max share of the width
    const halfW = Math.max(Math.abs(bounds.min.x), Math.abs(bounds.max.x))
    const halfH = Math.max(Math.abs(bounds.min.y), Math.abs(bounds.max.y))
    const dW = halfW / (tanH * margin) + bounds.max.z
    const dH = halfH / (tanV * (targetH / h)) + bounds.max.z
    const fitDist = Math.max(dW, dH)
    const realH = (halfH / ((fitDist - bounds.max.z) * tanV)) * h  // px
    const centerPx = keysBottom() + 14 + realH / 2
    const yc = 1 - (2 * centerPx) / h                               // NDC of the name center
    const nameLift = -yc * fitDist * tanV
    cam.position.set(0, nameLift, fitDist)
    cam.lookAt(0, nameLift, 0)
    cam.updateProjectionMatrix()
  }, [camera, size, name, uiLayout])

  const timer = useTimer()
  useFrame(() => {
    timer.update()
    const delta = timer.getDelta()
    const now = performance.now()
    for (const m of name.letters) {
      const { home, order, rotY, s: hs } = m.userData as LetterData
      const local = reduceMotion ? 1 : THREE.MathUtils.clamp((now - introStart.current - order * 70) / 900, 0, 1)
      const p = easeOutBack(local)
      const s = easeOutCubic(Math.min(local * 1.6, 1))
      m.scale.setScalar(Math.max(s * hs, 0.0001))
      m.position.set(home.x, home.y - (1 - p) * 0.9, home.z + (1 - p) * 0.6)
      m.rotation.set((1 - p) * 1.1, rotY - (1 - p) * 0.5, 0)
    }
    // subtle tilt toward the pointer so the glaze catches the light
    const g = pivot.current
    if (!g) return
    const k = 1 - Math.exp(-3 * Math.min(delta, 0.05))
    const idle = reduceMotion ? 0 : Math.sin(timer.getElapsed() * 0.6) * 0.03
    g.rotation.y += (pointer.current.x * 0.22 + idle - g.rotation.y) * k
    g.rotation.x += (-pointer.current.y * 0.14 - g.rotation.x) * k
  })

  return (
    <group ref={pivot}>
      <primitive object={name.word} />
    </group>
  )
}

// paused: a section covers the name (it has faded out), so it stops rendering and leaves the tab order
export function NameCanvas({ paused = false }: { paused?: boolean }) {
  const { t } = useLang()
  const introStart = useRef(performance.now())
  const replay = () => { introStart.current = performance.now() }

  return (
    <div
      className="name-canvas"
      role="button"
      tabIndex={0}
      aria-label={t(UI.nameLabel)}
      inert={paused}
      onMouseDown={(e) => e.preventDefault()}   // a mouse click replays the intro without leaving a focus ring
      onClick={replay}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); replay() } }}
    >
      <Canvas
        frameloop={paused ? 'never' : 'always'}
        dpr={[1, 2]}
        resize={{ offsetSize: true, scroll: false }}   // measure the layout box: sections scale these canvases
        gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        camera={{ fov: 30, near: 0.1, far: 200 }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <directionalLight color={0xffffff} intensity={1.6} position={[-4, 6, 8]} />
        <directionalLight color={0xbfd0ff} intensity={0.8} position={[5, 2, -6]} />
        <ambientLight intensity={0.15} />
        <Suspense fallback={null}>
          <Name introStart={introStart} />
        </Suspense>
      </Canvas>
    </div>
  )
}
