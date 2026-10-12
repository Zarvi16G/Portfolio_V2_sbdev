import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'
import { FontLoader, type Font } from 'three/addons/loaders/FontLoader.js'
import { useTimer } from '../hooks/useTimer'

// The skills die: a gray porcelain rounded cube with a thin wine decal on each face
// (count, "SKILLS" and the category name in low-relief 3D text). Slow auto-rotate, no zoom or pan.
// Hovering a category card turns its face to the camera; clicking a face selects its card.

export type DieFace = { title: string; count: number }
export type DieApi = { faceHover: (i: number) => void; activate: (i: number) => void }

const FONT_URL = '/fonts/Poppins_Bold.typeface.json'
const OUTER = 1.5, DIE = OUTER * 2, CARD = DIE * 0.8
const FACES = [
  { n: new THREE.Vector3(0, 0, 1), up: new THREE.Vector3(0, 1, 0) },
  { n: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3(0, 1, 0) },
  { n: new THREE.Vector3(0, 0, -1), up: new THREE.Vector3(0, 1, 0) },
  { n: new THREE.Vector3(-1, 0, 0), up: new THREE.Vector3(0, 1, 0) },
  { n: new THREE.Vector3(0, 1, 0), up: new THREE.Vector3(0, 0, -1) },
  { n: new THREE.Vector3(0, -1, 0), up: new THREE.Vector3(0, 0, 1) },
]
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y)
  return s
}
// vertical gradient baked into vertex colors
function gradient(geo: THREE.BufferGeometry, top: number, bottom: number) {
  geo.computeBoundingBox()
  const { min, max } = geo.boundingBox!, p = geo.attributes.position
  const col = new Float32Array(p.count * 3), a = new THREE.Color(top), b = new THREE.Color(bottom), c = new THREE.Color()
  for (let i = 0; i < p.count; i++) { c.copy(b).lerp(a, (p.getY(i) - min.y) / (max.y - min.y)); col.set([c.r, c.g, c.b], i * 3) }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return geo
}
// split long titles into two lines
function titleLines(str: string) {
  if (str.length <= 11 || !str.includes(' ')) return [str]
  const words = str.split(' '); let best = [str], diff = 1e9
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ')
    if (Math.abs(a.length - b.length) < diff) { diff = Math.abs(a.length - b.length); best = [a, b] }
  }
  return best
}

type Panel = { holder: THREE.Group; sticker: THREE.Group; cardMesh: THREE.Mesh; content: THREE.Group; hover: number }

function buildDie() {
  const group = new THREE.Group()
  const dieMat = new THREE.MeshPhysicalMaterial({ color: 0x9ea2ab, roughness: 0.28, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.04, sheen: 0.3, sheenRoughness: 0.5 })
  const die = new THREE.Mesh(new RoundedBoxGeometry(DIE, DIE, DIE, 10, 0.42), dieMat)
  group.add(die)
  const cardGeo = gradient(new THREE.ExtrudeGeometry(roundedRect(CARD, CARD, 0.3), { depth: 0.008, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 12 }), 0x9e1240, 0x3a0517)
  const cardMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.08, emissive: 0x5c0019, emissiveIntensity: 0 })
  const textMat = new THREE.MeshPhysicalMaterial({ color: 0xf1edf0, roughness: 0.3, metalness: 0.05, clearcoat: 1 })
  const numMat = new THREE.MeshPhysicalMaterial({ color: 0xffb3c8, roughness: 0.25, metalness: 0.1, clearcoat: 1 })
  const panels: Panel[] = FACES.map((f, i) => {
    const holder = new THREE.Group()                // sits exactly on the die face
    holder.position.copy(f.n).multiplyScalar(OUTER + 0.001)
    holder.up.copy(f.up); holder.lookAt(f.n.clone().multiplyScalar(10))
    const sticker = new THREE.Group()
    const cardMesh = new THREE.Mesh(cardGeo, cardMat.clone()); cardMesh.userData.panel = i
    const content = new THREE.Group(); content.position.z = 0.022   // letters embossed on the decal
    sticker.add(cardMesh, content); holder.add(sticker); group.add(holder)
    return { holder, sticker, cardMesh, content, hover: 0 }
  })
  const dispose = () => {
    die.geometry.dispose(); dieMat.dispose(); cardGeo.dispose(); cardMat.dispose(); textMat.dispose(); numMat.dispose()
    panels.forEach((p) => { (p.cardMesh.material as THREE.Material).dispose(); p.content.children.forEach((c) => (c as THREE.Mesh).geometry.dispose()) })
  }
  return { group, die, panels, textMat, numMat, dispose }
}

