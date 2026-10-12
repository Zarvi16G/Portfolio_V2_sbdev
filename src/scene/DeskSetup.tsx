import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, type Ref } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { codeScreen } from './CodeScreen'
import { roomBridge } from './roomBridge'
import { WateringCan } from './WateringCan'

// The cartoon desk setup: desk with a wine LED strip, two code monitors, keyboard, mouse,
// a small plant, a gaming chair and a person seen from behind with the right hand on the mouse.
// Built imperatively (same numbers as reference.html) and mounted with <primitive>.

export type SetupKind = 'plant' | 'person'

// soft radial "blob" texture for cartoon shadows (no shadow maps)
export function blobTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128
  const g = c.getContext('2d')!, gr = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  gr.addColorStop(0, 'rgba(40,24,16,1)'); gr.addColorStop(0.55, 'rgba(40,24,16,0.55)'); gr.addColorStop(1, 'rgba(40,24,16,0)')
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

function buildSetup(reduceMotion: boolean, blobTex: THREE.Texture) {
  const setup = new THREE.Group()
  const mat = (color: number, o: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...o })
  const M = {
    desk: mat(0x2a2830), deskDark: mat(0x1c1b20), mat: mat(0x3a1622, { roughness: 0.9 }),
    bezel: mat(0x141317, { roughness: 0.4 }), metal: mat(0x3a3840, { roughness: 0.35, metalness: 0.4 }),
    chair: mat(0x232127, { roughness: 0.6 }), wine: mat(0x8c0b2f, { roughness: 0.5 }),
    hoodie: mat(0xb9bcc4, { roughness: 0.8 }), skin: mat(0xe2b48e, { roughness: 0.7 }), hair: mat(0x2b1f1b, { roughness: 0.75 }),
    phones: mat(0x8c0b2f, { roughness: 0.35 }), pants: mat(0x2f3340, { roughness: 0.8 }),
    led: new THREE.MeshBasicMaterial({ color: 0xff3d78, toneMapped: false }),
    pot: mat(0x9ea2ab, { roughness: 0.3 }), leaf: mat(0x4f7a52, { roughness: 0.7 }),
  }
  function rbox(w: number, h: number, d: number, r: number, material: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = setup) {
    const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2, h / 2, d / 2)), material)
    m.position.set(x, y, z); parent.add(m); return m
  }
  function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, material: THREE.Material, parent: THREE.Object3D = setup) {   // a capsule between two points
    const dir = new THREE.Vector3().subVectors(b, a), len = dir.length()
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(len, 0.001), 6, 12), material)
    m.position.copy(a).add(b).multiplyScalar(0.5)
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
    parent.add(m); return m
  }
  const ball = (r: number, material: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = setup) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), material); m.position.set(x, y, z); parent.add(m); return m
  }
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
  function blob(w: number, d: number, opacity: number) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity, depthWrite: false, toneMapped: false }))
    m.rotation.x = -Math.PI / 2; m.renderOrder = 1
    return m
  }

  // desk (against the wall), with a wine LED strip under the front edge
  rbox(1.62, 0.06, 0.7, 0.02, M.desk, 0, 0.74, 0.4)
  rbox(0.05, 0.71, 0.62, 0.015, M.deskDark, -0.75, 0.355, 0.4)
  rbox(0.05, 0.71, 0.62, 0.015, M.deskDark, 0.75, 0.355, 0.4)
  rbox(1.45, 0.08, 0.03, 0.01, M.deskDark, 0, 0.62, 0.12)
  const strip = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.012, 0.012), M.led); strip.position.set(0, 0.705, 0.745); setup.add(strip)
  rbox(1.1, 0.008, 0.4, 0.004, M.mat, 0.02, 0.774, 0.53)

  // two monitors turned a little toward the chair; their screens are canvases with code
  const screens: ReturnType<typeof codeScreen>[] = []
  ;([[-0.34, 0.17, 7, false], [0.34, -0.17, 19, true]] as const).forEach(([x, ry, seed, mark]) => {
    const mon = new THREE.Group(); mon.position.set(x, 0, 0.28); mon.rotation.y = ry; setup.add(mon)
    rbox(0.66, 0.39, 0.035, 0.012, M.bezel, 0, 1.13, 0, mon)
    rbox(0.3, 0.2, 0.05, 0.02, M.bezel, 0, 1.12, -0.035, mon)
    rbox(0.045, 0.3, 0.03, 0.01, M.metal, 0, 0.92, -0.06, mon)
    rbox(0.24, 0.016, 0.17, 0.008, M.metal, 0, 0.785, -0.02, mon)
    const scr = codeScreen(seed, mark, reduceMotion); screens.push(scr)
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.349), new THREE.MeshBasicMaterial({ map: scr.tex, toneMapped: false }))
    s.position.set(0, 1.135, 0.0185); mon.add(s)
  })
  // keyboard and mouse
  rbox(0.46, 0.022, 0.15, 0.008, M.bezel, -0.12, 0.79, 0.56)
  const kbGlow = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.004, 0.12), new THREE.MeshBasicMaterial({ color: 0x5a0f26, toneMapped: false }))
  kbGlow.position.set(-0.12, 0.802, 0.56); setup.add(kbGlow)
  const mouse = rbox(0.065, 0.03, 0.105, 0.015, M.bezel, 0.42, 0.792, 0.57)

  // a small plant on the desk
  const PLANT_FROM = setup.children.length
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.1, 20), M.pot); pot.position.set(0.68, 0.82, 0.3); setup.add(pot)
  const leaves: THREE.Mesh[] = []
  for (let i = 0; i < 5; i++) {
    const lf = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), M.leaf)
    const a = (i / 5) * Math.PI * 2; lf.scale.set(0.6, 1.4, 0.6)
    lf.position.set(0.68 + Math.cos(a) * 0.035, 0.92, 0.3 + Math.sin(a) * 0.035); lf.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5)
    setup.add(lf); leaves.push(lf)
  }
  const PLANT_TO = setup.children.length

  // gaming chair (back toward us), black with wine panels
  const PERSON_FROM = setup.children.length
  const chair = new THREE.Group(); chair.position.set(0, 0, 1.18); setup.add(chair)
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3
    const leg = rbox(0.05, 0.035, 0.3, 0.012, M.chair, Math.sin(a) * 0.15, 0.07, Math.cos(a) * 0.15, chair); leg.rotation.y = a
    ball(0.03, M.chair, Math.sin(a) * 0.29, 0.03, Math.cos(a) * 0.29, chair)
  }
  const gas = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.32, 16), M.metal); gas.position.set(0, 0.26, 0); chair.add(gas)
  rbox(0.52, 0.09, 0.5, 0.04, M.chair, 0, 0.46, 0, chair)
  rbox(0.07, 0.1, 0.48, 0.03, M.wine, -0.25, 0.49, 0, chair)
  rbox(0.07, 0.1, 0.48, 0.03, M.wine, 0.25, 0.49, 0, chair)
  const back = new THREE.Group(); back.position.set(0, 0.5, 0.24); back.rotation.x = 0.12; chair.add(back)
  rbox(0.5, 0.58, 0.09, 0.05, M.chair, 0, 0.32, 0, back)
  rbox(0.07, 0.5, 0.02, 0.01, M.wine, -0.15, 0.3, 0.046, back)
  rbox(0.07, 0.5, 0.02, 0.01, M.wine, 0.15, 0.3, 0.046, back)
  rbox(0.28, 0.1, 0.07, 0.035, M.wine, 0, 0.56, 0.02, back)
  rbox(0.06, 0.03, 0.26, 0.012, M.chair, -0.29, 0.66, -0.02, chair)
  rbox(0.06, 0.03, 0.26, 0.012, M.chair, 0.29, 0.66, -0.02, chair)
  rbox(0.03, 0.16, 0.03, 0.01, M.chair, -0.29, 0.57, 0.05, chair)
  rbox(0.03, 0.16, 0.03, 0.01, M.chair, 0.29, 0.57, 0.05, chair)

  // the person: seen from behind, headphones on, right hand on the mouse
  limb(v(-0.1, 0.55, 1.05), v(-0.1, 0.55, 0.78), 0.075, M.pants)      // thighs
  limb(v(0.1, 0.55, 1.05), v(0.1, 0.55, 0.78), 0.075, M.pants)
  limb(v(-0.1, 0.53, 0.76), v(-0.1, 0.12, 0.74), 0.06, M.pants)       // shins
  limb(v(0.1, 0.53, 0.76), v(0.1, 0.12, 0.74), 0.06, M.pants)
  rbox(0.09, 0.06, 0.16, 0.03, M.deskDark, -0.1, 0.05, 0.7)           // shoes
  rbox(0.09, 0.06, 0.16, 0.03, M.deskDark, 0.1, 0.05, 0.7)
  limb(v(0, 0.66, 1.16), v(0, 0.96, 1.13), 0.17, M.hoodie)            // torso
  limb(v(-0.2, 1.03, 1.12), v(0.2, 1.03, 1.12), 0.1, M.hoodie)        // shoulders
  ball(0.05, M.skin, 0, 1.12, 1.12)                                    // neck
  const head = new THREE.Group(); head.position.set(0, 1.27, 1.11); setup.add(head)
  ball(0.14, M.skin, 0, 0, 0, head)
  const hair = ball(0.147, M.hair, 0, 0.018, 0.022, head); hair.scale.set(1, 1, 0.98)
  ball(0.032, M.skin, -0.14, -0.01, 0, head); ball(0.032, M.skin, 0.14, -0.01, 0, head)
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.158, 0.016, 8, 32, Math.PI), M.phones); band.position.set(0, 0, -0.005); head.add(band)
  ;[-1, 1].forEach((sx) => { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.04, 24), M.phones); cup.rotation.z = Math.PI / 2; cup.position.set(sx * 0.155, -0.01, 0); head.add(cup) })
  // left arm to the keyboard
  limb(v(-0.25, 1.02, 1.1), v(-0.33, 0.84, 0.84), 0.055, M.hoodie)
  limb(v(-0.33, 0.84, 0.84), v(-0.2, 0.82, 0.6), 0.048, M.hoodie)
  ball(0.042, M.skin, -0.18, 0.815, 0.57)
  // right arm to the mouse: the hand is a group so it can click
  const hand = new THREE.Group(); hand.position.set(0.42, 0.825, 0.585); setup.add(hand)
  ball(0.044, M.skin, 0, 0, 0, hand).scale.set(1, 0.75, 1.15)
  const finger = limb(v(-0.012, 0.012, -0.03), v(-0.012, 0.004, -0.075), 0.012, M.skin, hand)
  const fingerHome = finger.position.clone(), fingerQ = finger.quaternion.clone()
  limb(v(0.25, 1.02, 1.1), v(0.38, 0.85, 0.85), 0.055, M.hoodie)
  limb(v(0.38, 0.85, 0.85), v(0.42, 0.83, 0.62), 0.048, M.hoodie)
  const PERSON_TO = setup.children.length

  // tag the parts so a click on them can be recognized (speech bubbles, phase 5)
  const tag = (from: number, to: number, kind: SetupKind) =>
    setup.children.slice(from, to).forEach((o) => o.traverse((m) => { m.userData.kind = kind }))
  tag(PLANT_FROM, PLANT_TO, 'plant')
  tag(PERSON_FROM, PERSON_TO, 'person')

  // blob shadows on the floor under the desk and the chair
  const sh1 = blob(2.1, 1.1, 0.42); sh1.position.set(0, 0.003, 0.42); setup.add(sh1)
  const sh2 = blob(0.95, 0.95, 0.45); sh2.position.set(0, 0.004, 1.18); setup.add(sh2)

  // the whole setup turned a little, so it reads in 3D
  setup.rotation.y = -0.3
  setup.position.set(0, 0, 0.3)

  return { setup, screens, hand, finger, fingerHome, fingerQ, mouse, pot, leaves }
}

