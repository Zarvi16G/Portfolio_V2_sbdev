import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

// A THREE.Timer per animated component (three's replacement for Clock).
// Call timer.update() once at the start of each useFrame, then read getDelta() / getElapsed().
// connect(document) uses the Page Visibility API, so a hidden tab does not produce a huge delta.
export function useTimer() {
  const timer = useMemo(() => new THREE.Timer(), [])
  useEffect(() => {
    timer.connect(document)
    return () => timer.dispose()
  }, [timer])
  return timer
}
