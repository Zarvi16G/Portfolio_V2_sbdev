import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import type { SectionId } from './data/content'
import { useQuality } from './perf/quality'
import { SectionHost, type ActiveSection, type SectionPhase } from './sections/SectionHost'
import { CategoryTiles } from './ui/CategoryTiles'
import { LightName } from './ui/LightName'
import { LiteRoom } from './ui/LiteRoom'
import { QualityNotice } from './ui/QualityNotice'
import { SectionKeys, type KeyRect } from './ui/SectionKeys'
import { SpeechBubbles } from './ui/SpeechBubble'
import { Toggles } from './ui/Toggles'

// The 3D (three.js + R3F) loads on its own chunk: the light version never downloads it.
const RoomCanvas = lazy(() => import('./scene/Room').then((m) => ({ default: m.RoomCanvas })))
const NameCanvas = lazy(() => import('./scene/NameScene').then((m) => ({ default: m.NameCanvas })))

export default function App() {
  const { light, roomReady } = useQuality()
  const [active, setActive] = useState<ActiveSection | null>(null)
  const [phase, setPhase] = useState<SectionPhase | null>(null)


  const open = useCallback((id: SectionId, from: KeyRect) => {
    setActive({ id, from }); setPhase('opening')
  }, [])
  const closed = useCallback(() => { setActive(null); setPhase(null) }, [])

  // keys, tiles and the language pill fade out while a section is open, and come back as it closes
  const uiHidden = !!active && phase !== 'closing'
  // the 3D behind rests once the section is fully open
  const paused = phase === 'open'
  // fully open: the name stays hidden and the room zoomed even if the version is switched meanwhile (index.css)
  useEffect(() => { document.body.classList.toggle('section-open', paused) }, [paused])

  return (
    <>
      {!light && <Suspense fallback={null}><RoomCanvas paused={paused} onReady={roomReady} /></Suspense>}
      {light ? <LightName /> : <><h1 className="sr-only">Santiago Boada.dev</h1><Suspense fallback={null}><NameCanvas paused={paused} /></Suspense></>}
      <SectionKeys onOpen={open} disabled={uiHidden} hiddenKey={active?.id ?? null} />
      <CategoryTiles hidden={uiHidden} />
      {/* after the keys and tiles in the DOM, so the person / plant buttons come later in the tab order */}
      {light && <LiteRoom hidden={uiHidden} />}
      <Toggles placement="corner" hidden={uiHidden} />
      <QualityNotice />
      <SpeechBubbles enabled={!active} />
      <SectionHost active={active} phase={phase} light={light} onPhase={setPhase} onClosed={closed} />
    </>
  )
}