// 0..1 press amount: clicks every ~1.7 s, a double click every third time
function clickAt(t: number) {
  const period = 1.7, k = t % period, n = Math.floor(t / period)
  const press = (x: number) => Math.max(0, 1 - Math.abs(x - 0.06) / 0.06)
  let p = press(k)
  if (n % 3 === 1) p = Math.max(p, press(k - 0.2))
  return p
}
// where each speech bubble points (setup space): the person's head, the top of the plant
const ANCHORS: Record<SetupKind, THREE.Vector3> = { person: new THREE.Vector3(0, 1.47, 1.11), plant: new THREE.Vector3(0.68, 1.0, 0.3) }
const PLANT_RAISE = 0.26   // the plant's bubble moves up while watering so the can stays visible

const FINGER_DOWN = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.35)
const IDENTITY = new THREE.Quaternion()

export type SetupParts = ReturnType<typeof buildSetup>

export function DeskSetup({ reduceMotion, blobTex, ref }: { reduceMotion: boolean; blobTex: THREE.Texture; ref?: Ref<SetupParts> }) {
  const parts = useMemo(() => buildSetup(reduceMotion, blobTex), [reduceMotion, blobTex])

  // layout effect: the parent's framing (also a layout effect) needs the parts on first paint
  useLayoutEffect(() => {
    if (typeof ref === 'function') ref(parts)
    else if (ref) ref.current = parts
    return () => {
      parts.setup.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return
        o.geometry.dispose()
        const m = o.material as THREE.MeshBasicMaterial
        if (m.map && m.map !== blobTex) m.map.dispose()
        m.dispose()
      })
    }
  }, [parts, ref, blobTex])

  // clicks on the person or the plant (speech bubbles): raycast + projection for the HTML bubbles
  const { camera, gl } = useThree()
  useLayoutEffect(() => {
    const pickables = parts.setup.children.filter((o) => o.userData.kind === 'plant' || o.userData.kind === 'person')
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), a = new THREE.Vector3()
    roomBridge.pick = (x, y) => {
      const r = gl.domElement.getBoundingClientRect()
      ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      const hit = ray.intersectObjects(pickables, true)[0]
      return hit ? (hit.object.userData.kind as SetupKind) : null
    }
    roomBridge.project = (kind, raised) => {
      a.copy(ANCHORS[kind]); if (raised) a.y += PLANT_RAISE
      parts.setup.updateWorldMatrix(true, false)
      const p = parts.setup.localToWorld(a).project(camera)
      const r = gl.domElement.getBoundingClientRect()
      return { x: r.left + ((p.x + 1) / 2) * r.width, y: r.top + ((1 - p.y) / 2) * r.height }
    }
    return () => { roomBridge.pick = null; roomBridge.project = null }
  }, [parts, camera, gl])

  const q = useMemo(() => new THREE.Quaternion(), [])
  useFrame(({ clock }) => {
    if (reduceMotion) return
    const now = clock.elapsedTime * 1000
    parts.screens.forEach((s) => s.update(now))
    const p = clickAt(clock.elapsedTime)
    parts.hand.position.y = 0.825 - p * 0.008
    parts.finger.quaternion.copy(parts.fingerQ).premultiply(q.copy(IDENTITY).slerp(FINGER_DOWN, p))
    parts.finger.position.copy(parts.fingerHome).setY(parts.fingerHome.y - p * 0.006)
    parts.mouse.position.y = 0.792 - p * 0.002
  })

  return (
    <>
      <primitive object={parts.setup} />
      <WateringCan parts={parts} reduceMotion={reduceMotion} />
    </>
  )
}
