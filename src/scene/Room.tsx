import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useUiLayoutVersion } from '../hooks/useUiLayout'
import { blobTexture, DeskSetup, type SetupParts } from './DeskSetup'

// The room: textured cream wall on top, warm oak plank floor below, the desk setup on the floor.
// The wall/floor line sits at ~70% of the screen height (higher on phones so the tiles fit).

const FOV = 28, CAM_H = 2.0, CAM_D = 8.0

// ---- wall and floor: shaders, so the cream texture stays exact (not affected by lights) ----
const shared = /* glsl */ `
  uniform float uDpr; uniform vec2 uRes;
  varying vec3 vW;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  vec2 ripples(vec2 p) {
    float t = 4.0; vec2 d = vec2(0.0);
    d += vec2(cos(p.x * 3.1 + t * 1.7), sin(p.y * 2.7 - t * 1.3)) * 0.06;
    d += vec2(sin(p.y * 5.3 + p.x * 1.9 + t * 2.3), cos(p.x * 4.7 - p.y * 2.2 - t * 2.1)) * 0.04;
    d += vec2(cos((p.x - p.y) * 8.9 + t * 3.1), sin((p.x + p.y) * 9.7 - t * 2.9)) * 0.025;
    return d;
  }
  float grainAt() { return hash(floor(gl_FragCoord.xy / max(uDpr, 1.0))) - 0.5; }
  float vignette() { vec2 uv = gl_FragCoord.xy / uRes; return 0.94 + 0.06 * smoothstep(1.1, 0.2, length(uv - 0.5)); }
`
const vert = /* glsl */ `varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`

const wallFrag = shared + /* glsl */ `
  void main() {
    vec3 cream = vec3(0.888, 0.807, 0.665);    // #f2e8d5 (linear)
    vec3 warm  = vec3(0.760, 0.640, 0.470);
    vec2 p = vW.xy * 1.25;
    float cloud = 0.5 + 0.25 * sin(p.x * 0.9 + sin(p.y * 0.7) * 1.3) * sin(p.y * 1.1 + sin(p.x * 0.5) * 1.6)
                + 0.12 * sin(p.x * 2.3 + p.y * 1.7) * sin(p.y * 2.9 - p.x * 1.1);
    vec2 q = p * 1.4 + ripples(p) * 3.0;
    float v = abs(sin(q.x * 2.3 + sin(q.y * 1.7) * 1.5) * sin(q.y * 2.9 + sin(q.x * 1.3) * 1.2));
    float vein = 1.0 - smoothstep(0.0, 0.07, v);
    vec3 col = mix(cream, warm, (1.0 - cloud) * 0.18 + vein * 0.22);
    col *= 1.0 - 0.22 * exp(-vW.y * 3.2);      // soft shade where the wall meets the floor
    col += grainAt() * 0.035;
    col *= vignette();
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`

const floorFrag = shared + /* glsl */ `
  void main() {
    // warm oak planks running toward the wall (their lines show the depth)
    vec3 oak  = vec3(0.520, 0.360, 0.215);
    vec3 dark = vec3(0.380, 0.250, 0.140);
    float W = 0.24;                             // plank width
    float col_i = floor(vW.x / W);
    float L = 1.6;                              // plank length, staggered per row
    float off = hash(vec2(col_i, 3.0)) * L;
    float row_i = floor((vW.z + off) / L);
    float tone = hash(vec2(col_i, row_i));
    vec3 col = mix(oak, dark, 0.15 + tone * 0.3);
    float fx = fract(vW.x / W), fz = fract((vW.z + off) / L);
    float seam = max(1.0 - smoothstep(0.0, 0.025, min(fx, 1.0 - fx)), 1.0 - smoothstep(0.0, 0.006, min(fz, 1.0 - fz)));
    col = mix(col, dark * 0.75, seam * 0.6);
    float grainLine = sin((vW.x * 90.0) + sin(vW.z * 3.0 + tone * 6.0) * 2.0) * 0.5 + 0.5;
    col *= 0.95 + grainLine * 0.06;
    col *= 1.0 - 0.3 * exp(-vW.z * 2.6);       // shade near the wall corner
    col += grainAt() * 0.03;
    col *= vignette();
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`

