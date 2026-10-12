import { useCallback, useEffect, useState } from 'react'
import { NAME_LINES, SECTIONS, type SectionId } from './data/content'
import { useLang } from './i18n/lang'
import { watchFirstFrames } from './perf/lightMode'
import { useQuality } from './perf/quality'
import { NameCanvas } from './scene/NameScene'
import { RoomCanvas } from './scene/Room'
import { SectionHost, type ActiveSection, type SectionPhase } from './sections/SectionHost'
import { CategoryTiles } from './ui/CategoryTiles'
import { LangToggle } from './ui/LangToggle'
import { SectionKeys, type KeyRect } from './ui/SectionKeys'
import { SpeechBubbles } from './ui/SpeechBubble'

// Light version: no WebGL at all, the name as HTML text in the same place.
function LightName() {
  return <h1 className="light-name" aria-label="Santiago Boada.dev">{NAME_LINES.map((l) => <span key={l}>{l}</span>)}</h1>
}

export default function App() {
  const { light, reason, pinned, goLight } = useQuality()
  const { lang, t } = useLang()
  const [active, setActive] = useState<ActiveSection | null>(null)
  const [phase, setPhase] = useState<SectionPhase | null>(null)

  // a slow start (< 24 fps over the first 2 s) switches to the light version
  useEffect(() => {
    if (light || pinned) return
    return watchFirstFrames(goLight)
  }, [light, pinned, goLight])

  const open = useCallback((id: SectionId, from: KeyRect) => {
    setActive({ id, from }); setPhase('opening')
  }, [])
  const closed = useCallback(() => { setActive(null); setPhase(null) }, [])

  // keys, tiles and the language pill fade out while a section is open, and come back as it closes
  const uiHidden = !!active && phase !== 'closing'

  return (
    <>
      {light ? <div className="light-bg" aria-hidden="true" /> : <RoomCanvas />}
      {light ? <LightName /> : <><h1 className="sr-only">Santiago Boada.dev</h1><NameCanvas /></>}
      <SectionKeys onOpen={open} disabled={uiHidden} hiddenKey={active?.id ?? null} />
      <CategoryTiles hidden={uiHidden} />
      <LangToggle placement="corner" hidden={uiHidden} />
      {!light && <SpeechBubbles enabled={!active} />}
      <SectionHost active={active} phase={phase} light={light} onPhase={setPhase} onClosed={closed} />
      {import.meta.env.DEV && (
        <div className="dev-chip">
          {light ? `light (${reason})` : 'full 3D'} · {lang} · {SECTIONS.map((s) => t(s.label)).join(' · ')}
        </div>
      )}
    </>
  )
}