function text3D(font: Font, str: string, size: number, maxW: number, mat: THREE.Material) {
  const geo = new TextGeometry(str, { font, size, depth: Math.min(0.035, size * 0.08), curveSegments: 6, bevelEnabled: true, bevelThickness: 0.006, bevelSize: Math.min(0.01, size * 0.02), bevelSegments: 2 })
  geo.computeBoundingBox(); geo.center()
  const w = geo.boundingBox!.max.x - geo.boundingBox!.min.x
  const m = new THREE.Mesh(geo, mat)
  if (w > maxW) m.scale.setScalar(maxW / w)
  return m
}

type Anim = { t0: number; dur: number; q0: THREE.Quaternion; q1: THREE.Quaternion; then?: () => void }

function Die({ faces, word, interactive, reduceMotion, apiRef, onSelect }: {
  faces: DieFace[]; word: string; interactive: boolean; reduceMotion: boolean
  apiRef: React.RefObject<DieApi | null>; onSelect: (i: number) => void
}) {
  const font = useLoader(FontLoader, FONT_URL)
  const { gl, scene, camera, size } = useThree()
  const built = useMemo(buildDie, [])
  const controls = useRef<OrbitControlsImpl>(null)
  const anim = useRef<Anim | null>(null)
  const hovered = useRef(-1), panelHover = useRef(-1), selected = useRef(-1)
  const idleTimer = useRef(0)

  useEffect(() => () => built.dispose(), [built])

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env; scene.environmentIntensity = 0.8
    return () => { scene.environment = null; env.dispose(); pmrem.dispose() }
  }, [gl, scene])

  // the decals' text: count, "SKILLS" and the category name (rebuilt when the language changes)
  useEffect(() => {
    const maxW = CARD * 0.78
    built.panels.forEach((p, i) => {
      p.content.children.slice().forEach((c) => { (c as THREE.Mesh).geometry.dispose(); p.content.remove(c) })
      const d = faces[i]
      if (!d) return
      const num = text3D(font, String(d.count), 0.95, maxW, built.numMat); num.position.y = 0.42; p.content.add(num)
      const lbl = text3D(font, word, 0.16, maxW, built.textMat); lbl.position.y = -0.18; p.content.add(lbl)
      const lines = titleLines(d.title)
      lines.forEach((l, k) => { const t = text3D(font, l, 0.26, maxW, built.textMat); t.position.y = -0.62 - k * 0.34 + (lines.length - 1) * 0.1; p.content.add(t) })
    })
  }, [font, faces, word, built])

  // narrow screens: step back so the whole cube fits
  useLayoutEffect(() => {
    const need = size.width / size.height < 0.8 ? 12.5 : 8.5
    if (camera.position.lengthSq() === 0) camera.position.set(3.4, 2.4, 6.8)
    if (!anim.current) camera.position.setLength(need)
  }, [camera, size])

  // the rotation that brings face i to the camera, text upright
  const alignQuat = (i: number) => {
    const f = FACES[i]
    const zL = f.n.clone(), yL = f.up.clone(), xL = new THREE.Vector3().crossVectors(yL, zL)
    const Lm = new THREE.Matrix4().makeBasis(xL, yL, zL)
    const target = controls.current?.target ?? new THREE.Vector3()
    const zW = camera.position.clone().sub(target).normalize()
    const yW = camera.up.clone().sub(zW.clone().multiplyScalar(camera.up.dot(zW))).normalize()
    const xW = new THREE.Vector3().crossVectors(yW, zW)
    const Wm = new THREE.Matrix4().makeBasis(xW, yW, zW)
    return new THREE.Quaternion().setFromRotationMatrix(Wm.multiply(Lm.invert()))
  }
  const setAutoRotate = (on: boolean) => { if (controls.current) controls.current.autoRotate = on && !reduceMotion }

  useEffect(() => {
    const api: DieApi = {
      faceHover(i) {
        panelHover.current = i
        clearTimeout(idleTimer.current)
        if (i < 0) { idleTimer.current = window.setTimeout(() => { if (!anim.current) setAutoRotate(true) }, 2500); return }
        setAutoRotate(false)
        anim.current = { t0: performance.now(), dur: reduceMotion ? 1 : 700, q0: built.group.quaternion.clone(), q1: alignQuat(i) }
      },
      activate(i) {
        setAutoRotate(false)
        anim.current = { t0: performance.now(), dur: reduceMotion ? 1 : 600, q0: built.group.quaternion.clone(), q1: alignQuat(i), then: () => { selected.current = i; onSelect(i) } }
        clearTimeout(idleTimer.current)
        idleTimer.current = window.setTimeout(() => { if (!anim.current && panelHover.current < 0) setAutoRotate(true) }, 4000)
      },
    }
    apiRef.current = api
    return () => { apiRef.current = null; clearTimeout(idleTimer.current) }
  })

  // ---- picking: only the decals (the die body blocks what is behind it) ----
  useEffect(() => {
    const canvas = gl.domElement
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2()
    const pickables = [built.die, ...built.panels.map((p) => p.cardMesh)]
    const pick = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      const hit = ray.intersectObjects(pickables, false)[0]
      return !hit || hit.object === built.die ? -1 : (hit.object.userData.panel as number)
    }
    let downAt: [number, number] | null = null
    const down = (e: PointerEvent) => { downAt = [e.clientX, e.clientY] }
    const up = (e: PointerEvent) => {
      if (!downAt || !interactive) return
      const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]); downAt = null
      if (moved > 6) return
      const i = pick(e); if (i >= 0) apiRef.current?.activate(i)
    }
    const move = (e: PointerEvent) => {
      hovered.current = anim.current || !interactive ? -1 : pick(e)
      canvas.style.cursor = hovered.current >= 0 ? 'pointer' : 'grab'
    }
    const leave = () => { hovered.current = -1 }
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerleave', leave)
    return () => {
      canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave)
    }
  }, [gl, camera, built, interactive, apiRef])

  const timer = useTimer()
  useFrame(() => {
    timer.update()
    const dt = Math.min(timer.getDelta(), 0.05)
    const a = anim.current
    if (a) {
      const t = Math.min(1, (performance.now() - a.t0) / a.dur)
      built.group.quaternion.slerpQuaternions(a.q0, a.q1, ease(t))
      if (t >= 1) { anim.current = null; a.then?.() }
    }
    // hover: the sticker lifts off the face a little and grows
    built.panels.forEach((p, i) => {
      const lit = i === hovered.current || i === panelHover.current || i === selected.current
      p.hover += ((lit ? 1 : 0) - p.hover) * (1 - Math.exp(-10 * dt))
      p.sticker.position.z = p.hover * 0.015
      p.sticker.scale.setScalar(1 + p.hover * 0.02)
      ;(p.cardMesh.material as THREE.MeshPhysicalMaterial).emissiveIntensity = p.hover * 0.9
    })
    if (controls.current) controls.current.enabled = !anim.current && interactive
  })

  return (
    <>
      <directionalLight color={0xffffff} intensity={1.8} position={[-5, 7, 8]} />
      <directionalLight color={0xff8fb0} intensity={0.7} position={[6, -2, -5]} />
      <ambientLight intensity={0.15} />
      <primitive object={built.group} />
      <OrbitControls ref={controls} makeDefault enableZoom={false} enablePan={false} enableDamping autoRotate={!reduceMotion} autoRotateSpeed={0.6} />
    </>
  )
}

export function SkillsDie(props: React.ComponentProps<typeof Die>) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      camera={{ fov: 40, near: 0.05, far: 100, position: [3.4, 2.4, 6.8] }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <Suspense fallback={null}>
        <Die {...props} />
      </Suspense>
    </Canvas>
  )
}