// Where the tiles start (fraction of the screen height); before the tiles exist, 0.82.
function tilesTopFraction(h: number) {
  const tiles = document.querySelector('.tiles')
  return tiles ? tiles.getBoundingClientRect().top / h : 0.82
}

function RoomScene() {
  const reduceMotion = useReducedMotion()
  const uiLayout = useUiLayoutVersion()
  const { gl, scene, camera, size, viewport } = useThree()
  const setupRef = useRef<SetupParts>(null)

  const uniforms = useMemo(() => ({ uRes: { value: new THREE.Vector2(1, 1) }, uDpr: { value: 1 } }), [])
  const blobTex = useMemo(() => blobTexture(), [])

  // environment light (RoomEnvironment through PMREM)
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    scene.environmentIntensity = 0.75
    return () => { scene.environment = null; env.dispose(); pmrem.dispose() }
  }, [gl, scene])

  // ---- framing: the wall/floor corner (y=0, z=0) lands on the horizon line ----
  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    const { width: w, height: h } = size
    if (!w || !h) return
    const dpr = viewport.dpr
    uniforms.uRes.value.set(w * dpr, h * dpr)
    uniforms.uDpr.value = dpr
    cam.aspect = w / h
    const horizon = THREE.MathUtils.clamp(tilesTopFraction(h) - 0.14, 0.56, 0.7)
    const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2))
    const pitch = Math.atan(CAM_H / CAM_D) - Math.atan((2 * horizon - 1) * tanV)
    cam.position.set(0, CAM_H, CAM_D)
    cam.rotation.set(-pitch, 0, 0)
    cam.updateProjectionMatrix()
    // narrow screens: shrink the setup so it fits the width
    const visibleW = 2 * (CAM_D - 0.6) * tanV * cam.aspect
    setupRef.current?.setup.scale.setScalar(THREE.MathUtils.clamp((visibleW * 0.8) / 2.1, 0.5, 1))
  }, [camera, size, viewport.dpr, uniforms, reduceMotion, uiLayout])

  return (
    <>
      <hemisphereLight args={[0xfff4e6, 0xb8a58a, 0.9]} />
      <directionalLight color={0xffffff} intensity={2.0} position={[-3, 5, 6]} />

      <mesh position={[0, 7, 0]}>
        <planeGeometry args={[40, 14]} />
        <shaderMaterial uniforms={uniforms} vertexShader={vert} fragmentShader={wallFrag} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 15]}>
        <planeGeometry args={[40, 30]} />
        <shaderMaterial uniforms={uniforms} vertexShader={vert} fragmentShader={floorFrag} />
      </mesh>
      <mesh position={[0, 0.045, 0.0125]}>
        <boxGeometry args={[40, 0.09, 0.025]} />
        <meshStandardMaterial color={0xe9dcc4} roughness={0.8} />
      </mesh>
      {/* soft shadow on the wall behind the desk */}
      <mesh position={[0.1, 0.85, 0.004]}>
        <planeGeometry args={[2.4, 1.3]} />
        <meshBasicMaterial map={blobTex} transparent opacity={0.16} depthWrite={false} toneMapped={false} />
      </mesh>

      <DeskSetup ref={setupRef} reduceMotion={reduceMotion} blobTex={blobTex} />
    </>
  )
}

// paused: a section is open in front of the room; render only when needed
export function RoomCanvas({ paused = false }: { paused?: boolean }) {
  return (
    <div className="room-canvas" aria-hidden="true">
      <Canvas
        frameloop={paused ? 'demand' : 'always'}
        dpr={[1, 2]}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        camera={{ fov: FOV, near: 0.1, far: 100, position: [0, CAM_H, CAM_D] }}
      >
        <RoomScene />
      </Canvas>
    </div>
  )
}
