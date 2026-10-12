import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { SetupParts } from './DeskSetup'
import { roomBridge } from './roomBridge'
import { useTimer } from '../hooks/useTimer'

// A watering can next to the plant: 0-0.4 s grow, 0.4-0.9 s tilt, 0.9-3.6 s pour (a drop every 45 ms),
// 3.6-4.0 s untilt, 4.0-4.4 s shrink. Then the plant grows 5%.
const TIP = new THREE.Vector3(-0.16, 0.066, 0)
const ease = (x: number) => x * x * (3 - 2 * x), clamp01 = (x: number) => Math.min(1, Math.max(0, x))

function buildCan() {
  const mat = (color: number, o: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...o })
  const canMat = mat(0x9ea2ab, { roughness: 0.35, metalness: 0.3 }), wine = mat(0x8c0b2f, { roughness: 0.5 })
  const can = new THREE.Group(); can.position.set(0.86, 1.13, 0.32); can.scale.setScalar(0.0001)
  can.add(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.062, 0.11, 24), canMat))
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.006, 8, 24), wine); rim.rotation.x = Math.PI / 2; rim.position.y = 0.055; can.add(rim)
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.011, 0.14, 12), canMat); spout.position.set(-0.085, 0.03, 0); spout.rotation.z = Math.PI / 2 - 0.45; can.add(spout)
  const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.008, 0.02, 12), wine); rose.position.set(-0.148, 0.061, 0); rose.rotation.z = Math.PI / 2 - 0.45; can.add(rose)
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.007, 8, 20, Math.PI), wine); handle.position.set(0.058, 0.01, 0); handle.rotation.z = -Math.PI / 2; can.add(handle)
  const dropMat = new THREE.MeshBasicMaterial({ color: 0x7fb8f0, toneMapped: false }), dropGeo = new THREE.SphereGeometry(0.0075, 8, 6)
  const drops = Array.from({ length: 28 }, () => { const d = new THREE.Mesh(dropGeo, dropMat); d.visible = false; d.userData.v = new THREE.Vector3(); return d })
  return { can, drops }
}

export function WateringCan({ parts, reduceMotion }: { parts: SetupParts; reduceMotion: boolean }) {
  const { can, drops } = useMemo(buildCan, [])
  const state = useRef<{ start: number; lastDrop: number; onDone: () => void } | null>(null)
  const grown = useRef(1)
  const tip = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    parts.setup.add(can, ...drops)
    const finish = (onDone: () => void) => {
      state.current = null
      grown.current = Math.min(1.15, grown.current + 0.05)
      parts.leaves.forEach((l) => { l.scale.set(0.6 * grown.current, 1.4 * grown.current, 0.6 * grown.current); l.rotation.y = 0 })
      onDone()
    }
    roomBridge.water = (onDone) => {
      if (state.current) return
      if (reduceMotion) { finish(onDone); return }
      state.current = { start: performance.now(), lastDrop: 0, onDone: () => finish(onDone) }
    }
    return () => {
      parts.setup.remove(can, ...drops)
      roomBridge.water = null
      state.current = null
    }
  }, [parts, can, drops, reduceMotion])

  useEffect(() => () => {
    can.traverse((o) => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); (o.material as THREE.Material).dispose() } })
    drops[0].geometry.dispose(); (drops[0].material as THREE.Material).dispose()
  }, [can, drops])

  const timer = useTimer()
  useFrame(() => {
    timer.update()
    const w = state.current
    if (!w) return
    const now = performance.now(), dt = Math.min(0.05, timer.getDelta())
    const t = (now - w.start) / 1000
    can.scale.setScalar(Math.max(0.0001, t < 0.4 ? ease(t / 0.4) : t > 4 ? 1 - ease(clamp01((t - 4) / 0.4)) : 1))
    const tilt = t < 0.4 ? 0 : t < 0.9 ? ease((t - 0.4) / 0.5) : t < 3.6 ? 1 : ease(1 - clamp01((t - 3.6) / 0.4))
    can.rotation.z = tilt * 0.8
    if (t > 0.9 && t < 3.6 && now - w.lastDrop > 45) {               // a new drop from the spout
      const d = drops.find((x) => !x.visible)
      if (d) {
        can.updateMatrixWorld(); tip.copy(TIP); can.localToWorld(tip); parts.setup.worldToLocal(tip)
        d.position.copy(tip); (d.userData.v as THREE.Vector3).set(-0.05 - Math.random() * 0.1, -0.05, (Math.random() - 0.5) * 0.06); d.visible = true
      }
      w.lastDrop = now
    }
    for (const d of drops) {
      if (!d.visible) continue
      const v = d.userData.v as THREE.Vector3
      v.y -= 2.6 * dt; d.position.addScaledVector(v, dt)
      if (d.position.y < 0.875) d.visible = false                     // landed in the pot
    }
    const wiggle = t > 1 && t < 3.8 ? Math.sin(t * 14) * 0.08 : 0
    parts.leaves.forEach((l, i) => { l.rotation.y = wiggle * (i % 2 ? 1 : -1) })
    if (t >= 4.4) { can.scale.setScalar(0.0001); drops.forEach((d) => { d.visible = false }); w.onDone() }
  })

  return null
}
