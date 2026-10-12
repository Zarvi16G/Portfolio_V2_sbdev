import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { clearUrlMode, detectDevice, readPref, readUrlMode, savePref, watchFrameRate, type Mode, type Pref } from './lightMode'

type Ctx = {
  light: boolean          // what is shown now
  pref: Pref              // what the selector shows: auto, full or lite
  auto: Mode              // what the automatic detection picked (shown with a dot when pref is auto)
  loading: boolean        // the 3D is chosen but its canvas is not up yet
  notice: boolean         // "Light version for this device · Load 3D"
  choose: (p: Pref) => void
  dismissNotice: () => void
  roomReady: () => void   // called by the room canvas once it is created
}
const QualityContext = createContext<Ctx | null>(null)

export function QualityProvider({ children }: { children: ReactNode }) {
  const [url, setUrl] = useState<Mode | null>(readUrlMode)
  const [pref, setPref] = useState<Pref>(readPref)
  const [auto, setAuto] = useState<Mode>(detectDevice)
  const [ready, setReady] = useState(false)
  const [notice, setNotice] = useState(false)
  const stopWatch = useRef<(() => void) | null>(null)

  const mode: Mode = url ?? (pref === 'auto' ? auto : pref)
  const light = mode === 'lite'

  const choose = useCallback((p: Pref) => {
    stopWatch.current?.(); stopWatch.current = null
    setUrl(null); clearUrlMode()
    setPref(p); savePref(p)
    setNotice(false)
    // back to automatic: start again from the device checks (the frame-rate check runs once the 3D is up)
    if (p === 'auto') setAuto(detectDevice())
  }, [])

  // leaving the 3D: its canvas is gone, the next 3D load starts "not ready"
  useEffect(() => { if (light) setReady(false) }, [light])

  // the frame-rate check: only when the automatic detection decides, never in development, never saved
  const roomReady = useCallback(() => {
    setReady(true)
    if (import.meta.env.DEV || url || pref !== 'auto') return
    stopWatch.current?.()
    stopWatch.current = watchFrameRate(() => { setAuto('lite'); setNotice(true) })
  }, [url, pref])

  useEffect(() => () => stopWatch.current?.(), [])

  // the notice stays 5 s
  useEffect(() => {
    if (!notice) return
    const id = setTimeout(() => setNotice(false), 5000)
    return () => clearTimeout(id)
  }, [notice])

  const value = useMemo<Ctx>(() => ({
    light, pref: url ?? pref, auto, loading: !light && !ready, notice,
    choose, dismissNotice: () => setNotice(false), roomReady,
  }), [light, url, pref, auto, ready, notice, choose, roomReady])

  return <QualityContext.Provider value={value}>{children}</QualityContext.Provider>
}

export function useQuality() {
  const ctx = useContext(QualityContext)
  if (!ctx) throw new Error('useQuality must be used inside <QualityProvider>')
  return ctx
}
