import { lazy, Suspense, useCallback, useState } from 'react'
import type { SectionId } from './data/content'
import { watchFirstFrames } from './perf/lightMode'
import { useQuality } from './perf/quality'
import { SectionHost, type ActiveSection, type SectionPhase } from './sections/SectionHost'
import { CategoryTiles } from './ui/CategoryTiles'
import { LangToggle } from './ui/LangToggle'
import { LightName } from './ui/LightName'
import { SectionKeys, type KeyRect } from './ui/SectionKeys'
import { SpeechBubbles } from './ui/SpeechBubble'

// The 3D (three.js + R3F) loads on its own chunk: the light version never downloads it.
const RoomCanvas = lazy(() => import('./scene/Room').then((m) => ({ default: m.RoomCanvas })))
const NameCanvas = lazy(() => import('./scene/NameScene').then((m) => ({ default: m.NameCanvas })))

export default function App() {
  const { light, pinned, goLight } = useQuality()
  const [active, setActive] = useState<ActiveSection | null>(null)
  const [phase, setPhase] = useState<SectionPhase | null>(null)

  // a slow start (< 24 fps over the first 2 s after the room is created) switches to the light version
  const onRoomReady = useCallback(() => { if (!pinned) watchFirstFrames(goLight) }, [pinned, goLight])

  const open = useCallback((id: SectionId, from: KeyRect) => {
    setActive({ id, from }); setPhase('opening')
  }, [])
  const closed = useCallback(() => { setActive(null); setPhase(null) }, [])

  // keys, tiles and the language pill fade out while a section is open, and come back as it closes
  const uiHidden = !!active && phase !== 'closing'
  // the 3D behind rests once the section is fully open
  const paused = phase === 'open'

  return (
    <>
      {light ? <div className="light-bg" aria-hidden="true" /> : <Suspense fallback={null}><RoomCanvas paused={paused} onReady={onRoomReady} /></Suspense>}
      {light ? <LightName /> : <><h1 className="sr-only">Santiago Boada.dev</h1><Suspense fallback={null}><NameCanvas paused={paused} /></Suspense></>}
      <SectionKeys onOpen={open} disabled={uiHidden} hiddenKey={active?.id ?? null} />
      <CategoryTiles hidden={uiHidden} />
      <LangToggle placement="corner" hidden={uiHidden} />
      {!light && <SpeechBubbles enabled={!active} />}
      <SectionHost active={active} phase={phase} light={light} onPhase={setPhase} onClosed={closed} />
    </>
  )
}
